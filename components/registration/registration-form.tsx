"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle2, Leaf, Download, Mail, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalisePhone } from "@/lib/phone";
import { REGISTRATION_SUPPORT_WA } from "@/lib/constants";
import type { Event } from "@/types/database";

const formSchema = z.object({
  first_name:      z.string().min(2, "First name required"),
  last_name:       z.string().min(2, "Last name required"),
  email:           z.string().email("Invalid email").optional().or(z.literal("")),
  phone:           z.string().min(9, "Invalid phone number").optional().or(z.literal("")),
  role:            z.enum(["guest","vocalist","instrumentalist","vision_carrier","curious"]),
  source:          z.enum(["friend","whatsapp","instagram","church","website","other"]),
  whatsapp_opt_in: z.boolean(),
  photo_consent:   z.boolean(),
  notes:           z.string().max(200).optional(),
}).refine((d) => d.email || d.phone, {
  message: "Please provide at least an email or phone number",
  path:    ["email"],
});

type FormData = z.infer<typeof formSchema>;

const ROLE_OPTIONS = [
  { value: "guest",           label: "Just attending" },
  { value: "curious",         label: "Curious / first time" },
  { value: "vision_carrier",  label: "Vision Carrier" },
  { value: "vocalist",        label: "Vocalist / worship" },
  { value: "instrumentalist", label: "Instrumentalist" },
];

const SOURCE_OPTIONS = [
  { value: "friend",    label: "A friend" },
  { value: "whatsapp",  label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "church",    label: "My church" },
  { value: "website",   label: "Found the site" },
  { value: "other",     label: "Other" },
];

interface RegistrationFormProps {
  event: Pick<Event, "id" | "slug" | "title" | "event_date" | "venue_name" | "theme_title">;
  onSuccess?: (hasEmail: boolean) => void;
}

