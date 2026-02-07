import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SmartPhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useAgent } from "@/hooks/useAgent";
import { Truck, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";

export default function AgentAuth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { signIn, signUp, user } = useAuth();
  const { isAgent, isApproved, loading: agentLoading } = useAgent();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !agentLoading) {
      if (isAgent && isApproved) {
        navigate("/agent");
      } else if (isAgent && !isApproved) {
        // Stay on page, show pending message
      }
    }
  }, [user, isAgent, isApproved, agentLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Please fill all fields", description: "Email and password are required", variant: "destructive" });
      return;
    }
    if (!isLogin && password.length < 6) {
      toast({ title: "Weak Password", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({ title: "লগইন ব্যর্থ", description: error.message, variant: "destructive" });
        } else {
          const { data: { user: loggedUser } } = await supabase.auth.getUser();
          if (loggedUser) {
            const { data } = await supabase.from('user_roles').select('role, is_approved').eq('user_id', loggedUser.id).eq('role', 'agent').maybeSingle();
            if (data && data.is_approved) {
              toast({ title: "Welcome! 🚚", description: "Redirecting to Agent Dashboard" });
              navigate("/agent");
            } else if (data && !data.is_approved) {
              toast({ title: "Pending Approval", description: "Your account is not approved yet", variant: "destructive" });
              await supabase.auth.signOut();
            } else {
              toast({ title: "Not an Agent", description: "This account does not have agent access", variant: "destructive" });
              await supabase.auth.signOut();
            }
          }
        }
      } else {
        const { error } = await signUp(email, password, fullName, phone);
        if (error) {
          toast({ title: "Registration Failed", description: error.message, variant: "destructive" });
        } else {
          const { data: { user: newUser } } = await supabase.auth.getUser();
          if (newUser) {
            await supabase.from('user_roles').insert({ user_id: newUser.id, role: 'agent' as any, is_approved: false });
          }
          toast({ title: "Registration Successful! 🎉", description: "Please verify your email. Login after admin approval." });
        }
      }
    } catch {
      toast({ title: "Something went wrong", description: "Please try again", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Show pending state if logged in but not approved
  if (user && isAgent && !isApproved && !agentLoading) {
    return (
      <div className="min-h-screen bg-hero-pattern flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="bg-card/95 backdrop-blur-xl rounded-3xl border border-border/50 p-8 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
              <Truck className="h-8 w-8 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold font-display mb-2">Pending Approval</h1>
            <p className="text-muted-foreground mb-6">You can login after admin approves your agent account.</p>
            <Button variant="outline" onClick={async () => { await supabase.auth.signOut(); navigate("/"); }}>
              Back to Home
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero-pattern flex items-center justify-center p-4 relative overflow-hidden">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md relative z-10">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <Truck className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white font-display">WACC Agent</span>
        </Link>

        <div className="bg-card/95 backdrop-blur-xl rounded-3xl border border-border/50 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Truck className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold font-display mb-2">
              {isLogin ? "Agent Login" : "Agent Registration"}
            </h1>
            <p className="text-muted-foreground text-sm">Delivery Agent Portal</p>
          </div>

          <div className="flex bg-muted rounded-xl p-1 mb-6">
            <button onClick={() => setIsLogin(true)} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${isLogin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>Login</button>
            <button onClick={() => setIsLogin(false)} className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${!isLogin ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>Register</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label className="text-sm font-medium">Full Name</Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input type="text" placeholder="Your Name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10 h-12 rounded-xl bg-muted/50" />
                </div>
              </div>
            )}
            {!isLogin && (
              <div>
                <Label className="text-sm font-medium">Phone Number</Label>
                <div className="mt-1.5">
                  <SmartPhoneInput
                    placeholder="Enter phone number"
                    defaultCountry="BD"
                    value={phone}
                    onChange={setPhone}
                    className="h-12"
                  />
                </div>
              </div>
            )}
            <div>
              <Label className="text-sm font-medium">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12 rounded-xl bg-muted/50" />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-12 rounded-xl bg-muted/50" />
              </div>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl text-base bg-cta hover:bg-cta/90 text-cta-foreground shadow-lg">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>{isLogin ? "Login" : "Register"}<ArrowRight className="h-5 w-5 ml-2" /></>}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted/50 rounded-xl">
            <p className="text-xs text-center text-muted-foreground">
              {isLogin ? "You can login after admin approves your registration" : "Admin will approve after registration"}
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-white/70 hover:text-white text-sm transition-colors">← Back to Home</Link>
        </div>
      </motion.div>
    </div>
  );
}
