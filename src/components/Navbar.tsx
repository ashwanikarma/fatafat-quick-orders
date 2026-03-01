import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  {
    label: "Products",
    children: [
      { label: "Point of Sale", href: "/food-beverage" },
      { label: "Online Store", href: "/retail" },
      { label: "QR Solutions", href: "/food-beverage" },
      { label: "Services", href: "/services" },
    ],
  },
  {
    label: "Business Types",
    children: [
      { label: "Food & Beverage", href: "/food-beverage" },
      { label: "Retail", href: "/retail" },
      { label: "Services & Others", href: "/services" },
    ],
  },
  {
    label: "Company",
    children: [
      { label: "About Us", href: "/about" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const location = useLocation();

  const isDark =
    location.pathname === "/food-beverage" ||
    location.pathname === "/about";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-colors ${
        isDark
          ? "bg-hero-dark/90 backdrop-blur-md"
          : "bg-background/90 backdrop-blur-md border-b border-border"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <div className="w-3 h-3 rounded-full bg-primary" />
          </div>
          <span
            className={`text-xl font-heading font-bold tracking-tight ${
              isDark ? "text-hero-dark-foreground" : "text-foreground"
            }`}
          >
            FataFat
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => (
            <div
              key={item.label}
              className="relative group"
              onMouseEnter={() => setOpenDropdown(item.label)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button
                className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                  isDark
                    ? "text-hero-dark-foreground/80 hover:text-hero-dark-foreground"
                    : "text-foreground/70 hover:text-foreground"
                }`}
              >
                {item.label}
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <AnimatePresence>
                {openDropdown === item.label && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-2 bg-card rounded-lg shadow-xl border border-border min-w-[200px] py-2"
                  >
                    {item.children.map((child) => (
                      <Link
                        key={child.label}
                        to={child.href}
                        className="block px-4 py-2.5 text-sm text-card-foreground hover:bg-accent transition-colors"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm" className={isDark ? "text-hero-dark-foreground hover:bg-hero-dark-foreground/10" : ""}>
              Login
            </Button>
          </Link>
          <Link to="/contact">
            <Button size="sm">Get Started</Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? (
            <X className={`w-6 h-6 ${isDark ? "text-hero-dark-foreground" : "text-foreground"}`} />
          ) : (
            <Menu className={`w-6 h-6 ${isDark ? "text-hero-dark-foreground" : "text-foreground"}`} />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden bg-card border-t border-border overflow-hidden"
          >
            <div className="px-4 py-4 space-y-4">
              {navItems.map((item) => (
                <div key={item.label}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {item.label}
                  </p>
                  {item.children.map((child) => (
                    <Link
                      key={child.label}
                      to={child.href}
                      onClick={() => setMobileOpen(false)}
                      className="block py-2 text-sm text-card-foreground hover:text-primary transition-colors"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ))}
              <div className="pt-4 border-t border-border flex gap-3">
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" size="sm">Login</Button>
                </Link>
                <Link to="/contact" onClick={() => setMobileOpen(false)}>
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
