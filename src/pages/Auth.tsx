import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

import { Plane, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";

// Import 3D images
import airplane3D from "@/assets/airplane-3d.png";
import globe3D from "@/assets/globe-3d.png";
import suitcase3D from "@/assets/suitcase-3d.png";
import box3D from "@/assets/box-3d.png";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
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

    if (!isLogin && password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
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
          toast({
            title: "Welcome!",
            description: "Successfully logged in",
          });
          navigate("/dashboard");
        }
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes("User already registered")) {
            toast({
              title: "Account exists",
              description: "An account already exists with this email. Please login.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Registration failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Registration successful!",
            description: "Please check your email to verify your account",
          });
        }
      }
    } catch (err) {
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
              {isLogin ? "Login to your account" : "Create a new account"}
            </h1>
            <p className="text-muted-foreground">
              {isLogin ? "Track your shipments" : "Join WACC"}
            </p>
          </div>

          {/* Tabs */}
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
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
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
              <Label className="text-sm font-medium">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="your@email.com"
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
              {!isLogin && (
                <p className="text-xs text-muted-foreground mt-1.5">At least 6 characters</p>
              )}
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
                  {isLogin ? "Login" : "Register"}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Quick Login Info */}
          <div className="mt-6 p-4 bg-muted/50 rounded-xl">
            <p className="text-xs text-center text-muted-foreground">
              {isLogin
                ? "Don't have an account? Click the Register tab above"
                : "You'll need to verify your email after registration"
              }
            </p>
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
