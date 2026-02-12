import { Link } from "react-router-dom";
import { Plane, ArrowRight, Package, Ticket, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

// Import 3D images
import box3D from "@/assets/box-3d.png";
import airplane3D from "@/assets/airplane-3d.png";
import cargoPlane3D from "@/assets/cargo-plane-3d.png";
import locationPin3D from "@/assets/location-pin-3d.png";
import truck3D from "@/assets/truck-3d.png";
import globe3D from "@/assets/globe-3d.png";
import ship3D from "@/assets/ship-3d.png";
import containerShip3D from "@/assets/container-ship-3d.png";
import passport3D from "@/assets/passport-3d.png";
import clock3D from "@/assets/clock-3d.png";
import flyingBox3D from "@/assets/flying-box-3d.png";
import giftBox3D from "@/assets/gift-box-3d.png";
import suitcase3D from "@/assets/suitcase-3d.png";
import bdFlag3D from "@/assets/bangladesh-flag-3d.png";
import caFlag3D from "@/assets/canada-flag-3d.png";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const stats = [
  { icon: Package, value: "50K+", label: "Packages Delivered" },
  { icon: Ticket, value: "25K+", label: "Flights Booked" },
  { icon: Shield, value: "99.9%", label: "Safe Delivery" },
  { icon: Clock, value: "24/7", label: "Support" },
];

// Floating 3D elements configuration - BIGGER IMAGES
const floatingElements = [
  {
    src: cargoPlane3D,
    alt: "Cargo Airplane",
    className: "absolute top-8 right-[3%] w-40 sm:w-52 md:w-72 lg:w-80 z-10",
    animate: { y: [0, -25, 0], rotate: [0, 5, 0], x: [0, 10, 0] },
    duration: 6,
    delay: 0,
  },
  {
    src: box3D,
    alt: "Package Box",
    className: "absolute top-24 left-[2%] w-28 sm:w-36 md:w-48 lg:w-56 z-10",
    animate: { y: [0, 20, 0], rotate: [0, -5, 0] },
    duration: 5,
    delay: 0.5,
  },
  {
    src: globe3D,
    alt: "Globe",
    className: "absolute bottom-32 right-[5%] w-36 sm:w-48 md:w-60 lg:w-72 z-10",
    animate: { y: [0, -15, 0], rotate: [0, 360] },
    duration: 20,
    delay: 1,
  },
  {
    src: containerShip3D,
    alt: "Cargo Ship",
    className: "absolute bottom-20 left-[3%] w-40 sm:w-52 md:w-64 lg:w-80 z-10",
    animate: { y: [0, 10, 0], x: [0, 15, 0] },
    duration: 7,
    delay: 0.3,
  },
  {
    src: truck3D,
    alt: "Delivery Truck",
    className: "absolute top-1/2 right-[1%] w-32 sm:w-40 md:w-52 lg:w-60 z-10",
    animate: { y: [0, -12, 0], x: [0, -8, 0] },
    duration: 5.5,
    delay: 1.5,
  },
  {
    src: locationPin3D,
    alt: "Location Pin",
    className: "absolute top-20 left-[12%] w-24 sm:w-32 md:w-40 lg:w-48 z-10",
    animate: { y: [0, -20, 0], scale: [1, 1.1, 1] },
    duration: 4,
    delay: 0.8,
  },
  {
    src: passport3D,
    alt: "Passport",
    className: "absolute bottom-40 right-[18%] w-28 sm:w-36 md:w-48 lg:w-56 z-10",
    animate: { y: [0, 15, 0], rotate: [0, -8, 0] },
    duration: 6,
    delay: 2,
  },
  {
    src: clock3D,
    alt: "Clock",
    className: "absolute top-32 right-[22%] w-24 sm:w-32 md:w-40 lg:w-48 z-10",
    animate: { y: [0, -18, 0], rotate: [0, 10, -10, 0] },
    duration: 5,
    delay: 1.2,
  },
  // New animated 3D images - BIGGER
  {
    src: flyingBox3D,
    alt: "Flying Box",
    className: "absolute top-40 left-[22%] w-32 sm:w-40 md:w-52 lg:w-60 z-10",
    animate: { y: [0, -20, 0], x: [0, 12, 0], rotate: [0, 8, 0] },
    duration: 5.5,
    delay: 0.7,
  },
  {
    src: giftBox3D,
    alt: "Gift Box",
    className: "absolute bottom-28 right-[10%] w-28 sm:w-36 md:w-48 lg:w-56 z-10",
    animate: { y: [0, 18, 0], scale: [1, 1.05, 1] },
    duration: 4.5,
    delay: 1.8,
  },
  {
    src: suitcase3D,
    alt: "Suitcase",
    className: "absolute top-28 right-[32%] w-28 sm:w-36 md:w-48 lg:w-56 z-10",
    animate: { y: [0, -16, 0], rotate: [0, -6, 0] },
    duration: 6.5,
    delay: 2.2,
  },
  {
    src: ship3D,
    alt: "Ship",
    className: "absolute bottom-16 left-[15%] w-40 sm:w-52 md:w-64 lg:w-80 z-10",
    animate: { y: [0, 8, 0], x: [0, -10, 0] },
    duration: 8,
    delay: 1.0,
  },
];

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Parallax transforms for different layers
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden min-h-[95vh] sm:min-h-[85vh] flex items-center py-10 sm:py-0">
      {/* Premium gradient background */}
      <div className="absolute inset-0 bg-hero-pattern" />

      {/* Mesh overlay */}
      <div className="absolute inset-0 bg-hero-mesh opacity-50" />

      {/* Animated gradient orbs */}
      <motion.div
        style={{ y: y1 }}
        className="absolute top-1/4 -left-32 w-96 h-96 bg-gradient-radial from-blue-500/20 to-transparent rounded-full blur-3xl animate-float-slow"
      />
      <motion.div
        style={{ y: y2 }}
        className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gradient-radial from-emerald-500/15 to-transparent rounded-full blur-3xl animate-float-slow"
      />
      <motion.div
        style={{ y: y3 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-amber-500/10 to-transparent rounded-full blur-3xl"
      />

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />

      {/* Floating 3D Elements with Parallax */}
      <motion.div style={{ y: y1, opacity }} className="absolute inset-0 pointer-events-none hidden md:block">
        {floatingElements.slice(0, 4).map((element, index) => (
          <motion.img
            key={element.alt}
            src={element.src}
            alt={element.alt}
            className={`${element.className} opacity-80 drop-shadow-2xl`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: 0.8,
              scale: 1,
              ...element.animate
            }}
            transition={{
              opacity: { duration: 0.8, delay: element.delay },
              scale: { duration: 0.8, delay: element.delay },
              y: { duration: element.duration, repeat: Infinity, ease: "easeInOut" },
              x: element.animate.x ? { duration: element.duration, repeat: Infinity, ease: "easeInOut" } : undefined,
              rotate: { duration: element.duration, repeat: Infinity, ease: "easeInOut" },
            }}
          />
        ))}
      </motion.div>

      <motion.div style={{ y: y2, opacity }} className="absolute inset-0 pointer-events-none hidden lg:block">
        {floatingElements.slice(4).map((element) => (
          <motion.img
            key={element.alt}
            src={element.src}
            alt={element.alt}
            className={`${element.className} opacity-70 drop-shadow-xl`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: 0.7,
              scale: 1,
              ...element.animate
            }}
            transition={{
              opacity: { duration: 0.8, delay: element.delay },
              scale: { duration: 0.8, delay: element.delay },
              y: { duration: element.duration, repeat: Infinity, ease: "easeInOut" },
              x: element.animate.x ? { duration: element.duration, repeat: Infinity, ease: "easeInOut" } : undefined,
              rotate: { duration: element.duration, repeat: Infinity, ease: "easeInOut" },
            }}
          />
        ))}
      </motion.div>

      {/* Mobile floating elements - BIGGER */}
      <motion.div style={{ opacity }} className="absolute inset-0 pointer-events-none md:hidden">
        <motion.img
          src={airplane3D}
          alt="Airplane"
          className="absolute top-12 right-0 w-32 opacity-70 drop-shadow-lg"
          animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img
          src={box3D}
          alt="Box"
          className="absolute top-24 left-0 w-24 opacity-60 drop-shadow-lg"
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        <motion.img
          src={globe3D}
          alt="Globe"
          className="absolute bottom-48 right-2 w-28 opacity-60 drop-shadow-lg"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.img
          src={ship3D}
          alt="Ship"
          className="absolute bottom-32 left-0 w-32 opacity-50 drop-shadow-lg"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
      </motion.div>

      <div className="container-wacc relative py-12 sm:py-20 lg:py-28 z-20">
        <motion.div
          initial="initial"
          animate="animate"
          variants={stagger}
          className="mx-auto max-w-5xl text-center"
        >
          {/* Trust badge */}
          <motion.div
            variants={fadeInUp}
            className="inline-flex items-center gap-2 sm:gap-3 rounded-full bg-white/10 backdrop-blur-md px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-medium text-white mb-6 sm:mb-8 border border-white/10 shadow-lg"
          >
            <div className="flex items-center gap-1.5 sm:gap-2">
              <img src={bdFlag3D} alt="BD" className="h-5 sm:h-6 w-auto drop-shadow-sm" />
              <Plane className="h-3.5 w-3.5 text-cta animate-plane-fly" />
              <img src={caFlag3D} alt="Canada" className="h-5 sm:h-6 w-auto drop-shadow-sm" />
            </div>
            <span className="h-4 w-px bg-white/20" />
            <span className="text-white/90">Safe • Trusted • Low Cost</span>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            variants={fadeInUp}
            className="text-3xl sm:text-5xl md:text-6xl lg:text-display-lg font-display font-bold tracking-tight text-white mb-4 sm:mb-6"
          >
            <span className="block">Bangladesh - Canada</span>
            <span className="block mt-1 sm:mt-2">
              <span className="text-gradient-gold">Cargo & Travel</span>
            </span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-base sm:text-xl md:text-2xl text-white/80 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed px-4 sm:px-0"
          >
            Premium Cargo, Courier & Air Ticket Services
            <br className="hidden sm:block" />
            <span className="text-white/60"> Connecting loved ones across the globe</span>
          </motion.p>

          {/* Visual flags with airplane */}
          <motion.div
            variants={fadeInUp}
            className="flex items-center justify-center gap-4 sm:gap-14 mb-10 sm:mb-14"
          >
            <div className="flex flex-col items-center group cursor-pointer hover:scale-110 transition-transform duration-300">
              <div className="relative">
                <img src={bdFlag3D} alt="Bangladesh Flag" className="h-16 sm:h-32 w-auto filter drop-shadow-2xl animate-float" />
                <div className="absolute -bottom-1 sm:-bottom-2 left-1/2 -translate-x-1/2 w-12 sm:w-20 h-1 sm:h-2 bg-black/30 rounded-full blur-md" />
              </div>
              <span className="text-xs sm:text-lg mt-2 sm:mt-4 text-white font-bold tracking-wide">Bangladesh</span>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="w-8 sm:w-24 h-0.5 bg-gradient-to-r from-transparent via-white/50 to-white/50" />
              <div className="relative">
                <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-2xl shadow-primary/20">
                  <Plane className="h-6 w-6 sm:h-10 sm:w-10 text-white animate-pulse-gentle" />
                </div>
                <div className="absolute inset-0 rounded-full animate-pulse-glow" />
              </div>
              <div className="w-8 sm:w-24 h-0.5 bg-gradient-to-r from-white/50 via-white/50 to-transparent" />
            </div>

            <div className="flex flex-col items-center group cursor-pointer hover:scale-110 transition-transform duration-300">
              <div className="relative">
                <img src={caFlag3D} alt="Canada Flag" className="h-16 sm:h-32 w-auto filter drop-shadow-2xl animate-float-delayed" />
                <div className="absolute -bottom-1 sm:-bottom-2 left-1/2 -translate-x-1/2 w-12 sm:w-20 h-1 sm:h-2 bg-black/30 rounded-full blur-md" />
              </div>
              <span className="text-xs sm:text-lg mt-2 sm:mt-4 text-white font-bold tracking-wide">Canada</span>
            </div>
          </motion.div>

          {/* Route CTA buttons */}
          <motion.div
            variants={fadeInUp}
            className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto mb-12"
          >
            <Link to="/cargo-courier?route=bd-to-ca" className="group">
              <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 sm:p-6 transition-all duration-500 hover:-translate-y-2 hover:bg-white/15 hover:border-cta/50 hover:shadow-2xl overflow-hidden group-hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-cta/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <span className="text-base sm:text-xl font-bold text-white">From Bangladesh</span>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-cta/20 flex items-center justify-center border border-cta/30">
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-cta group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <img src={bdFlag3D} alt="BD" className="h-6 w-auto" />
                    <div className="h-px flex-1 bg-white/20" />
                    <Plane className="h-4 w-4 text-white/60" />
                    <div className="h-px flex-1 bg-white/20" />
                    <img src={caFlag3D} alt="CA" className="h-6 w-auto" />
                  </div>
                  <p className="text-xs text-white/50 mt-3 text-right">To Canada • 5-7 Days</p>
                </div>
              </div>
            </Link>

            <Link to="/cargo-courier?route=ca-to-bd" className="group">
              <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-4 sm:p-6 transition-all duration-500 hover:-translate-y-2 hover:bg-white/15 hover:border-cta/50 hover:shadow-2xl overflow-hidden group-hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-cta/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <span className="text-base sm:text-xl font-bold text-white">From Canada</span>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-cta/20 flex items-center justify-center border border-cta/30">
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-cta group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <img src={caFlag3D} alt="CA" className="h-6 w-auto" />
                    <div className="h-px flex-1 bg-white/20" />
                    <Plane className="h-4 w-4 text-white/60 transform rotate-180" />
                    <div className="h-px flex-1 bg-white/20" />
                    <img src={bdFlag3D} alt="BD" className="h-6 w-auto" />
                  </div>
                  <p className="text-xs text-white/50 mt-3 text-right">To Bangladesh • 5-7 Days</p>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Additional CTAs */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-wrap items-center justify-center gap-3 sm:gap-4"
          >
            <Button
              asChild
              size="lg"
              className="h-12 sm:h-14 px-6 sm:px-8 rounded-xl text-base sm:text-lg bg-cta hover:bg-cta/90 text-cta-foreground shadow-xl shadow-cta/30 hover:shadow-2xl hover:shadow-cta/40 transition-all duration-300 btn-premium"
            >
              <Link to="/get-quote">Get a Quote</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 sm:h-14 px-6 sm:px-8 rounded-xl text-base sm:text-lg bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 backdrop-blur-sm"
            >
              <Link to="/track-shipment">Track Shipment</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 sm:h-14 px-6 sm:px-8 rounded-xl text-base sm:text-lg bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 backdrop-blur-sm"
            >
              <Link to="/air-ticket">Book Air Ticket</Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-16 sm:mt-20"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="relative group"
                >
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 sm:p-6 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 text-center">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-cta mx-auto mb-2" />
                    <div className="text-xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">{stat.value}</div>
                    <div className="text-[10px] sm:text-sm text-white/60">{stat.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="hsl(var(--background))"
          />
        </svg>
      </div>
    </section>
  );
}
