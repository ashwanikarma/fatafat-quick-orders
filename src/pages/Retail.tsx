import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FAQSection from "@/components/FAQSection";
import AdvantageSection from "@/components/AdvantageSection";

const features = [
  {
    title: "Powerful website designs made for eCommerce.",
    desc: "Build a professional, great looking website, sell your goods or services online, collect leads, & more using our flexible business website designs.",
    img: "/images/online-store.jpg",
  },
  {
    title: "Your brand. Your domain. Create your own identity.",
    desc: "Get your custom domain and make it your new identity - all with our hassle-free and quick self-serve tool in less than 5 minutes.",
    img: "/images/hero-retail.jpg",
  },
  {
    title: "Increase sales with in-built marketing tools.",
    desc: "Find new customers with our complete suite of marketing tools to make posts & run ads for every channel and do much more.",
    img: "/images/pos-dashboard.jpg",
  },
  {
    title: "Pan India Deliveries, Simplified.",
    desc: "Get the lowest pre-negotiated rates from reliable 3rd party partners for deliveries to 26000+ pin codes all over India.",
    img: "/images/qr-solution.jpg",
  },
  {
    title: "One smart dashboard to manage it all.",
    desc: "From accepting orders, inventory update, deliveries to payments, stay on top of your business numbers with our centralised dashboard.",
    img: "/images/hero-fb.jpg",
  },
];

const categories = [
  "Fashion & Beauty",
  "Electronics",
  "Arts & Crafts",
  "Home & Kitchen",
  "Jewellery",
  "Supermarket",
  "Restaurants",
];

const Retail = () => {
  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-16 min-h-[80vh] flex items-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/images/hero-retail.jpg)" }}
        />
        <div className="absolute inset-0 bg-foreground/50" />
        <div className="container mx-auto px-4 lg:px-8 relative z-10 text-center py-20">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-hero-dark-foreground tracking-tight mb-4"
          >
            Everything to <br /> sell anything.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-hero-dark-foreground/80 text-lg mb-8"
          >
            E-commerce suite for merchants who mean business.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Link to="/contact">
              <Button size="lg" className="rounded-full px-8">Get Started</Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Dream it */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Dream it & drive it with FataFat.
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-10">
            One platform with all the tools you need to set-up, manage and grow your business online.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-16">
            {["Online Store", "Themes", "Domain", "Marketing Tools", "Delivery", "Dashboard"].map((tag) => (
              <span key={tag} className="px-4 py-2 rounded-full bg-secondary text-sm font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-section-alt">
        <div className="container mx-auto px-4 lg:px-8 space-y-20">
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
      </section>

      {/* Categories */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Countless business categories. One platform to build all.
          </h2>
          <div className="flex flex-wrap justify-center gap-3 mt-10">
            {categories.map((cat) => (
              <span key={cat} className="px-5 py-2.5 rounded-full border border-border bg-card text-sm font-medium hover:border-primary hover:text-primary transition-colors cursor-pointer">
                {cat}
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

export default Retail;
