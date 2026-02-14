import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: string | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string, phone?: string, role?: string) => Promise<{ data: { user: User | null; session: Session | null }; error: Error | null }>;
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
    console.log("[AuthContext] Mounting provider...");

    // SAFETY TIMEOUT RESTORED for reliability
    const safetyTimer = setTimeout(() => {
      console.warn("[AuthContext] Safety timeout triggered. Forcing loading to false.");
      setLoading(false);
    }, 5000); // 5 seconds max wait

    // Helper to fetch role safely with timeout
    const fetchRole = async (userId: string, userEmail?: string): Promise<string> => {
      console.log(`[AuthContext] Fetching role for ${userId}...`);

      // 0. SUPER ADMIN BYPASS
      // If email matches the system admin, force admin role immediately
      // This protects against DB inconsistencies or missing records
      const ADMIN_EMAIL = "shishirmd681@gmail.com";
      if (userEmail && userEmail.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        console.warn("[AuthContext] Super Admin detected via email. Bypassing DB check.");
        return 'admin';
      }

      const roleCheck = async (): Promise<string> => {
        try {
          // Run checks in parallel for speed
          const [adminResult, agentResult, rolesResult, profileResult] = await Promise.all([
            // Admin Check
            supabase.from('admins' as any).select('id').eq('user_id', userId).maybeSingle(),
            // Agent Check
            supabase.from('agents' as any).select('id, is_approved').eq('user_id', userId).maybeSingle(),
            // User Roles Check
            supabase.from('user_roles').select('role, is_approved').eq('user_id', userId),
            // Profile Check
            supabase.from('profiles').select('role').eq('id', userId).maybeSingle()
          ]);

          // 1. Check Admin
          if (adminResult.data) {
            console.log("[AuthContext] Found in 'admins' table. Role: admin");
            return 'admin';
          }

          // 2. Check Agent
          const agent = agentResult.data as any;
          if (agent) {
            console.log("[AuthContext] Found in 'agents' table. Role: agent" + (agent.is_approved ? "" : " (Pending)"));
            return 'agent';
          }

          // 3. User Roles
          const roles = rolesResult.data || [];
          const approvedRoles = (roles as any[]).filter(r => r.is_approved !== false);

          if (approvedRoles.some(r => r.role === 'admin' || (r.role as any) === 'super_admin')) return 'admin';
          if (approvedRoles.some(r => r.role === 'agent')) return 'agent';
          if (approvedRoles.length > 0) return approvedRoles[0].role;

          // 4. Profile fallback
          const profile = profileResult.data as any;
          return profile?.role || 'user';

        } catch (err) {
          console.error("[AuthContext] Error fetching role:", err);
          return null; // SAFE: Do not default to 'user' on error
        }
      };
      return roleCheck();
    };

    const runAuthLogic = async () => {
      console.log("[AuthContext] Running auth logic...");
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log(`[AuthContext] Auth state change event: ${event}`, session?.user?.id);
          let userRole = null;

          if (session?.user) {
            userRole = await fetchRole(session.user.id, session.user.email);
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
      console.log("[AuthContext] Checking existing session...");
      const { data: { session } } = await supabase.auth.getSession();
      console.log("[AuthContext] Session check result:", session?.user?.id ? "Found User" : "No Session");

      if (session?.user) {
        let userRole = null;
        userRole = await fetchRole(session.user.id, session.user.email);
        if (userRole) localStorage.setItem('user_role', userRole);
        setRole(userRole);
      } else {
        // If no session found, stop loading immediately
        setLoading(false);
      }

      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) setLoading(false);

      return subscription;
    };

    const subPromise = runAuthLogic();

    return () => {
      clearTimeout(safetyTimer);
      subPromise.then(sub => sub.unsubscribe());
    };
  }, []);

  const signUp = async (email: string, password: string, fullName?: string, phone?: string, role?: string) => {
    const redirectUrl = `${window.location.origin}/`;

    console.log("[AuthContext] Signing up with:", { email, fullName, phone, role });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          phone: phone,
          role: role,
          requested_role: role // Redundant key to bypass potential filtering
        }
      }
    });
    return { data, error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true); // Set loading to true while signing in
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Force a session check to ensure state is updated immediately
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSession(session);
        setUser(session.user);
        // We do NOT set loading false here, we let onAuthStateChange handle it
        // based on the role check to prevent "flash of unauthorized"
      }

      return { error: null };
    } catch (err) {
      console.error("[AuthContext] SignIn error:", err);
      setLoading(false); // Ensure loading is cleared on error
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setRole(null);
    localStorage.removeItem('user_role');
    setLoading(false);
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
