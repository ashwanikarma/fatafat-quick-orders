import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background">
      {/* CTA Section */}
      <div className="border-b border-background/10">
        <div className="container mx-auto px-4 lg:px-8 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Build and grow your business with FataFat.
          </h2>
          <p className="text-background/60 max-w-xl mx-auto mb-8">
            Get all the tools you need to take your business to the next level & join the millions of merchants using FataFat.
          </p>
          <Link
            to="/contact"
            className="inline-block bg-primary hover:bg-brand-blue-hover text-primary-foreground px-8 py-3 rounded-full font-semibold transition-colors"
          >
            Request Callback
          </Link>
        </div>
      </div>

      {/* Links */}
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-1 mb-6">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="ml-1 text-lg font-heading font-bold">FataFat</span>
            </div>
            <p className="text-background/50 text-sm">
              Powering businesses with smart digital solutions.
            </p>
          </div>
          <div>
            <h4 className="font-heading font-semibold mb-4 text-sm uppercase tracking-wider text-background/60">
              Products
            </h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/food-beverage" className="text-background/70 hover:text-background transition-colors">Point of Sale</Link></li>
              <li><Link to="/retail" className="text-background/70 hover:text-background transition-colors">Online Store</Link></li>
              <li><Link to="/food-beverage" className="text-background/70 hover:text-background transition-colors">QR Solutions</Link></li>
              <li><Link to="/services" className="text-background/70 hover:text-background transition-colors">Services</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold mb-4 text-sm uppercase tracking-wider text-background/60">
              Business Types
            </h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/food-beverage" className="text-background/70 hover:text-background transition-colors">Food & Beverage</Link></li>
              <li><Link to="/retail" className="text-background/70 hover:text-background transition-colors">Retail</Link></li>
              <li><Link to="/services" className="text-background/70 hover:text-background transition-colors">Services & Others</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-heading font-semibold mb-4 text-sm uppercase tracking-wider text-background/60">
              Company
            </h4>
            <ul className="space-y-3 text-sm">
              <li><Link to="/about" className="text-background/70 hover:text-background transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="text-background/70 hover:text-background transition-colors">Contact Us</Link></li>
              <li><Link to="/login" className="text-background/70 hover:text-background transition-colors">Merchant Login</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-background/10 mt-12 pt-8 text-center text-sm text-background/40">
          © {new Date().getFullYear()} FataFat. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
