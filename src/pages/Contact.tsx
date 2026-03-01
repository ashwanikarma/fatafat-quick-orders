import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FAQSection from "@/components/FAQSection";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Contact = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", mobile: "", email: "", query: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Request Submitted!", description: "We'll get back to you shortly." });
    setForm({ name: "", mobile: "", email: "", query: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="pt-24 pb-20 md:pt-32">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-muted-foreground uppercase tracking-[0.2em] text-sm mb-4"
          >
            Contact Us
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold tracking-tight mb-4"
          >
            Let's get talking.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground text-lg max-w-xl mx-auto"
          >
            Ask us anything you need help with or just say hello. Simply fill up the form below to hear from us.
          </motion.p>
        </div>
      </section>

      {/* Form */}
      <section className="pb-20">
        <div className="container mx-auto px-4 lg:px-8 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card border border-border rounded-2xl p-8"
          >
            <h3 className="text-xl font-heading font-semibold text-center mb-6">Raise a Query</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <Input
                placeholder="Mobile Number"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                required
              />
              <Input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <Textarea
                placeholder="Query"
                value={form.query}
                onChange={(e) => setForm({ ...form, query: e.target.value })}
                required
                rows={4}
              />
              <Button type="submit" className="w-full rounded-full">
                Submit Request
              </Button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Links */}
      <section className="pb-20">
        <div className="container mx-auto px-4 lg:px-8 max-w-2xl">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-section-alt rounded-2xl p-6">
              <p className="text-sm text-muted-foreground mb-3">
                Get your answers plus a lot more in our resources
              </p>
              <Link to="/" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Go to Home <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-section-alt rounded-2xl p-6">
              <p className="text-sm text-muted-foreground mb-3">
                Join the team transforming commerce for millions of merchants.
              </p>
              <Link to="/about" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                About Us <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <FAQSection />
      <Footer />
    </div>
  );
};

export default Contact;
