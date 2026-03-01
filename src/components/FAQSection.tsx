import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Is FataFat right for my business?",
    a: "FataFat's ecosystem is tailored to meet the needs of companies of all sizes and types. With integrations with all popular online sales channels, in-store billing, inventory management, and reporting and analytics, businesses can streamline operations. Moreover, we assist businesses in building online ecommerce stores as well as marketing and CRM systems.",
  },
  {
    q: "How to connect with FataFat?",
    a: "Interested in a free demo? Click the Get Started button to request it. Our tech expert will contact you shortly to schedule a custom demo for your business.",
  },
  {
    q: "How much does the product cost?",
    a: "The pricing of our products depends on your needs. To find out the pricing for your business, please contact us through our Contact page.",
  },
];

const FAQSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8 max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-12">
          FAQ's
        </h2>
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="border border-border rounded-lg px-6"
            >
              <AccordionTrigger className="text-left font-semibold text-base hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQSection;
