import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import FoodBeverage from "./pages/FoodBeverage";
import Retail from "./pages/Retail";
import Services from "./pages/Services";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Quotation from "./pages/Quotation";
import Policies from "./pages/Policies";
import PolicyDetail from "./pages/PolicyDetail";
import Quotations from "./pages/Quotations";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/food-beverage" element={<FoodBeverage />} />
            <Route path="/retail" element={<Retail />} />
            <Route path="/services" element={<Services />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/quotation" element={<Quotation />} />
            <Route path="/policies" element={<Policies />} />
            <Route path="/policy" element={<PolicyDetail />} />
            <Route path="/quotations" element={<Quotations />} />
            <Route path="/install" element={<Install />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);
export default App;
