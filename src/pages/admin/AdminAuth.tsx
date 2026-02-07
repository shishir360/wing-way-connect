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
import { Plane, Mail, Lock, User, ArrowRight, Loader2, ShieldCheck } from "lucide-react";

const ADMIN_EMAIL = "shishirmd681@gmail.com";

export default function AdminAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { signIn, signUp, user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !adminLoading) {
      if (isAdmin) {
        navigate("/admin");
      }
    }
  }, [user, isAdmin, adminLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (email.toLowerCase() !== ADMIN_EMAIL) {
      toast({
        title: "Access denied",
        description: "This email is not authorized for admin access",
        variant: "destructive",
      });
      return;
    }

    if (!email || !password) {
      toast({ title: "Fill all fields", description: "Email and password are required", variant: "destructive" });
      return;
    }

    if (!isLogin && password.length < 6) {
      toast({ title: "Password too short", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({ title: "Login failed", description: error.message.includes("Invalid login credentials") ? "Invalid email or password" : error.message, variant: "destructive" });
        } else {
          // Check admin role after login
          const { data: { user: loggedUser } } = await supabase.auth.getUser();
          if (loggedUser) {
            const { data } = await supabase.from('user_roles').select('role').eq('user_id', loggedUser.id).eq('role', 'admin').maybeSingle();
            if (data) {
              toast({ title: "Welcome, Admin! 🛡️", description: "Redirecting to admin panel" });
              navigate("/admin");
            } else if (loggedUser.email === ADMIN_EMAIL) {
              // Auto-assign admin role if missing for the hardcoded admin email
              const { error: roleError } = await supabase.from('user_roles').insert({ user_id: loggedUser.id, role: 'admin' as any });
              if (roleError) {
                console.error("Failed to assign role:", roleError);
                toast({ title: "Role Assignment Failed", description: "Could not assign admin role automatically.", variant: "destructive" });
              } else {
                toast({ title: "Welcome, Admin! 🛡️", description: "Admin role assigned. Redirecting..." });
                navigate("/admin");
              }
            } else {
              toast({ title: "Not an admin", description: "This account doesn't have admin privileges", variant: "destructive" });
              await supabase.auth.signOut();
            }
          }
        }
      } else {
        const { data, error } = await signUp(email, password, fullName);
        if (error) {
          toast({ title: "Registration failed", description: error.message.includes("User already registered") ? "Account already exists. Please login." : error.message, variant: "destructive" });
        } else {
          // Assign admin role
          if (data?.user) {
            const { error: roleError } = await supabase.from('user_roles').insert({ user_id: data.user.id, role: 'admin' as any });

            if (data.session) {
              toast({ title: "Admin registered! 🎉", description: "Welcome to the admin panel." });
              navigate("/admin");
            } else {
              // User requested to remove verification step.
              toast({ title: "Admin registered!", description: "Account created. Please login." });
              setIsLogin(true);
            }
          }
        }
      }
    } catch {
      toast({ title: "Something went wrong", description: "Please try again later", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-pattern flex items-center justify-center p-4 relative overflow-hidden">
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
              {isLogin ? "Admin Login" : "Admin Registration"}
            </h1>
            <p className="text-muted-foreground text-sm">Restricted access — authorized admins only</p>
          </div>

          <div className="flex bg-muted rounded-xl p-1 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${isLogin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${!isLogin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label className="text-sm font-medium">Full Name</Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Your name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-12 rounded-xl bg-muted/50"
                  />
                </div>
              </div>
            )}

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
              {!isLogin && <p className="text-xs text-muted-foreground mt-1.5">At least 6 characters</p>}
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
                  {isLogin ? "Login as Admin" : "Register as Admin"}
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
