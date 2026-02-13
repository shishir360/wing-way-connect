import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { supabase } from "@/integrations/supabase/client";
import { useAgent } from "@/hooks/useAgent";
import { Truck, Mail, Lock, ArrowRight, Loader2, User as UserIcon } from "lucide-react";
import Seo from "@/components/Seo";


export default function AgentAuth() {
  const [isSignUp, setIsSignUp] = useState(false);
  // Signup State
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [otpCode, setOtpCode] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { signIn, user } = useAuth();
  const { isAgent, isApproved, loading: agentLoading } = useAgent();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Clear role cache on mount
    localStorage.removeItem('user_role');

    const checkAndClearSession = async () => {
      // If logged in as USER/ADMIN but on AGENT page, DO NOT clear session immediately.
      // Redirect or show access denied instead.
      if (user && !agentLoading && !isAgent) {
        console.log("Logged in but isAgent is false. Showing pending/denied state instead of signing out.");
      }
    };
    checkAndClearSession();

    if (user && !agentLoading && isAgent && isApproved) {
      navigate("/agent");
    }
  }, [user, isAgent, isApproved, agentLoading, navigate]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName || !phone) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      // Call Edge Function to send OTP
      const { data, error } = await supabase.functions.invoke('agent-email-verification', {
        body: {
          action: 'send',
          email,
          fullName,
          phone,
          role: 'agent'
        }
      });

      if (error) {
        console.error("Edge Function Invoke Error:", error);
        let errorMessage = error.message;
        try {
          if ('context' in error) {
            const context = (error as any).context;
            if (context && typeof context.json === 'function') {
              const json = await context.json();
              if (json && json.error) errorMessage = json.error;
            }
          }
        } catch (e) {
          console.error("Failed to parse error JSON:", e);
        }
        throw new Error(errorMessage);
      }
      if (data.error) throw new Error(data.error);

      if (data.dev_code) {
        toast({
          title: "Dev Mode: Code Generated",
          description: `Your code is: ${data.dev_code}`,
          duration: 10000,
          className: "bg-yellow-500 text-black border-yellow-600"
        });
        console.log("Dev Code:", data.dev_code);
      } else {
        toast({
          title: "Verification Code Sent",
          description: "Please check your email for the 6-digit code.",
          className: "bg-blue-500 text-white border-blue-600"
        });
      }
      setStep('otp');

    } catch (err: any) {
      console.error("OTP Send error:", err);
      toast({ title: "Failed to send code", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      toast({ title: "Invalid Code", description: "Please enter the 6-digit code.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      // Call Edge Function to verify OTP and create user
      const { data, error } = await supabase.functions.invoke('agent-email-verification', {
        body: {
          action: 'verify',
          email,
          code: otpCode,
          password,
          role: 'agent'
        }
      });

      if (error) {
        console.error("Edge Function Invoke Error:", error);
        let errorMessage = error.message;
        try {
          if ('context' in error) {
            const context = (error as any).context;
            if (context && typeof context.json === 'function') {
              const json = await context.json();
              if (json && json.error) errorMessage = json.error;
            }
          }
        } catch (e) {
          console.error("Failed to parse error JSON:", e);
        }
        throw new Error(errorMessage);
      }
      if (data.error) throw new Error(data.error);

      toast({ title: "Verified Successfully!", description: "Logging you in..." });

      // Auto Login
      const { error: loginError } = await signIn(email, password);
      if (loginError) {
        throw loginError;
      }
      // Navigation will happen via useEffect when user state updates

    } catch (err: any) {
      console.error("Verification error:", err);
      toast({ title: "Verification Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Please fill all fields", description: "Email and password are required", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: "Login Failed", description: error.message, variant: "destructive" });
      } else {
        const { data: { user: loggedUser } } = await supabase.auth.getUser();
        if (loggedUser) {
          const normalize = (e: string) => (e || '').trim().toLowerCase();

          // 1. STRICT ADMIN REDIRECT 
          if (normalize(loggedUser.email || '') === 'shishirmd681@gmail.com') {
            toast({
              title: "Admin Account Filter",
              description: "Redirecting to Admin Portal for your role.",
            });
            navigate("/admin");
            return;
          }

          // 2. Check if they are an agent
          const [agentProfile, userRole] = await Promise.all([
            supabase.from('agents' as any).select('is_approved').eq('user_id', loggedUser.id).maybeSingle(),
            supabase.from('user_roles').select('role, is_approved').eq('user_id', loggedUser.id).eq('role', 'agent').maybeSingle()
          ]);

          const isAgentAcc = agentProfile.data || userRole.data;
          const isApprovedAcc = (agentProfile.data as any)?.is_approved || (userRole.data as any)?.is_approved;

          if (isAgentAcc) {
            if (isApprovedAcc) {
              toast({ title: "Welcome back! 🚚", description: "Redirecting to Agent Dashboard" });
              navigate("/agent");
            } else {
              toast({ title: "Pending Approval", description: "Your agent account is currently under review.", variant: "destructive" });
            }
          } else {
            console.warn("User is not an agent. Signing out.");
            await supabase.auth.signOut();
            toast({ title: "Access Denied", description: "This portal is restricted to Registered Agents.", variant: "destructive" });
          }
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
        <Seo title="Agent Approval Pending" description="Your agent account is pending approval." />
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
      <Seo title="Agent Login" description="Secure login for logistics agents to manage shipments and updates." />
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
              {isSignUp ? "Agent Registration" : "Agent Login"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isSignUp ? "Join our delivery fleet today" : "Delivery Agent Portal"}
            </p>
          </div>

          <form onSubmit={isSignUp ? (step === 'otp' ? handleVerifyOtp : handleSendOtp) : handleSignIn} className="space-y-4">
            {isSignUp && step === 'otp' ? (
              // OTP Input
              <div>
                <Label className="text-sm font-medium">Verification Code</Label>
                <div className="relative mt-1.5">
                  <Input
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="pl-4 h-12 rounded-xl bg-muted/50 text-center text-lg tracking-widest"
                    maxLength={6}
                    required
                  />
                </div>
                <div className="text-center mt-2">
                  <Button variant="link" size="sm" type="button" onClick={() => setStep('details')} className="text-xs text-muted-foreground">
                    Wrong email? Go back
                  </Button>
                </div>
              </div>
            ) : isSignUp ? (
              // Sign Up Details Step
              <>
                <div>
                  <Label className="text-sm font-medium">Full Name</Label>
                  <div className="relative mt-1.5">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 h-12 rounded-xl bg-muted/50"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone Number</Label>
                  <div className="mt-1.5 relative">
                    <PhoneInput
                      country={'bd'}
                      value={phone}
                      onChange={phone => setPhone(phone)}
                      enableSearch={true}
                      inputStyle={{
                        width: '100%',
                        height: '3rem',
                        fontSize: '0.875rem',
                        paddingLeft: '50px',
                        borderRadius: '0.75rem',
                        backgroundColor: 'hsl(var(--muted)/0.5)',
                        borderColor: 'hsl(var(--border))'
                      }}
                      buttonStyle={{
                        borderRadius: '0.75rem 0 0 0.75rem',
                        backgroundColor: 'hsl(var(--muted)/0.5)',
                        borderColor: 'hsl(var(--border))'
                      }}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12 rounded-xl bg-muted/50" required />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Password</Label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-12 rounded-xl bg-muted/50" required />
                  </div>
                </div>
              </>
            ) : (
              // Login Fields
              <>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12 rounded-xl bg-muted/50" required />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Password</Label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-12 rounded-xl bg-muted/50" required />
                  </div>
                </div>
              </>
            )}

            <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl text-base bg-cta hover:bg-cta/90 text-cta-foreground shadow-lg">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> :
                <>{isSignUp ? (step === 'otp' ? "Verify & Register" : "Sign Up Now") : "Login"} <ArrowRight className="h-5 w-5 ml-2" /></>
              }
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted/50 rounded-xl text-center">
            {isSignUp ? (
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <button type="button" onClick={() => { setIsSignUp(false); setStep('details'); }} className="text-primary hover:underline font-semibold">
                  Sign In
                </button>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Don't have an agent account?{" "}
                <button type="button" onClick={() => { setIsSignUp(true); setStep('details'); }} className="text-primary hover:underline font-semibold">
                  Join Now
                </button>
              </p>
            )}
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-white/70 hover:text-white text-sm transition-colors">← Back to Home</Link>
        </div>
      </motion.div>
    </div>
  );
}

