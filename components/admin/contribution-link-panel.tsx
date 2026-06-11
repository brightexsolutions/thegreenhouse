"use client";

import { useState } from "react";
import { BookOpen, Sparkles, Copy, Check, ExternalLink } from "lucide-react";

interface Props {
  eventTitle:             string;
  themeContributionToken: string | null;
  triviaContributionToken: string | null;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://greenhousews.co.ke";

function LinkRow({
  label,
  description,
  icon,
  link,
  waMessage,
}: {
  label:       string;
  description: string;
  icon:        React.ReactNode;
  link:        string;
  waMessage:   string;
}) {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const waUrl = `https://wa.me/?text=${encodeURIComponent(waMessage)}`;

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-forest/8 flex items-center justify-center flex-shrink-0 mt-0.5">
          {icon}
        </div>
        <div>
          <p className="text-xs font-semibold text-charcoal">{label}</p>
          <p className="text-[11px] text-charcoal/45 mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 p-2.5 bg-off-white rounded-xl border border-mist">
        <p className="flex-1 text-[11px] text-charcoal/45 font-mono truncate">{link}</p>
        <button
          onClick={copyLink}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white border border-mist text-[11px] font-semibold text-charcoal/60 hover:border-forest/30 hover:text-forest transition-all flex-shrink-0"
        >
          {copied ? <Check size={10} className="text-green-600" /> : <Copy size={10} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366]/10 text-[#128C7E] border border-[#25D366]/20 text-[11px] font-semibold hover:bg-[#25D366]/20 transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          Share via WhatsApp
        </a>
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-mist text-[11px] font-semibold text-charcoal/50 hover:border-forest/30 hover:text-forest transition-colors"
        >
          <ExternalLink size={10} /> Preview
        </a>
      </div>
    </div>
  );
}

export function ContributionLinkPanel({ eventTitle, themeContributionToken, triviaContributionToken }: Props) {
  if (!themeContributionToken && !triviaContributionToken) return null;

  const themeLink  = themeContributionToken  ? `${SITE_URL}/contribute/theme/${themeContributionToken}`  : null;
  const triviaLink = triviaContributionToken ? `${SITE_URL}/contribute/trivia/${triviaContributionToken}` : null;

  return (
    <div className="bg-white rounded-2xl border border-mist p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-charcoal">Program Contributions</h3>
        <p className="text-xs text-charcoal/50 mt-0.5">
          Share these links with team members so they can prepare content without needing an admin account.
        </p>
      </div>

      <div className="space-y-5">
        {themeLink && (
          <LinkRow
            label="Theme setter"
            description="The person speaking on the theme sets the title, scripture reference, and a short description."
            icon={<BookOpen size={13} className="text-forest" />}
            link={themeLink}
            waMessage={`Hi! 👋 Please set the theme details for *${eventTitle}* using this link:\n${themeLink}`}
          />
        )}

        {themeLink && triviaLink && (
          <div className="border-t border-mist" />
        )}

        {triviaLink && (
          <LinkRow
            label="Trivia preparer"
            description="The person running trivia adds their questions in advance. The admin selects which ones to play on the night."
            icon={<Sparkles size={13} className="text-forest" />}
            link={triviaLink}
            waMessage={`Hi! 👋 Please add trivia questions for *${eventTitle}* using this link:\n${triviaLink}`}
          />
        )}
      </div>
    </div>
  );
}
