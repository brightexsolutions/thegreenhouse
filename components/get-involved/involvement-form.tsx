"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { normalisePhone } from "@/lib/phone";

const PARTNER_TYPES = [
  "Media / content partner",
  "Venue partner",
  "Event service provider",
  "Corporate / brand sponsor",
  "Church partnership",
  "Other",
];

const schema = z.object({
  full_name:    z.string().min(2, "Full name is required"),
  email:        z.string().email("A valid email is required"),
  phone:        z.string().optional(),
  interest:     z.enum(["worship_team", "host_venue", "vision_carrier", "creative_team", "partner", "give", "attend", "other"]),
  partner_type: z.string().optional(),
  message:      z.string().max(400).optional(),
}).refine(
  (d) => d.interest !== "partner" || !!d.partner_type?.trim(),
  { message: "Please describe the type of partnership", path: ["partner_type"] }
);

type FormData = z.infer<typeof schema>;

const INTEREST_OPTIONS = [
  { value: "attend",         label: "I just want to attend sessions" },
  { value: "worship_team",   label: "Worship team — vocalist or instrumentalist" },
  { value: "host_venue",     label: "Host a venue for a session" },
  { value: "vision_carrier", label: "Vision Carrier — help shape the community" },
  { value: "creative_team",  label: "Creative team — photography, design, video" },
  { value: "partner",        label: "Partnership — work together on something" },
  { value: "give",           label: "Support financially — contribute to the work" },
  { value: "other",          label: "Something else" },
];

function inputCls(hasError: boolean) {
  return cn(
    "w-full px-4 py-3 rounded-2xl border text-sm text-charcoal bg-white",
    "placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-forest/20 focus:border-forest/40",
    "transition-all duration-150",
    hasError ? "border-red-300 focus:ring-red-200 focus:border-red-400" : "border-mist hover:border-forest/20"
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
        <label className="text-sm font-semibold text-charcoal/80">{label}</label>
        {hint && <span className="text-xs text-charcoal/40">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

type GivingSettings = { giving_paybill?: string; giving_account?: string; giving_till?: string; giving_phone?: string };

export function InvolvementForm() {
  const [submitted,      setSubmitted]      = useState(false);
  const [serverError,    setServerError]    = useState<string | null>(null);
  const [givingSettings, setGivingSettings] = useState<GivingSettings>({});

  useEffect(() => {
    fetch("/api/giving-settings")
      .then(r => r.json())
      .then((d: GivingSettings) => setGivingSettings(d))
      .catch(() => {});
  }, []);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { interest: "attend" },
  });

  const interest = watch("interest");
  const phone    = watch("phone");

  function handlePhoneBlur() {
    if (phone?.trim()) setValue("phone", normalisePhone(phone.trim()), { shouldValidate: false });
  }

  async function onSubmit(data: FormData) {
    setServerError(null);
    const res = await fetch("/api/get-involved", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setServerError(body?.error ?? "Something went wrong. Please try again.");
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="py-12 text-center">
        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-forest/10 border border-forest/20 flex items-center justify-center">
          <CheckCircle2 className="text-forest" size={28} />
        </div>
        <h3 className="font-display text-2xl font-semibold text-forest mb-2">We&apos;ve got your message</h3>
        <p className="text-charcoal/60 text-sm leading-relaxed max-w-xs mx-auto">
          Someone from the team will be in touch soon. Check your inbox — we&apos;ve sent you a copy of your message.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <Field label="Full name" error={errors.full_name?.message}>
        <input
          {...register("full_name")}
          placeholder="Amara Wanjiku"
          className={inputCls(!!errors.full_name)}
        />
      </Field>

      <Field label="Email address" error={errors.email?.message}>
        <input
          {...register("email")}
          type="email"
          placeholder="you@example.com"
          className={inputCls(!!errors.email)}
        />
      </Field>

      <Field label="Phone number" hint="Optional" error={errors.phone?.message}>
        <input
          {...register("phone")}
          type="tel"
          placeholder="0712 345 678"
          onBlur={handlePhoneBlur}
          className={inputCls(!!errors.phone)}
        />
      </Field>

      <Field label="I'm interested in" error={errors.interest?.message}>
        <select {...register("interest")} className={inputCls(!!errors.interest)}>
          {INTEREST_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </Field>

      {/* Partnership type — shown when interest = partner */}
      {interest === "partner" && (
        <Field label="Type of partnership" error={errors.partner_type?.message}>
          <select {...register("partner_type")} className={inputCls(!!errors.partner_type)}>
            <option value="">e.g. Media partner, Venue partner, Sponsor…</option>
            {PARTNER_TYPES.map((pt) => (
              <option key={pt} value={pt}>{pt}</option>
            ))}
          </select>
        </Field>
      )}

      {/* Financial giving — show payment info */}
      {interest === "give" && (
        <div className="rounded-2xl border border-gold/30 bg-gold/5 p-4 space-y-1.5">
          <p className="text-xs font-semibold text-forest uppercase tracking-wider">Support The Green House</p>
          <p className="text-sm text-charcoal/70 leading-relaxed">
            Every contribution goes directly towards venue costs, equipment, and keeping sessions free for everyone.
          </p>
          <div className="mt-3 space-y-1 text-sm text-charcoal/80 font-medium">
            {givingSettings.giving_paybill && (
              <p>M-Pesa Paybill: <span className="font-bold text-forest">{givingSettings.giving_paybill}</span>{givingSettings.giving_account && <> · Acc: <span className="font-bold text-forest">{givingSettings.giving_account}</span></>}</p>
            )}
            {givingSettings.giving_till && (
              <p>Till / Buy Goods: <span className="font-bold text-forest">{givingSettings.giving_till}</span></p>
            )}
            {givingSettings.giving_phone && (
              <p>Send to: <span className="font-bold text-forest">{givingSettings.giving_phone}</span></p>
            )}
            {!givingSettings.giving_paybill && !givingSettings.giving_till && !givingSettings.giving_phone && (
              <p className="text-charcoal/50 italic text-xs">Payment details coming soon — fill in the form and we&apos;ll be in touch.</p>
            )}
          </div>
          <p className="text-xs text-charcoal/45 mt-2">Fill in the form below so we can acknowledge your support.</p>
        </div>
      )}

      <Field label="Anything else you'd like us to know" hint="Optional" error={errors.message?.message}>
        <textarea
          {...register("message")}
          rows={3}
          placeholder={
            interest === "partner"
              ? "Tell us about your organisation and what kind of collaboration you have in mind…"
              : interest === "give"
              ? "Let us know how you'd like to contribute or any questions you have…"
              : "Tell us a bit about yourself, your church, or what draws you here…"
          }
          className={cn(inputCls(!!errors.message), "resize-none")}
        />
      </Field>

      {serverError && (
        <p className="text-sm text-red-500 text-center">{serverError}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full bg-forest text-cream text-sm font-semibold hover:bg-moss transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <><Loader2 size={15} className="animate-spin" />Sending…</>
        ) : (
          "Send my details"
        )}
      </button>

      <p className="text-center text-xs text-charcoal/40 leading-relaxed">
        We don&apos;t spam. Your details are only used to follow up on your interest.
      </p>
    </form>
  );
}
