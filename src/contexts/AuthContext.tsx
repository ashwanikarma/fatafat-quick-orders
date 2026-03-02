import { createContext, useContext, useState, ReactNode } from "react";

interface User {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  role: string;
  policyCount: number;
  memberSince: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const demoUser: User = {
  name: "Rajesh Kumar",
  email: "rajesh.kumar@email.com",
  phone: "+91 98765 43210",
  avatar: "RK",
  role: "Premium Member",
  policyCount: 3,
  memberSince: "January 2022",
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (username: string, password: string) => {
    if (username === "admin" && password === "admin") {
      setUser(demoUser);
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
