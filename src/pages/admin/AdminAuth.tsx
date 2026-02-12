import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { Mail, Lock, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import Seo from "@/components/Seo";

const ADMIN_EMAIL = "shishirmd681@gmail.com";

export default function AdminAuth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { signIn, user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Clear potentially stale role cache on mount
    localStorage.removeItem('user_role');

    const checkAndClearSession = async () => {
      // Logic: If on Admin Login page, and logged in user is NOT an admin, logging them out is safer
      // to allow them to login as admin.
      if (user && !adminLoading && !isAdmin) {
        console.log("User logged in but not admin on Admin Login page. Signing out...");
        await supabase.auth.signOut();
      }
    };
    checkAndClearSession();

    if (user && !adminLoading && isAdmin) {
      navigate("/admin");
    }
  }, [user, isAdmin, adminLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({ title: "Fill all fields", description: "Email and password are required", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    // Safety timeout to prevent infinite loading state
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        toast({
          title: "Request timeout",
          description: "The login request took too long. Please check your connection and try again.",
          variant: "destructive"
        });
      }
    }, 15000); // 15 seconds

    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Login failed", description: error.message.includes("Invalid login credentials") ? "Invalid email or password" : error.message, variant: "destructive" });
      } else {
        // STRICT ROLE CHECK - Post Login
        // We fetch the profile directly to be 100% sure before proceeding
        const { data: { user: loggedUser } } = await supabase.auth.getUser();

        if (loggedUser) {
          const normalize = (e: string) => (e || '').trim().toLowerCase();

          // 1. Check if they are in the admins table or have the admin role
          const [adminProfile, userRole] = await Promise.all([
            supabase.from('admins' as any).select('id').eq('user_id', loggedUser.id).maybeSingle(),
            supabase.from('user_roles').select('role').eq('user_id', loggedUser.id).eq('role', 'admin').maybeSingle()
          ]);

          const isAuthorizedAdmin = adminProfile.data || userRole.data || normalize(loggedUser.email || '') === normalize(ADMIN_EMAIL);

          if (isAuthorizedAdmin) {
            toast({ title: "Welcome, Admin! 🛡️", description: "Redirecting to admin panel" });
            navigate("/admin");
          } else {
            console.warn("Non-admin user logged in at Admin Portal. Signing out.");
            await supabase.auth.signOut();
            toast({
              title: "Unauthorized Access",
              description: "This portal is restricted to Administrators only.",
              variant: "destructive"
            });
          }
        }
      }
    } catch {
      toast({ title: "Something went wrong", description: "Please try again later", variant: "destructive" });
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-pattern flex items-center justify-center p-4 relative overflow-hidden">
      <Seo title="Admin Login" description="Secure login for administrators to manage shipments, bookings, and users." />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white font-display">WACC Admin</span>
        </Link>

        <div className="bg-card/95 backdrop-blur-xl rounded-3xl border border-border/50 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold font-display mb-2">
              Admin Login
            </h1>
            <p className="text-muted-foreground text-sm">Restricted access — authorized admins only</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Admin Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="admin@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 rounded-xl bg-muted/50"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 rounded-xl bg-muted/50"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl text-base bg-cta hover:bg-cta/90 text-cta-foreground shadow-lg"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Login as Admin
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted/50 rounded-xl">
            <p className="text-xs text-center text-muted-foreground">
              Only authorized email addresses can access the admin panel
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-white/70 hover:text-white text-sm transition-colors">
            ← Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
