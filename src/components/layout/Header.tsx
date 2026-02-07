import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Phone, Plane, ChevronRight, ArrowRight, User, LogIn, LayoutDashboard, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const navigation = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Services", href: "/services" },
  { name: "Cargo & Courier", href: "/cargo-courier" },
  { name: "Air Tickets", href: "/air-ticket" },
  { name: "Track Shipment", href: "/track-shipment" },
  { name: "Contact", href: "/contact" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user, role } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-background/95 backdrop-blur-xl shadow-premium border-b border-border/50"
          : "bg-transparent"
      )}
    >
      {/* Top contact bar */}
      <div
        className={cn(
          "bg-primary text-primary-foreground transition-all duration-300 overflow-hidden",
          scrolled ? "h-0 py-0" : "h-auto py-2"
        )}
      >
        <div className="container-wacc flex flex-wrap items-center justify-between text-sm">
          <div className="flex items-center gap-4 sm:gap-6">
            <a
              href="tel:+14378497607"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity touch-target"
            >
              <span className="text-base sm:text-lg">🇨🇦</span>
              <Phone className="h-3.5 w-3.5" />
              <span className="hidden sm:inline font-medium">+1 437 849 7607</span>
              <span className="sm:hidden text-xs">Canada</span>
            </a>
            <a
              href="tel:+8801715044409"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity touch-target"
            >
              <span className="text-base sm:text-lg">🇧🇩</span>
              <Phone className="h-3.5 w-3.5" />
              <span className="hidden sm:inline font-medium">+8801715044409</span>
              <span className="sm:hidden text-xs">Bangladesh</span>
            </a>
          </div>
          <div className="hidden md:flex items-center gap-3 text-primary-foreground/90 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Safe
            </span>
            <span className="text-primary-foreground/40">•</span>
            <span>Trusted</span>
            <span className="text-primary-foreground/40">•</span>
            <span>Affordable</span>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="container-wacc" aria-label="Global">
        <div className="flex h-16 sm:h-18 items-center justify-between">
          {/* Logo */}
          <div className="flex lg:flex-1">
            <Link to="/" className="flex items-center gap-2.5 -m-1.5 p-1.5 group">
              <div className="relative">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-primary flex items-center justify-center group-hover:shadow-glow transition-all duration-300">
                  <Plane className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-cta border-2 border-background" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-bold text-primary tracking-tight font-display">
                  WACC
                </span>
                <span className="text-[9px] sm:text-[10px] text-muted-foreground leading-none hidden sm:block tracking-wide">
                  Worldwide AirTicketing Cargo & Courier
                </span>
              </div>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex lg:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl p-2.5 text-foreground hover:bg-muted transition-colors touch-target"
              onClick={() => setMobileMenuOpen(true)}
            >
              <span className="sr-only">Open main menu</span>
              <Menu className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex lg:gap-x-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  location.pathname === item.href
                    ? "text-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-3">
            {user ? (
              <Button asChild variant="outline" size="sm" className="rounded-xl">
                <Link
                  to={role === 'admin' ? '/admin' : role === 'agent' ? '/agent' : '/dashboard'}
                  className="flex items-center gap-1.5"
                >
                  {role === 'admin' ? <LayoutDashboard className="h-4 w-4" /> :
                    role === 'agent' ? <ShieldCheck className="h-4 w-4" /> :
                      <User className="h-4 w-4" />}
                  {role === 'admin' ? 'Admin Panel' : role === 'agent' ? 'Agent Panel' : 'Dashboard'}
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm" className="rounded-xl">
                <Link to="/auth" className="flex items-center gap-1.5">
                  <LogIn className="h-4 w-4" />
                  Login
                </Link>
              </Button>
            )}
            <Button
              asChild
              size="sm"
              className="rounded-xl bg-cta hover:bg-cta/90 text-cta-foreground shadow-lg shadow-cta/20 hover:shadow-xl hover:shadow-cta/30 transition-all duration-300"
            >
              <Link to="/cargo-courier" className="flex items-center gap-1.5">
                Book Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-background shadow-2xl lg:hidden safe-top safe-bottom"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <Link
                    to="/"
                    className="flex items-center gap-2.5"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                      <Plane className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="text-xl font-bold text-primary font-display">WACC</span>
                  </Link>
                  <button
                    type="button"
                    className="rounded-xl p-2.5 text-foreground hover:bg-muted transition-colors touch-target"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span className="sr-only">Close menu</span>
                    <X className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                {/* Navigation links */}
                <div className="flex-1 overflow-y-auto py-4 px-4">
                  <nav className="space-y-1">
                    {navigation.map((item, index) => (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link
                          to={item.href}
                          className={cn(
                            "flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-medium transition-all touch-target",
                            location.pathname === item.href
                              ? "bg-primary/10 text-primary"
                              : "text-foreground hover:bg-muted"
                          )}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {item.name}
                          <ChevronRight
                            className={cn(
                              "h-5 w-5 transition-colors",
                              location.pathname === item.href
                                ? "text-primary"
                                : "text-muted-foreground"
                            )}
                          />
                        </Link>
                      </motion.div>
                    ))}
                  </nav>

                  {/* Quick contact */}
                  <div className="mt-8 space-y-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-4">
                      Quick Contact
                    </p>
                    <a
                      href="tel:+14378497607"
                      className="flex items-center gap-3 rounded-xl px-4 py-3 bg-muted/50 hover:bg-muted transition-colors touch-target"
                    >
                      <span className="text-xl">🇨🇦</span>
                      <div>
                        <p className="text-sm font-medium">Canada</p>
                        <p className="text-xs text-muted-foreground">+1 437 849 7607</p>
                      </div>
                    </a>
                    <a
                      href="tel:+8801715044409"
                      className="flex items-center gap-3 rounded-xl px-4 py-3 bg-muted/50 hover:bg-muted transition-colors touch-target"
                    >
                      <span className="text-xl">🇧🇩</span>
                      <div>
                        <p className="text-sm font-medium">Bangladesh</p>
                        <p className="text-xs text-muted-foreground">+8801715044409</p>
                      </div>
                    </a>
                  </div>
                </div>

                {/* Bottom CTAs */}
                <div className="p-4 border-t border-border space-y-3 bg-muted/30">
                  {user ? (
                    <Button asChild variant="outline" className="w-full h-12 rounded-xl text-base">
                      <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-2">
                        <User className="h-5 w-5" />
                        Dashboard
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild variant="outline" className="w-full h-12 rounded-xl text-base">
                      <Link to="/auth" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-2">
                        <LogIn className="h-5 w-5" />
                        Login / Sign Up
                      </Link>
                    </Button>
                  )}
                  <Button asChild variant="secondary" className="w-full h-12 rounded-xl text-base">
                    <Link to="/get-quote" onClick={() => setMobileMenuOpen(false)}>
                      Get Quote
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full h-12 rounded-xl text-base bg-cta hover:bg-cta/90 text-cta-foreground shadow-lg shadow-cta/20"
                  >
                    <Link
                      to="/cargo-courier"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2"
                    >
                      Book Now
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
