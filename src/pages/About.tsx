import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FAQSection from "@/components/FAQSection";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const solutions = [
  { title: "Payments", desc: "Accept payments quickly, easily & securely. Let shoppers pay their way with multiple payment options." },
  { title: "POS", desc: "Sync your in-store and online business with the industry's leading Point of Sale." },
  { title: "Online Store", desc: "Go digital in minutes with your own e-commerce website and start selling online." },
  { title: "QR Solutions", desc: "Provide a contactless ordering experience, accept payments & more with your store's QR code." },
];

const stats = [
  { number: "30mn+", label: "Transactions" },
  { number: "8mn+", label: "Merchants" },
  { number: "100+", label: "Integrations" },
  { number: "80mn+", label: "Catalog Items" },
];

const About = () => {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero - Dark */}
      <section className="bg-hero-dark pt-24 pb-20 md:pt-32 md:pb-28 min-h-[80vh] flex items-center">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-hero-dark-foreground/60 uppercase tracking-[0.2em] text-sm mb-6"
          >
            About Us
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-hero-dark-foreground tracking-tight max-w-4xl mx-auto"
          >
            Sometimes all it takes is a moment to bring about a revolution.
          </motion.h1>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">
              The FataFat story
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Three friends, meeting for coffee — seems like a normal day. Except, this wasn't just a regular catch up. It was here where an idea was born. Digitally enabling businesses with simple technology. There's been no looking back since. What started as a QR based mobile ordering experience soon turned into an end to end digital solution for all kinds & sizes of businesses.
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16 max-w-4xl mx-auto"
          >
            <img
              src="/images/hero-about.jpg"
              alt="FataFat team"
              className="rounded-2xl w-full shadow-lg"
              loading="lazy"
            />
          </motion.div>
        </div>
      </section>

      {/* Solutions */}
      <section className="py-20 bg-section-alt">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-14">
            Flexible business solutions for omni-channel selling
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {solutions.map((sol, i) => (
              <motion.div
                key={sol.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-6"
              >
                <h3 className="font-heading font-bold mb-2">{sol.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{sol.desc}</p>
                <Link to="/contact" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Know More <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-hero-dark">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-center text-hero-dark-foreground mb-14">
            Fuelling India's economic growth by enabling participation by all types & sizes of businesses.
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-heading font-bold text-primary mb-2">{stat.number}</div>
                <div className="text-hero-dark-foreground/60 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8 text-center max-w-4xl">
          <motion.blockquote
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xl md:text-2xl font-heading font-medium italic text-muted-foreground leading-relaxed"
          >
            "There is a huge opportunity in front of us. We are building a transparent, meaningful, & customer-centric business & helping our merchants do the same."
          </motion.blockquote>
        </div>
      </section>

      <FAQSection />
      <Footer />
    </div>
  );
};

export default About;
