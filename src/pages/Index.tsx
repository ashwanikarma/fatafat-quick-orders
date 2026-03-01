import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FAQSection from "@/components/FAQSection";
import AdvantageSection from "@/components/AdvantageSection";

const solutions = [
  {
    title: "POS",
    desc: "Sync your in-store and online business with the industry's leading Point of Sale.",
    img: "/images/pos-dashboard.jpg",
    href: "/food-beverage",
  },
  {
    title: "Online Store",
    desc: "Go digital in minutes with your own e-commerce website.",
    img: "/images/online-store.jpg",
    href: "/retail",
  },
  {
    title: "QR Solutions",
    desc: "Provide a contactless ordering experience, accept payments & more with your store's QR code.",
    img: "/images/qr-solution.jpg",
    href: "/food-beverage",
  },
];

const ecosystems = [
  {
    title: "Food & Beverage",
    desc: "Tools that connect the front of house with the back of house and integrate everything you need to run your restaurant into one dashboard.",
    href: "/food-beverage",
  },
  {
    title: "Retail",
    desc: "Everything you need to build and run your e-commerce website with tools like inventory management, marketing and more.",
    href: "/retail",
  },
  {
    title: "Services & Others",
    desc: "All the tools you need to deliver the best customer service with features like ePOS and CRM. Flexible for any use case.",
    href: "/services",
  },
];

const stats = [
  { number: "30mn+", label: "Transactions" },
  { number: "8mn+", label: "Merchants" },
  { number: "100+", label: "Integrations" },
  { number: "80mn+", label: "Catalog Items" },
];

const testimonials = [
  {
    name: "Karthik R.",
    role: "Assistant VP, eCommerce",
    quote: "Clarity of thought behind building the modules and having an answer to the problems we brought up earned the brownie points in choosing FataFat POS.",
  },
  {
    name: "Rajat J.",
    role: "Co-founder, Fast Food Chain",
    quote: "With FataFat's QR solutions, we've been able to reduce our 3rd party commission by a whopping 98%. Growing in this challenging industry is not so difficult anymore.",
  },
  {
    name: "Aparna A.",
    role: "Co-Founder, Restaurant Chain",
    quote: "By far the best inventory management system in the entire market. We love the flow and thought put into developing the product.",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold tracking-tight mb-6"
          >
            Power your <br className="hidden md:block" />
            business with <span className="text-gradient">FataFat</span>
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-3 text-sm text-muted-foreground mb-8"
          >
            {["Point of Sale", "Online Store", "QR Solution", "Inventory Management", "Payment Integration", "Delivery Integration"].map((item) => (
              <span key={item} className="px-3 py-1 rounded-full bg-secondary">{item}</span>
            ))}
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Link to="/contact">
              <Button size="lg" className="rounded-full px-8 text-base">
                Get Started
              </Button>
            </Link>
          </motion.div>

          {/* Hero images */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto"
          >
            {["/images/hero-home.jpg", "/images/hero-fb.jpg", "/images/hero-retail.jpg", "/images/hero-services.jpg"].map((src, i) => (
              <div key={i} className="rounded-2xl overflow-hidden aspect-[4/5]">
                <img src={src} alt="FataFat business" className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Business Solutions */}
      <section className="py-20 bg-section-alt">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-center mb-16"
          >
            Flexible business solutions for <br className="hidden md:block" />
            omni-channel selling
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-8">
            {solutions.map((sol, i) => (
              <motion.div
                key={sol.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
              >
                <Link to={sol.href} className="group block">
                  <div className="rounded-2xl overflow-hidden mb-5 aspect-[4/3]">
                    <img
                      src={sol.img}
                      alt={sol.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="text-xl font-heading font-bold mb-2">{sol.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{sol.desc}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                    Know More <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Ecosystem */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-4">
            Ecosystem to sell everything through FataFat
          </h2>
          <p className="text-muted-foreground text-center mb-14 max-w-xl mx-auto">
            Choose the solution that fits your business type
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {ecosystems.map((eco, i) => (
              <motion.div
                key={eco.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link
                  to={eco.href}
                  className="block bg-card border border-border rounded-2xl p-8 hover:shadow-lg hover:border-primary/30 transition-all group h-full"
                >
                  <h3 className="text-xl font-heading font-bold mb-3 group-hover:text-primary transition-colors">
                    {eco.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">{eco.desc}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Know More <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-hero-dark">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-center text-hero-dark-foreground mb-4">
            Empowering lacs of businesses
          </h2>
          <p className="text-hero-dark-foreground/60 text-center mb-14">
            Enabling millions of transactions
          </p>
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
                <div className="text-4xl md:text-5xl font-heading font-bold text-primary mb-2">
                  {stat.number}
                </div>
                <div className="text-hero-dark-foreground/60 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-14">
            Moments with our Merchants
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-8"
              >
                <p className="text-muted-foreground mb-6 italic">"{t.quote}"</p>
                <div>
                  <p className="font-heading font-semibold">{t.name}</p>
                  <p className="text-sm text-muted-foreground">{t.role}</p>
                </div>
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

export default Index;
