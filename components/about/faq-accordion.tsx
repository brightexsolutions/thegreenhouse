import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FadeIn } from "@/components/motion/fade-in";
import { SESSION_FREQUENCY } from "@/lib/constants";

const faqs = [
  {
    q: "Who is The Green House for?",
    a: "Anyone. It doesn't matter which church you attend, your denomination, or whether you're a regular churchgoer. If you're curious and open, you're welcome.",
  },
  {
    q: "How often do sessions happen?",
    a: `Sessions are ${SESSION_FREQUENCY} — four times a year. We keep it rare so each gathering feels meaningful.`,
  },
  {
    q: "Is it free to attend?",
    a: "Yes. Entry is free. Some future sessions may have a small contribution for venue costs, but this will always be clearly communicated.",
  },
  {
    q: "Do I need to be a Christian to come?",
    a: "No performance of faith is required. Come curious. Come sceptical. Come broken. All are genuinely welcome.",
  },
  {
    q: "Can I bring someone who doesn't go to church?",
    a: "Absolutely — that's the point. The Green House is designed to be accessible for people at any point in their faith journey.",
  },
  {
    q: "How do I stay informed about upcoming sessions?",
    a: "Register on this site and you'll receive an email or WhatsApp notification before each session. You can also join our WhatsApp broadcast list.",
  },
];

export function FaqAccordion() {
  return (
    <section className="py-20 md:py-28 bg-cream">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-12">
            <span className="label-caps text-gold">Questions</span>
            <h2 className="font-display text-4xl md:text-5xl font-semibold text-forest mt-2">
              Common questions
            </h2>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <Accordion type="single" collapsible className="space-y-2">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border border-mist rounded-2xl px-6 data-[state=open]:bg-[#f5f3ee] transition-colors"
              >
                <AccordionTrigger className="text-left font-medium text-forest hover:no-underline py-5 text-sm sm:text-base">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-charcoal/60 text-sm leading-relaxed pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </FadeIn>
      </div>
    </section>
  );
}
