import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FAQSection from "@/components/FAQSection";
import AdvantageSection from "@/components/AdvantageSection";

const businessTypes = [
  {
    title: "Quick Service",
    desc: "Say goodbye to long wait times. With FataFat, your staff can keep service moving efficiently no matter how busy it gets.",
    features: ["Keep lines moving with our POS", "Keep tickets accurate & synced with KDS", "Online Web-store for Digital Ordering"],
  },
  {
    title: "Fine Dine Restaurants",
    desc: "Increase customer spend by 20-40%, while creating efficiencies and capturing valuable data.",
    features: ["Keep lines moving with our POS", "Keep tickets accurate & synced with KDS", "Online Web-store for Digital Ordering"],
  },
  {
    title: "Pubs, Bars & Breweries",
    desc: "Whether you're pouring pints or mixing cocktails, FataFat makes bar management a breeze.",
    features: ["Keep lines moving with our POS", "Keep tickets accurate & synced with KDS", "Online Web-store for Digital Ordering"],
  },
  {
    title: "Cloud Kitchen",
    desc: "Manage multiple brands, streamline orders, and maximize delivery efficiency from one dashboard.",
    features: ["Keep lines moving with our POS", "Keep tickets accurate & synced with KDS", "Online Web-store for Digital Ordering"],
  },
];

const features = [
  {
    title: "Powerful POS to pace-up with.",
    desc: "The new-age POS for your restaurant. Manage billing, inventory, online orders, customer relationships & much more.",
    img: "/images/pos-dashboard.jpg",
  },
  {
    title: "Manage reservations & turn more tables.",
    desc: "See all your reservations, waiting-list and seated guests from one view. Improve table turn-times.",
    img: "/images/hero-fb.jpg",
  },
  {
    title: "Treat each customer like a VIP with marketing tools.",
    desc: "Our integrations let you manage orders, menu, pricing, inventory & deals in real-time on our centralised dashboard.",
    img: "/images/qr-solution.jpg",
  },
];

const FoodBeverage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero - Dark */}
      <section className="bg-hero-dark pt-24 pb-20 md:pt-32 md:pb-28 relative overflow-hidden">
        <div className="container mx-auto px-4 lg:px-8 text-center relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-hero-dark-foreground tracking-tight mb-4"
          >
            Full Stack <br /> Food Tech
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-hero-dark-foreground/70 text-lg mb-8"
          >
            One-stop digital solution of your restaurant
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Link to="/contact">
              <Button size="lg" className="rounded-full px-8">Get Started</Button>
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="mt-16 max-w-4xl mx-auto"
          >
            <img
              src="/images/hero-fb.jpg"
              alt="FataFat F&B solutions"
              className="rounded-2xl w-full shadow-2xl"
              loading="lazy"
            />
          </motion.div>
        </div>
      </section>

      {/* Works for you */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-4">
            FataFat works for you, no matter what you're serving.
          </h2>
          <p className="text-muted-foreground text-center mb-14 max-w-xl mx-auto">
            From quick service to fine dining, we've got you covered
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            {businessTypes.map((bt, i) => (
              <motion.div
                key={bt.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-8 hover:shadow-lg hover:border-primary/20 transition-all"
              >
                <h3 className="text-xl font-heading font-bold mb-3">{bt.title}</h3>
                <p className="text-sm text-muted-foreground mb-5">{bt.desc}</p>
                <ul className="space-y-2">
                  {bt.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Everything you need */}
      <section className="py-20 bg-section-alt">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-14">
            It's everything you need to run your restaurant.
          </h2>
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
                  <img
                    src={feat.img}
                    alt={feat.title}
                    className="rounded-2xl w-full shadow-lg"
                    loading="lazy"
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Do it all */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Do it all with FataFat
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-12">
            Integrate everything you need to operate your restaurant into one dashboard. Connect your front of house with the back of house, gather data, track ordering history, manage inventory and much more.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {["Analytics", "Reporting", "Payment", "Waiter App", "Marketing", "Inventory", "Delivery", "CRM", "Loyalty"].map((tag) => (
              <span key={tag} className="px-4 py-2 rounded-full bg-secondary text-sm font-medium">
                {tag}
              </span>
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

export default FoodBeverage;
