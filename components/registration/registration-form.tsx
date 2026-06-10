"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle2, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalisePhone } from "@/lib/phone";
import type { Event } from "@/types/database";

const formSchema = z.object({
  first_name:     z.string().min(2, "First name required"),
  last_name:      z.string().min(2, "Last name required"),
  email:          z.string().email("Invalid email").optional().or(z.literal("")),
  phone:          z.string().min(9, "Invalid phone number").optional().or(z.literal("")),
  role:           z.enum(["guest","vocalist","instrumentalist","vision_carrier","curious"]),
  source:         z.enum(["friend","whatsapp","instagram","church","website","other"]),
  whatsapp_opt_in: z.boolean(),
  notes:          z.string().max(200).optional(),
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
  event: Pick<Event, "id" | "slug" | "title" | "event_date" | "venue_name">;
  onSuccess?: () => void;
}

export function RegistrationForm({ event, onSuccess }: RegistrationFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [ticketUrl,  setTicketUrl]  = useState<string | null>(null);
  const [waShareUrl, setWaShareUrl] = useState<string | null>(null);
  const [copied,     setCopied]     = useState(false);

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
    defaultValues: { role: "guest", source: "friend", whatsapp_opt_in: false },
  });

  const phone = watch("phone");

  function handlePhoneBlur() {
    if (phone) setValue("phone", normalisePhone(phone), { shouldValidate: false });
  }

  async function onSubmit(data: FormData) {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, event_id: event.id }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const err = body?.error ?? "Something went wrong. Please try again.";
      throw new Error(err);
    }

    const responseBody = await res.json().catch(() => ({}));
    setTicketUrl(responseBody.ticketUrl ?? null);
    setWaShareUrl(responseBody.waShareUrl ?? null);
    setSubmitted(true);
    onSuccess?.();
  }

  if (submitted) {
    const hasEmail = !!watch("email");

    return (
      <div className="py-8 text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full bg-forest/10 animate-ping opacity-40" />
          <div className="relative w-20 h-20 rounded-full bg-forest/10 border border-forest/20 flex items-center justify-center">
            <Leaf className="text-forest" size={28} />
          </div>
        </div>
        <h3 className="font-display text-2xl font-semibold text-forest mb-2">You&apos;re registered</h3>
        <p className="text-charcoal/60 text-sm max-w-xs mx-auto leading-relaxed mb-6">
          {hasEmail
            ? "Your ticket has been sent to your email. We look forward to seeing you."
            : "Save your ticket link below — you'll need it at the door."}
        </p>

        {hasEmail && (
          <div className="inline-flex items-center gap-2 text-xs text-forest/60 bg-forest/5 px-4 py-2 rounded-full border border-forest/10">
            <CheckCircle2 size={13} />
            <span>Check your email for your ticket</span>
          </div>
        )}

        {/* Ticket link for phone-only attendees */}
        {!hasEmail && ticketUrl && (
          <div className="mt-2 space-y-3">
            <div className="bg-forest/5 border border-forest/10 rounded-2xl px-4 py-3 text-xs font-mono text-forest/70 break-all">
              {ticketUrl}
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={copyTicketUrl}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-forest/20 text-xs font-medium text-forest hover:bg-forest/5 transition-colors"
              >
                <CheckCircle2 size={12} />
                {copied ? "Copied!" : "Copy link"}
              </button>
              {waShareUrl && (
                <a
                  href={waShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#25d366] text-white text-xs font-medium hover:bg-[#20b858] transition-colors"
                >
                  Send to myself on WhatsApp
                </a>
              )}
            </div>
            <p className="text-[10px] text-charcoal/30">Save this link — you&apos;ll need it to access your ticket</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Name row */}
      <div className="grid grid-cols-2 gap-3">
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

      {/* Contact */}
      <Field label="Email address" hint="Optional if you provide a phone" error={errors.email?.message}>
        <input
          {...register("email")}
          type="email"
          placeholder="you@example.com"
          className={inputCls(!!errors.email)}
        />
      </Field>

      <Field label="Phone number" hint="Optional if you provide an email" error={errors.phone?.message}>
        <input
          {...register("phone")}
          type="tel"
          placeholder="0712 345 678"
          onBlur={handlePhoneBlur}
          className={inputCls(!!errors.phone)}
        />
      </Field>

      {/* Role */}
      <Field label="You're attending as" error={errors.role?.message}>
        <select {...register("role")} className={inputCls(!!errors.role)}>
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Field>

      {/* Source */}
      <Field label="How did you hear about us?" error={errors.source?.message}>
        <select {...register("source")} className={inputCls(!!errors.source)}>
          {SOURCE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Field>

      {/* WhatsApp / comms opt-in */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative mt-0.5 shrink-0">
          <input
            {...register("whatsapp_opt_in")}
            type="checkbox"
            className="sr-only peer"
          />
          <div className="w-4 h-4 rounded border border-mist group-hover:border-forest/40 peer-checked:bg-forest peer-checked:border-forest transition-all" />
          <CheckCircle2
            size={10}
            className="absolute inset-0 m-auto text-cream opacity-0 peer-checked:opacity-100 pointer-events-none"
          />
        </div>
        <span className="text-sm text-charcoal/65 leading-relaxed">
          Keep me updated about future sessions and community news
        </span>
      </label>

      {/* Consent note */}
      <p className="text-xs text-charcoal/50 leading-relaxed border border-mist rounded-2xl px-4 py-3 bg-off-white">
        By registering you consent to The Green House storing your details to manage this event.
        Your information is never sold or shared with third parties.
      </p>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-forest text-cream text-sm font-semibold hover:bg-moss transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={15} className="animate-spin" />
            Registering…
          </>
        ) : (
          "Reserve my spot"
        )}
      </button>

      <p className="text-center text-xs text-charcoal/50 leading-relaxed">
        Entry is free. Ticket sent by email — or save your link if phone only.
      </p>
    </form>
  );
}

/* ------------------------------------------------------------------ */

function inputCls(hasError: boolean) {
  return cn(
    "w-full px-4 py-3 rounded-2xl border text-sm text-charcoal bg-off-white",
    "placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/40",
    "transition-all duration-150",
    hasError
      ? "border-red-300 focus:ring-red-200 focus:border-red-400"
      : "border-mist hover:border-forest/20"
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
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-xs font-semibold text-charcoal/70">{label}</label>
        {hint && <span className="text-xs text-charcoal/50">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
