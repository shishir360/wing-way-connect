import Layout from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import { Package, Plane, Truck, MapPin, Phone, Clock, Shield, CheckCircle, Users, Award, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Seo from "@/components/Seo";

// Import 3D images
import team3D from "@/assets/team-3d.png";
import handshake3D from "@/assets/handshake-3d.png";
import shield3D from "@/assets/shield-3d.png";
import globe3D from "@/assets/globe-3d.png";
import warehouse3D from "@/assets/warehouse-3d.png";
import containerShip3D from "@/assets/container-ship-3d.png";
import airplane3D from "@/assets/airplane-3d.png";
import truck3D from "@/assets/truck-3d.png";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

const stats = [
  { value: "50K+", label: "Packages Delivered", icon: Package },
  { value: "25K+", label: "Flights Booked", icon: Plane },
  { value: "10K+", label: "Happy Customers", icon: Users },
  { value: "5+", label: "Years Experience", icon: Award },
];

const whatWeDo = [
  { icon: Package, text: "Cargo & Courier Services (Both Ways)" },
  { icon: Plane, text: "Air Ticket Booking (Canada ↔ Bangladesh)" },
  { icon: Truck, text: "Door-to-Door Delivery" },
  { icon: MapPin, text: "Real-Time Shipment Tracking" },
  { icon: Globe, text: "International Shipping Solutions" },
  { icon: Package, text: "Commercial Cargo Handling" },
  { icon: Package, text: "Personal Package Delivery" },
  { icon: Phone, text: "24/7 Customer Support" },
];

const whyChooseUs = [
  "Both Way Shipping (Canada ↔ Bangladesh)",
  "Safe & Secure Handling",
  "Affordable Pricing",
  "Real-Time Tracking",
  "Door-to-Door Service",
  "24/7 Support in Both Countries",
];

export default function About() {
  return (
    <Layout>
      <Seo
        title="About Us"
        description="Learn about Wing Way Connect, our mission to bridge distances, and our team of experts dedicated to providing top-tier logistics and travel solutions."
      />
      {/* Hero */}
      <section className="page-hero text-primary-foreground py-16 sm:py-20 lg:py-28 relative overflow-hidden">
        {/* Floating 3D images - BIGGER */}
        <motion.img
          src={airplane3D}
          alt="Airplane"
          className="absolute top-4 right-[2%] w-40 sm:w-56 md:w-72 lg:w-80 opacity-80 hidden md:block"
          animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img
          src={globe3D}
          alt="Globe"
          className="absolute bottom-4 left-[3%] w-32 sm:w-48 md:w-60 lg:w-72 opacity-70 hidden md:block"
          animate={{ y: [0, 12, 0], rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.img
          src={containerShip3D}
          alt="Container Ship"
          className="absolute bottom-10 right-[8%] w-40 sm:w-56 md:w-72 lg:w-80 opacity-60 hidden lg:block"
          animate={{ y: [0, 8, 0], x: [0, 10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="container-wacc relative">
          <motion.div {...fadeInUp} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-2 text-primary-foreground/60 text-sm mb-4">
              <Link to="/" className="hover:text-primary-foreground transition-colors">Home</Link>
              <span>/</span>
              <span className="text-primary-foreground">About Us</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-display font-display font-bold mb-6">
              About <span className="text-gradient-gold">WACC</span>
            </h1>
            <p className="text-xl sm:text-2xl text-primary-foreground/80 max-w-2xl leading-relaxed">
              Worldwide AirTicketing Cargo & Courier — Your trusted partner for Canada-Bangladesh shipping and travel
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="relative -mt-16 z-10">
        <div className="container-wacc">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl sm:rounded-3xl shadow-premium-lg border border-border/50 p-6 sm:p-8"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 text-center">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label}>
                    <Icon className="h-6 w-6 text-primary mx-auto mb-2" />
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Who We Are */}
      <section className="section-padding">
        <div className="container-wacc">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div {...fadeInUp} transition={{ duration: 0.5 }}>
              <span className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/5 rounded-full px-4 py-1.5 mb-4 border border-primary/10">
                Our Story
              </span>
              <h2 className="section-title mb-6">Who We Are</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  WACC (Worldwide AirTicketing Cargo & Courier) is a leading logistics and travel service provider
                  specializing in cargo, courier, and air ticket booking services between Canada and Bangladesh.
                </p>
                <p>
                  We understand the needs of the Bangladeshi community in Canada and provide reliable, affordable,
                  and safe solutions for shipping packages and booking flights.
                </p>
                <p>
                  With offices in both Canada and Bangladesh, we offer seamless door-to-door delivery, real-time
                  tracking, and dedicated customer support in both countries. Whether you're sending gifts to loved
                  ones, shipping business cargo, or booking your next flight home, WACC is your trusted partner.
                </p>
              </div>
            </motion.div>
            <motion.div {...fadeInUp} transition={{ duration: 0.5, delay: 0.2 }} className="relative">
              <div className="bg-muted/50 rounded-3xl p-8 sm:p-10 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-cta/5" />

                {/* Decorative 3D images - BIGGER */}
                <motion.img
                  src={team3D}
                  alt="Team"
                  className="absolute -top-10 -right-10 w-40 sm:w-52 md:w-64 opacity-80"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.img
                  src={handshake3D}
                  alt="Handshake"
                  className="absolute -bottom-8 -left-8 w-36 sm:w-48 md:w-56 opacity-70"
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                />

                <div className="relative">
                  <div className="flex justify-center items-center gap-4 sm:gap-6 mb-6">
                    <span className="text-5xl sm:text-6xl filter drop-shadow-lg">🇧🇩</span>
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Plane className="h-6 w-6 text-primary animate-pulse-gentle" />
                    </div>
                    <span className="text-5xl sm:text-6xl filter drop-shadow-lg">🇨🇦</span>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-primary mb-2 font-display">Both Way Shipping</p>
                  <p className="text-muted-foreground">Safe • Trusted • Affordable</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section-padding bg-secondary/50 mesh-gradient relative overflow-hidden">
        {/* Decorative 3D images - BIGGER */}
        <motion.img
          src={shield3D}
          alt="Shield"
          className="absolute top-4 right-[3%] w-40 sm:w-56 md:w-64 opacity-60 hidden lg:block"
          animate={{ y: [0, -12, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img
          src={warehouse3D}
          alt="Warehouse"
          className="absolute bottom-4 left-[3%] w-48 sm:w-64 md:w-80 opacity-50 hidden lg:block"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        <div className="container-wacc relative">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            <motion.div {...fadeInUp} transition={{ duration: 0.5 }}>
              <div className="h-full bg-card rounded-2xl p-8 sm:p-10 shadow-premium border border-border/50 relative overflow-hidden">
                <motion.img
                  src={shield3D}
                  alt="Shield"
                  className="absolute -top-4 -right-4 w-16 opacity-30"
                  animate={{ rotate: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <Shield className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-4 font-display">Our Mission</h3>
                <p className="text-muted-foreground leading-relaxed">
                  To provide safe, trusted, and affordable cargo and air ticketing services that connect
                  families and businesses between Canada and Bangladesh with excellence and care.
                </p>
              </div>
            </motion.div>
            <motion.div {...fadeInUp} transition={{ duration: 0.5, delay: 0.1 }}>
              <div className="h-full bg-card rounded-2xl p-8 sm:p-10 shadow-premium border border-border/50 relative overflow-hidden">
                <motion.img
                  src={airplane3D}
                  alt="Airplane"
                  className="absolute -top-4 -right-4 w-16 opacity-30"
                  animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="w-14 h-14 rounded-2xl bg-cta/10 flex items-center justify-center mb-6">
                  <Plane className="h-7 w-7 text-cta" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-4 font-display">Our Vision</h3>
                <p className="text-muted-foreground leading-relaxed">
                  To become the most reliable and customer-focused logistics and travel service provider
                  for the Canada-Bangladesh corridor, setting new standards in the industry.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="section-padding relative overflow-hidden">
        <motion.img
          src={truck3D}
          alt="Truck"
          className="absolute top-10 right-[2%] w-40 sm:w-56 md:w-72 opacity-50 hidden lg:block"
          animate={{ x: [0, 15, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="container-wacc">
          <motion.div {...fadeInUp} transition={{ duration: 0.5 }} className="text-center mb-12">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/5 rounded-full px-4 py-1.5 mb-4 border border-primary/10">
              Our Services
            </span>
            <h2 className="section-title">What We Do</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {whatWeDo.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  className="flex items-center gap-4 p-5 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium">{item.text}</span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="section-padding bg-secondary/50">
        <div className="container-wacc">
          <motion.div {...fadeInUp} transition={{ duration: 0.5 }} className="text-center mb-12">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/5 rounded-full px-4 py-1.5 mb-4 border border-primary/10">
              Why WACC
            </span>
            <h2 className="section-title">Why Choose Us?</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-4xl mx-auto">
            {whyChooseUs.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                className="flex items-center gap-4 bg-card p-5 rounded-xl shadow-premium border border-border/50"
              >
                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-success" />
                </div>
                <span className="font-medium">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="section-padding">
        <div className="container-wacc">
          <motion.div {...fadeInUp} transition={{ duration: 0.5 }}>
            <div className="page-hero text-primary-foreground rounded-3xl p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-hero-mesh opacity-30" />
              <div className="relative">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4 font-display">Ready to Experience Reliable Service?</h2>
                <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto text-lg">
                  Contact us today and let us handle your shipping and travel needs with care
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button asChild size="lg" className="h-12 sm:h-14 px-6 sm:px-8 rounded-xl text-base bg-cta hover:bg-cta/90 text-cta-foreground shadow-xl">
                    <Link to="/contact">Contact Us</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-12 sm:h-14 px-6 sm:px-8 rounded-xl text-base bg-white/5 border-white/20 text-white hover:bg-white/10">
                    <Link to="/get-quote">Get a Quote</Link>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}