import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Seo from "@/components/Seo";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

import { Plane, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";

// Import 3D images
import airplane3D from "@/assets/airplane-3d.png";
import globe3D from "@/assets/globe-3d.png";
import suitcase3D from "@/assets/suitcase-3d.png";
import box3D from "@/assets/box-3d.png";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { signIn, user, role } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      // If role is loaded, use it. If not, default to dashboard for standard users.
      // We don't want to block access if role is taking a moment, but ideally role is fast.
      if (role === 'admin') navigate("/admin");
      else if (role === 'agent') navigate("/agent");
      else navigate("/dashboard");
    }
  }, [user, role, navigate]);

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
        toast({
          title: "Welcome!",
          description: "Successfully logged in",
        });
        // Navigation handled by useEffect when user/role updates
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
      <Seo title="Login" description="Login to track shipments and manage your bookings with Wing Way Connect." />
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
              Login to your account
            </h1>
            <p className="text-muted-foreground">
              Track your shipments
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  Login
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Quick Login Info */}
          <div className="mt-6 p-4 bg-muted/50 rounded-xl">
            <p className="text-xs text-center text-muted-foreground">
              Don't have an account? Contact support.
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
