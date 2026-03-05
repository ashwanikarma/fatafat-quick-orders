import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  membershipTier: string;
  policyCount: number;
  memberSince: string;
  address: string;
  panNumber: string;
}

interface SignUpInput {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}

interface ProfileInput {
  name: string;
  phone: string;
  address: string;
  panNumber: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (input: SignUpInput) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  logout: () => Promise<void>;
  sendEmailOtp: (email: string) => Promise<{ error: string | null }>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  updateProfile: (input: ProfileInput) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

type ProfileRow = Tables<"profiles">;

const AuthContext = createContext<AuthContextType | null>(null);

const formatError = (error: { message?: string } | null) => error?.message ?? "Something went wrong. Please try again.";

const getFallbackName = (authUser: SupabaseUser) => {
  const metadataName = authUser.user_metadata?.full_name;
  if (typeof metadataName === "string" && metadataName.trim()) return metadataName.trim();
  return authUser.email?.split("@")[0] ?? "Member";
};

const getAvatarText = (name: string, email: string) => {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || email.slice(0, 2).toUpperCase() || "FF";
};

const formatMemberSince = (date: string) =>
  new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date(date));

const mapAppUser = (authUser: SupabaseUser, profile: ProfileRow): User => {
  const name = profile.full_name?.trim() || getFallbackName(authUser);
  const email = authUser.email ?? "";

  return {
    id: authUser.id,
    name,
    email,
    phone: profile.phone ?? authUser.phone ?? "Not added yet",
    avatar: profile.avatar_text?.trim() || getAvatarText(name, email),
    membershipTier: profile.membership_tier,
    policyCount: 3,
    memberSince: formatMemberSince(profile.created_at),
    address: profile.address ?? "Add your address",
    panNumber: profile.pan_number ?? "Add your PAN",
  };
};

const createProfileFallback = async (authUser: SupabaseUser) => {
  const name = getFallbackName(authUser);
  const email = authUser.email ?? "";

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: authUser.id,
      full_name: name,
      phone: authUser.phone,
      avatar_text: getAvatarText(name, email),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async (authUser: SupabaseUser) => {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", authUser.id).maybeSingle();

    if (error) throw error;

    const profile = data ?? (await createProfileFallback(authUser));
    setUser(mapAppUser(authUser, profile));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const syncSession = async (nextSession: Session | null) => {
      if (!isMounted) return;

      setSession(nextSession);

      if (!nextSession?.user) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        await loadProfile(nextSession.user);
      } catch (error) {
        console.error("Failed to load profile", error);
        setUser(null);
        setIsLoading(false);
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void syncSession(nextSession);
    });

    void (async () => {
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession();

      await syncSession(initialSession);
    })();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setIsLoading(false);
      return { error: formatError(error) };
    }

    return { error: null };
  };

  const signUp = async ({ fullName, email, password, phone }: SignUpInput) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          full_name: fullName,
          phone,
        },
      },
    });

    if (error) {
      setIsLoading(false);
      return { error: formatError(error), needsEmailConfirmation: false };
    }

    const needsEmailConfirmation = !data.session;
    if (data.user && data.session) {
      await loadProfile(data.user);
    } else {
      setIsLoading(false);
    }

    return { error: null, needsEmailConfirmation };
  };

  const logout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsLoading(false);
  };

  const sendEmailOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    return { error: error ? formatError(error) : null };
  };

  const verifyEmailOtp = async (email: string, token: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error) {
      setIsLoading(false);
      return { error: formatError(error) };
    }

    return { error: null };
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error ? formatError(error) : null };
  };

  const updateProfile = async ({ name, phone, address, panNumber }: ProfileInput) => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return { error: "Please log in again to continue." };
    }

    const email = authUser.email ?? "";
    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: name,
        phone: phone || null,
        address: address || null,
        pan_number: panNumber || null,
        avatar_text: getAvatarText(name, email),
      })
      .eq("id", authUser.id)
      .select()
      .single();

    if (error) {
      return { error: formatError(error) };
    }

    setUser(mapAppUser(authUser, data));
    return { error: null };
  };

  const refreshProfile = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      setUser(null);
      setSession(null);
      return;
    }

    setIsLoading(true);
    await loadProfile(authUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!session?.user,
        isLoading,
        login,
        signUp,
        logout,
        sendEmailOtp,
        verifyEmailOtp,
        updatePassword,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
