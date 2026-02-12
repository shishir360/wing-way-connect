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
    // SAFETY TIMEOUT RESTORED for reliability
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 5000); // 5 seconds max wait

    // Helper to fetch role safely
    const fetchRole = async (userId: string) => {
      console.log(`[AuthContext] Fetching role for ${userId}...`);
      try {
        // 1. Check specific tables (Priority)

        // Check Admin
        console.log("[AuthContext] Checking 'admins' table...");
        const { data: admin, error: adminError } = await supabase.from('admins' as any).select('id').eq('user_id', userId).maybeSingle();
        if (adminError) console.error("[AuthContext] Admin check error:", adminError);
        if (admin) {
          console.log("[AuthContext] Found in 'admins' table. Role: admin");
          return 'admin';
        }

        // Check Agent
        console.log("[AuthContext] Checking 'agents' table...");
        const { data: agent } = await supabase.from('agents' as any).select('id, is_approved').eq('user_id', userId).maybeSingle();
        if (agent) {
          if (agent.is_approved === false) {
            console.warn("[AuthContext] Agent found but NOT approved.");
            return 'user';
          }
          console.log("[AuthContext] Found in 'agents' table. Role: agent");
          return 'agent';
        }

        // 2. Fallback to user_roles (Legacy/Compatibility)
        console.log("[AuthContext] Checking 'user_roles' table...");
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role, is_approved')
          .eq('user_id', userId);

        if (roles && roles.length > 0) {
          console.log("[AuthContext] Found roles:", roles);

          // Filter for APPROVED roles only
          const approvedRoles = roles.filter(r => r.is_approved !== false);

          if (approvedRoles.some(r => r.role === 'admin' || (r.role as any) === 'super_admin')) return 'admin';
          if (approvedRoles.some(r => r.role === 'agent')) return 'agent';

          if (approvedRoles.length > 0) return approvedRoles[0].role;

          console.warn("[AuthContext] Roles found but none approved.");
          return 'user';
        }

        // 3. Fallback to profiles
        console.log("[AuthContext] Checking 'profiles' table...");
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (!profile) console.warn("[AuthContext] User has no profile entry!");
        const profileRole = (profile as any)?.role;
        console.log("[AuthContext] Profile role:", profileRole);
        return profileRole || 'user'; // Default to 'user' if no specific role found
      } catch (err) {
        console.error("[AuthContext] Error fetching role:", err);
        return 'user'; // Default to 'user' on error
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
          clearTimeout(safetyTimer); // Clear timer if successful
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
      clearTimeout(safetyTimer); // Clear timer if successful
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
