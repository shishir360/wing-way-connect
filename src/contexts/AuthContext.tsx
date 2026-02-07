import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: string | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string, phone?: string) => Promise<{ data: { user: User | null; session: Session | null }; error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  // OPTIMISTIC: Initialize role from localStorage if available
  const [role, setRole] = useState<string | null>(() => {
    try {
      return localStorage.getItem('user_role');
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // SAFETY TIMEOUT: Force loading false after 5 seconds
    const safetyTimer = setTimeout(() => {
      if (loading) {
        console.warn("Auth loading timed out. Forcing completion.");
        setLoading(false);
      }
    }, 5000);

    // Helper to fetch role safely
    const fetchRole = async (userId: string) => {
      try {
        // 1. Try user_roles (handles multiple roles)
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);

        if (roles && roles.length > 0) {
          // Prioritize admin/agent roles
          if (roles.some(r => r.role === 'admin' || r.role === 'super_admin')) return 'admin';
          if (roles.some(r => r.role === 'agent')) return 'agent';
          return roles[0].role;
        }

        // 2. Fallback to profiles
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
        return profile?.role || null;
      } catch (err) {
        console.error("Error fetching role:", err);
        return null;
      }
    };

    const runAuthLogic = async () => {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          let userRole = null;
          if (session?.user) {
            userRole = await fetchRole(session.user.id);
            // CACHE ROLE
            if (userRole) localStorage.setItem('user_role', userRole);
            else localStorage.removeItem('user_role');
          } else {
            localStorage.removeItem('user_role');
          }

          setSession(session);
          setUser(session?.user ?? null);
          setRole(userRole);
          setLoading(false);
        }
      );

      // Check existing session
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        let userRole = null;
        // Optimistic check is already in state, but let's refresh it or fetch if missing
        userRole = await fetchRole(session.user.id);
        if (userRole) localStorage.setItem('user_role', userRole);

        // Update state with fresh role
        setRole(userRole);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      return subscription;
    };

    const subPromise = runAuthLogic();

    return () => {
      clearTimeout(safetyTimer);
      subPromise.then(sub => sub.unsubscribe());
    };
  }, []);

  const signUp = async (email: string, password: string, fullName?: string, phone?: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          phone: phone
        }
      }
    });
    return { data, error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    // Role will be updated by onAuthStateChange
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    localStorage.removeItem('user_role');
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
