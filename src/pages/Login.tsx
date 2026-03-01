import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const Login = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ phone: "", password: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Login", description: "Login functionality coming soon!" });
  };

  return (
    <div className="min-h-screen bg-section-alt flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-1 mb-6">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="ml-1 text-xl font-heading font-bold">FataFat</span>
          </Link>
          <h1 className="text-2xl font-heading font-bold">Merchant Login</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Access your FataFat dashboard
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Phone Number</label>
              <Input
                placeholder="Enter your phone number"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Password</label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full rounded-full">
              Login
            </Button>
          </form>
          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/contact" className="text-primary font-semibold hover:underline">
                Get Started
              </Link>
            </p>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link to="/" className="hover:text-foreground transition-colors">← Back to home</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
