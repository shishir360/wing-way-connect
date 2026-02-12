
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Seo from "@/components/Seo";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { supabase } from "@/integrations/supabase/client";
import { Plane, Mail, Lock, ArrowRight, Loader2, User as UserIcon, Phone } from "lucide-react";

// Import 3D images
import airplane3D from "@/assets/airplane-3d.png";
import globe3D from "@/assets/globe-3d.png";
import suitcase3D from "@/assets/suitcase-3d.png";
import box3D from "@/assets/box-3d.png";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  // Signup State
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [otpCode, setOtpCode] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Removed signUp, using custom flow. 
  // We strictly use signIn for login, and custom Edge Function for signup.
  const { signIn, user, role } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user && role && !isLoading) {
      console.log(`[Auth] User logged in with role: ${role}. Redirecting...`);
      if (role === 'admin') {
        navigate("/admin");
      } else if (role === 'agent') {
        navigate("/agent");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, role, navigate, isLoading]);

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
          role: 'user'
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

      toast({
        title: "Verification Code Sent",
        description: "Please check your email for the 6-digit code.",
        className: "bg-blue-500 text-white border-blue-600"
      });
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
          role: 'user'
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

    // Basic validation
    if (!email || !password) {
      toast({
        title: "Fill all fields",
        description: "Email and password are required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Login failed",
            description: "Invalid email or password",
            variant: "destructive",
          });
        } else if (error.message.includes("Email not confirmed")) {
          toast({
            title: "Verify your email",
            description: "Please click the link sent to your email",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Login failed",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        // Post-login handling is done via useEffect (redirects)
        toast({
          title: "Welcome!",
          description: "Successfully logged in",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Something went wrong",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-hero-pattern flex items-center justify-center p-4 relative overflow-hidden">
      <Seo title="Authentication" description="Login or register securely to access your account." />
      {/* Floating 3D images */}
      <motion.img
        src={airplane3D}
        alt="Airplane"
        className="absolute top-10 right-[5%] w-32 sm:w-48 md:w-64 opacity-60 hidden md:block"
        animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.img
        src={globe3D}
        alt="Globe"
        className="absolute bottom-10 left-[5%] w-24 sm:w-40 md:w-52 opacity-50 hidden md:block"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      <motion.img
        src={suitcase3D}
        alt="Suitcase"
        className="absolute top-1/3 left-[10%] w-20 sm:w-32 opacity-40 hidden lg:block"
        animate={{ y: [0, 12, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.img
        src={box3D}
        alt="Box"
        className="absolute bottom-1/4 right-[10%] w-20 sm:w-32 opacity-40 hidden lg:block"
        animate={{ y: [0, -10, 0], rotate: [0, -5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <Plane className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white font-display">WACC</span>
        </Link>

        {/* Auth Card */}
        <div className="bg-card/95 backdrop-blur-xl rounded-3xl border border-border/50 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold font-display mb-2">
              {isSignUp ? (step === 'otp' ? "Verify Email" : "Create Account") : "Login to your account"}
            </h1>
            <p className="text-muted-foreground">
              {isSignUp ? (step === 'otp' ? "Enter the code sent to your email" : "Track your shipments & manage bookings") : "Track your shipments"}
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
              // Sign Up Form
              <>
                <div>
                  <Label className="text-sm font-medium">Full Name</Label>
                  <div className="relative mt-1.5">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      placeholder="Your Name"
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
              </>
            ) : null}

            {/* Email & Password (Common) */}
            {(step === 'details' || !isSignUp) && (
              <>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 rounded-xl bg-muted/50"
                      required
                      autoComplete="email"
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
                      required
                      autoComplete="current-password"
                    />
                  </div>
                </div>
              </>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-xl text-base bg-cta hover:bg-cta/90 text-cta-foreground shadow-lg"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {isSignUp ? (step === 'otp' ? "Verify & Register" : "Sign Up Now") : "Login"}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Quick Login Info */}
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
                Don't have an account?{" "}
                <button type="button" onClick={() => { setIsSignUp(true); setStep('details'); }} className="text-primary hover:underline font-semibold">
                  Create Account
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6 space-x-4">
          <Link to="/" className="text-white/70 hover:text-white text-sm transition-colors">
            ← Back to Home
          </Link>
          <span className="text-white/30">|</span>
          <Link to="/agent/login" className="text-white/70 hover:text-white text-sm transition-colors">
            Agent Login →
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