export function RegistrationForm({ event, onSuccess }: RegistrationFormProps) {
  const [submitted,    setSubmitted]    = useState(false);
  const [ticketToken,  setTicketToken]  = useState<string | null>(null);
  const [ticketUrl,    setTicketUrl]    = useState<string | null>(null);
  const [waShareUrl,   setWaShareUrl]   = useState<string | null>(null);
  const [copied,       setCopied]       = useState(false);
  const [apiError,     setApiError]     = useState<string | null>(null);

  async function copyTicketUrl() {
    if (!ticketUrl) return;
    await navigator.clipboard.writeText(ticketUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { role: "guest", source: "friend", whatsapp_opt_in: false, photo_consent: false },
  });

  const emailValue = watch("email");
  const phone      = watch("phone");

  function handlePhoneBlur() {
    if (phone) setValue("phone", normalisePhone(phone), { shouldValidate: false });
  }

  async function onSubmit(data: FormData) {
    setApiError(null);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, event_id: event.id }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setApiError(body?.error ?? "Something went wrong. Please try again.");
      return;
    }

    const body = await res.json().catch(() => ({}));
    setTicketToken(body.ticketToken ?? null);
    setTicketUrl(body.ticketUrl ?? null);
    setWaShareUrl(body.waShareUrl ?? null);
    setSubmitted(true);
    onSuccess?.(!!data.email?.trim());
  }

  /* ── Success screen ─────────────────────────────────────── */
  if (submitted) {
    const hasEmail   = !!(emailValue?.trim());
    const pdfUrl     = ticketToken ? `/api/ticket/${ticketToken}/pdf` : null;
    const ticketPageUrl = ticketToken ? `/ticket/${ticketToken}` : null;

    return (
      <div className="py-8 text-center">
        {/* Animated leaf icon */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full bg-forest/10 animate-ping opacity-40" />
          <div className="relative w-20 h-20 rounded-full bg-forest/10 border border-forest/20 flex items-center justify-center">
            <Leaf className="text-forest" size={28} />
          </div>
        </div>

        <h3 className="font-display text-2xl font-semibold text-forest mb-2">You&apos;re registered</h3>

        {/* ── Email path ───────────────────────────────────── */}
        {hasEmail && (
          <>
            <p className="text-charcoal/60 text-sm max-w-xs mx-auto leading-relaxed mb-6">
              Your ticket has been sent to your email. We look forward to seeing you.
            </p>
            <div className="inline-flex items-center gap-2 text-sm text-forest/70 bg-forest/5 px-5 py-2.5 rounded-full border border-forest/15">
              <CheckCircle2 size={14} />
              Check your email for your ticket
            </div>
          </>
        )}

        {/* ── Phone-only path ──────────────────────────────── */}
        {!hasEmail && (
          <>
            <p className="text-charcoal/60 text-sm max-w-xs mx-auto leading-relaxed mb-6">
              Your spot is confirmed. Download your ticket below or send it to yourself on WhatsApp — you&apos;ll need it at the door.
            </p>

            <div className="space-y-3 max-w-xs mx-auto">
              {/* Primary: download PDF */}
              {pdfUrl && (
                <a
                  href={pdfUrl}
                  download={`ticket-${ticketToken}.pdf`}
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-full bg-forest text-cream text-sm font-semibold hover:bg-moss transition-all duration-200"
                >
                  <Download size={15} />
                  Download ticket (PDF)
                </a>
              )}

              {/* Secondary: copy link + WhatsApp */}
              <div className="flex gap-2 justify-center">
                <button
                  onClick={copyTicketUrl}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full border border-forest/20 text-sm font-medium text-forest hover:bg-forest/5 transition-colors"
                >
                  <CheckCircle2 size={13} />
                  {copied ? "Copied!" : "Copy link"}
                </button>
                {waShareUrl && (
                  <a
                    href={waShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#25d366] text-white text-sm font-medium hover:bg-[#20b858] transition-colors"
                  >
                    {/* WhatsApp icon */}
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="currentColor" aria-hidden>
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                    </svg>
                    WhatsApp
                  </a>
                )}
              </div>

              <p className="text-xs text-charcoal/45 leading-relaxed">
                Keep the PDF or link handy — you&apos;ll need it to check in at the door.
              </p>
            </div>
          </>
        )}

        {/* Support note — shown for all registrants */}
        <p className="text-[11px] text-charcoal/38 mt-5 leading-relaxed">
          Didn&apos;t receive your ticket?{" "}
          <a
            href={`https://wa.me/${REGISTRATION_SUPPORT_WA}?text=${encodeURIComponent("Hi, I registered for The Green House but didn't receive my ticket.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-forest/65 underline underline-offset-2 hover:text-forest font-medium"
          >
            Message us on WhatsApp
          </a>
          {" "}or call{" "}
          <a
            href={`tel:+${REGISTRATION_SUPPORT_WA}`}
            className="text-forest/65 underline underline-offset-2 hover:text-forest font-medium"
          >
            +{REGISTRATION_SUPPORT_WA}
          </a>
          {" "}and we&apos;ll help.
        </p>

        {/* Badge teaser — shown for all registrants */}
        {ticketPageUrl && (
          <div className="mt-6 max-w-xs mx-auto">
            <a
              href={ticketPageUrl}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-forest/8 border border-forest/15 hover:bg-forest/12 hover:border-forest/25 transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-[#c9a24a]/15 border border-[#c9a24a]/25 flex items-center justify-center flex-shrink-0">
                <Sparkles size={15} className="text-[#c9a24a]" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-semibold text-forest">You have a digital badge</p>
                <p className="text-xs text-charcoal/50 leading-snug">Customize with your photo &amp; share with friends</p>
              </div>
              <span className="text-forest/30 group-hover:text-forest/60 transition-colors text-sm">→</span>
            </a>
          </div>
        )}
      </div>
    );
  }

  /* ── Form ───────────────────────────────────────────────── */
  return (
    <form onSubmit={handleSubmit(onSubmit)} onChange={() => setApiError(null)} className="space-y-3.5">
      {/* Name row */}
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="First name" error={errors.first_name?.message}>
          <input
            {...register("first_name")}
            placeholder="Amara"
            className={inputCls(!!errors.first_name)}
          />
        </Field>
        <Field label="Last name" error={errors.last_name?.message}>
          <input
            {...register("last_name")}
            placeholder="Wanjiku"
            className={inputCls(!!errors.last_name)}
          />
        </Field>
      </div>

      {/* Email */}
      <Field
        label="Email address"
        hint={emailValue ? undefined : "Optional if you provide a phone"}
        error={errors.email?.message}
      >
        <input
          {...register("email")}
          type="email"
          placeholder="you@example.com"
          className={inputCls(!!errors.email)}
        />
        {emailValue && (
          <p className="flex items-center gap-1 text-[11px] text-forest/70 mt-1">
            <Mail size={11} className="shrink-0" />
            We&apos;ll email your ticket here — nothing else.
          </p>
        )}
      </Field>

      {/* Phone */}
      <Field label="Phone number" hint="Optional if you provide an email" error={errors.phone?.message}>
        <input
          {...register("phone")}
          type="tel"
          placeholder="0712 345 678"
          onBlur={handlePhoneBlur}
          className={inputCls(!!errors.phone)}
        />
      </Field>

      {/* Role + Source in two columns */}
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="Attending as" error={errors.role?.message}>
          <select {...register("role")} className={inputCls(!!errors.role)}>
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
        <Field label="How did you hear?" error={errors.source?.message}>
          <select {...register("source")} className={inputCls(!!errors.source)}>
            {SOURCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </Field>
      </div>

      {/* Comms opt-in */}
      <label className="flex items-start gap-2.5 cursor-pointer group">
        <div className="relative mt-0.5 shrink-0">
          <input {...register("whatsapp_opt_in")} type="checkbox" className="sr-only peer" />
          <div className="w-5 h-5 rounded-md border-2 border-charcoal/25 group-hover:border-forest/60 peer-checked:bg-forest peer-checked:border-forest transition-all" />
          <CheckCircle2 size={13} className="absolute inset-0 m-auto text-cream opacity-0 peer-checked:opacity-100 pointer-events-none" />
        </div>
        <span className="text-[13px] text-charcoal/65 leading-snug">
          Keep me updated about future gatherings and community news
        </span>
      </label>

      {/* Photo consent */}
      <label className="flex items-start gap-2.5 cursor-pointer group">
        <div className="relative mt-0.5 shrink-0">
          <input {...register("photo_consent")} type="checkbox" className="sr-only peer" />
          <div className="w-5 h-5 rounded-md border-2 border-charcoal/25 group-hover:border-forest/60 peer-checked:bg-forest peer-checked:border-forest transition-all" />
          <CheckCircle2 size={13} className="absolute inset-0 m-auto text-cream opacity-0 peer-checked:opacity-100 pointer-events-none" />
        </div>
        <span className="text-[13px] text-charcoal/65 leading-snug">
          I&apos;m okay with being photographed or filmed during the gathering for social media.
          <span className="block text-[11px] text-charcoal/38 mt-0.5">Let us know on the night if you&apos;d prefer not to.</span>
        </span>
      </label>

      {/* Data note */}
      <p className="text-[11px] text-charcoal/45 leading-relaxed border border-mist rounded-xl px-3.5 py-2.5 bg-off-white">
        Your details are stored securely to manage this event and never shared.
      </p>

      {/* API error banner */}
      {apiError && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-3 space-y-2">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={14} className="shrink-0 mt-0.5 text-amber-600" />
            <p className="text-sm text-amber-800 leading-snug font-medium">
              {apiError.toLowerCase().includes("already registered")
                ? "It looks like this contact may have been used before"
                : apiError}
            </p>
          </div>
          {apiError.toLowerCase().includes("already registered") && (
            <div className="pl-[22px] space-y-1.5">
              <p className="text-xs text-amber-700 leading-relaxed">
                If you registered earlier, check your email or WhatsApp for your ticket.
                If someone else used your details, or you need help, reach out below —
                we&apos;ll sort it out before the session.
              </p>
              <a
                href={`https://wa.me/${REGISTRATION_SUPPORT_WA}?text=${encodeURIComponent("Hi, I need help with my registration for The Green House Session 02.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 underline underline-offset-2 hover:text-amber-900"
              >
                <svg viewBox="0 0 24 24" className="w-3 h-3 shrink-0" fill="currentColor" aria-hidden>
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
                Message us on WhatsApp
              </a>
            </div>
          )}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-forest text-cream text-sm font-semibold hover:bg-moss transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <><Loader2 size={15} className="animate-spin" />Registering…</>
        ) : (
          "Reserve my spot — it's free"
        )}
      </button>

      <p className="text-center text-[11px] text-charcoal/45">
        {emailValue ? "Ticket will be sent to your email." : "Provide an email or phone to receive your ticket."}
      </p>

      {/* Support contact */}
      <p className="text-center text-[11px] text-charcoal/40 leading-relaxed">
        Having trouble?{" "}
        <a
          href={`https://wa.me/${REGISTRATION_SUPPORT_WA}?text=${encodeURIComponent("Hi, I need help registering for The Green House.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-forest/70 underline underline-offset-2 hover:text-forest font-medium"
        >
          WhatsApp us
        </a>
        {" "}or call{" "}
        <a
          href={`tel:+${REGISTRATION_SUPPORT_WA}`}
          className="text-forest/70 underline underline-offset-2 hover:text-forest font-medium"
        >
          +{REGISTRATION_SUPPORT_WA}
        </a>
      </p>
    </form>
  );
}

/* ── helpers ────────────────────────────────────────────────────────── */

function inputCls(hasError: boolean) {
  return cn(
    "w-full px-3.5 py-2.5 rounded-xl border text-base text-charcoal bg-off-white",
    "placeholder:text-charcoal/35 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/40",
    "transition-all duration-150",
    hasError
      ? "border-red-300 focus:ring-red-200 focus:border-red-400"
      : "border-charcoal/20 hover:border-forest/30"
  );
}

interface FieldProps {
  label:    string;
  hint?:    string;
  error?:   string;
  children: React.ReactNode;
}

function Field({ label, hint, error, children }: FieldProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-xs font-semibold text-charcoal/65">{label}</label>
        {hint && <span className="text-[10px] text-charcoal/45">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-[11px] text-red-500">{error}</p>}
    </div>
  );
}
