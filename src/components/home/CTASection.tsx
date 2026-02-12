import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plane, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function CTASection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-hero-pattern" />
      <div className="absolute inset-0 bg-hero-mesh opacity-40" />

      {/* Animated orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-radial from-white/10 to-transparent rounded-full blur-3xl animate-float-slow" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-radial from-cta/20 to-transparent rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '3s' }} />

      <div className="container-wacc relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          {/* Flags */}
          <div className="flex justify-center items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
            <span className="text-5xl sm:text-6xl filter drop-shadow-lg">🇧🇩</span>
            <div className="relative">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <Plane className="h-6 w-6 sm:h-7 sm:w-7 text-white animate-pulse-gentle" />
              </div>
            </div>
            <span className="text-5xl sm:text-6xl filter drop-shadow-lg">🇨🇦</span>
          </div>

          <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium mb-4">
            Official Platform: wcargo2024.com
          </span>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-4 sm:mb-6">
            Ready to Ship or Fly?
          </h2>
          <p className="text-lg sm:text-xl text-white/80 mb-8 sm:mb-10 max-w-xl mx-auto leading-relaxed">
            Get started today with WACC — Your trusted partner for Canada-Bangladesh shipping and travel
          </p>

          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            <Button
              asChild
              size="lg"
              className="h-12 sm:h-14 px-6 sm:px-8 rounded-xl text-base sm:text-lg bg-route-bd-ca hover:bg-route-bd-ca/90 text-white shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <Link to="/cargo-courier" className="flex items-center gap-2">
                Book Cargo
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="h-12 sm:h-14 px-6 sm:px-8 rounded-xl text-base sm:text-lg bg-route-ca-bd hover:bg-route-ca-bd/90 text-white shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <Link to="/air-ticket" className="flex items-center gap-2">
                Book Air Ticket
                <Plane className="h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="h-12 sm:h-14 px-6 sm:px-8 rounded-xl text-base sm:text-lg btn-cta shadow-xl hover:shadow-2xl"
            >
              <Link to="/get-quote">Get a Quote</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
