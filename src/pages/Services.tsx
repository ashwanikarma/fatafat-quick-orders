import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FAQSection from "@/components/FAQSection";
import AdvantageSection from "@/components/AdvantageSection";

const features = [
  {
    title: "Know & engage your audience.",
    desc: "Segment your customers into unique groups based on their shopping behaviours and deliver personalised messages through in-built SMS marketing. Reward loyal customers with a loyalty program.",
    img: "/images/hero-services.jpg",
  },
  {
    title: "Convert client insights into revenue.",
    desc: "With our powerful segmentation and filtering, map your customer behaviour in detail through their purchase history, spending habits, and preferences to deliver a great service.",
    img: "/images/pos-dashboard.jpg",
  },
  {
    title: "Power up your payments with our ePOS.",
    desc: "Raise instant invoices, send reminders and payment links via SMS and Whatsapp to receive payments.",
    img: "/images/qr-solution.jpg",
  },
];

const marketingFeatures = [
  {
    title: "Accelerate promotions with Facebook and Google ads.",
    desc: "Set-up and run Facebook and Google ads from our central dashboard, no need to login into any other account.",
  },
  {
    title: "Acquire new clients with abandoned cart reminders.",
    desc: "Get all the details to connect with clients who left mid way to help them complete the purchase.",
  },
];

const Services = () => {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-16 min-h-[80vh] flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/images/hero-services.jpg)" }}
        />
        <div className="absolute inset-0 bg-foreground/50" />
        <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center py-20">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-hero-dark-foreground tracking-tight mb-4"
          >
            Everything to convert your <br className="hidden md:block" /> passion into a profession.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-hero-dark-foreground/80 text-lg mb-8"
          >
            Attract new clients, retain old ones, simplify appointments and payments.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Link to="/contact">
              <Button size="lg" className="rounded-full px-8">Get Started</Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Customer service */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-4">
            Deliver exceptional customer service.
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-16">
            Understand your customers better and always exceed expectations with our customer relationship management tools.
          </p>
          <div className="space-y-16">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`flex flex-col ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} gap-10 items-center`}
              >
                <div className="flex-1">
                  <h3 className="text-2xl font-heading font-bold mb-4">{feat.title}</h3>
                  <p className="text-muted-foreground">{feat.desc}</p>
                </div>
                <div className="flex-1">
                  <img src={feat.img} alt={feat.title} className="rounded-2xl w-full shadow-lg" loading="lazy" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Marketing */}
      <section className="py-20 bg-section-alt">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-4">
            Master Sales with Marketing Suite.
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-14">
            Supercharge your sales with in-built marketing tools to create posts, run ads and promote your store across all the important digital channels.
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            {marketingFeatures.map((mf, i) => (
              <motion.div
                key={mf.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-8"
              >
                <h3 className="text-lg font-heading font-bold mb-3">{mf.title}</h3>
                <p className="text-sm text-muted-foreground">{mf.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <AdvantageSection />
      <FAQSection />
      <Footer />
    </div>
  );
};

export default Services;
