import Layout from "@/components/layout/Layout";
import { Link } from "react-router-dom";
import { Package, Plane, Globe, Truck, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Seo from "@/components/Seo";

// Import 3D images
import box3D from "@/assets/box-3d.png";
import airplane3D from "@/assets/airplane-3d.png";
import globe3D from "@/assets/globe-3d.png";
import truck3D from "@/assets/truck-3d.png";
import warehouse3D from "@/assets/warehouse-3d.png";
import containerShip3D from "@/assets/container-ship-3d.png";
import flyingBox3D from "@/assets/flying-box-3d.png";
import boardingPass3D from "@/assets/boarding-pass-3d.png";

const services = [
  {
    id: "cargo-courier",
    icon: Package,
    image: box3D,
    title: "Cargo & Courier Services",
    description: "Send packages, documents, and cargo safely between Canada and Bangladesh",
    features: [
      "Both Way Shipping (🇧🇩 ↔ 🇨🇦)",
      "Documents & Parcels",
      "Commercial Cargo",
      "Personal Items & Gifts",
      "Heavy Cargo (up to 100kg+)",
      "Door-to-Door Delivery",
      "Real-Time Tracking",
      "Insurance Available",
    ],
    pricing: "Starting from $12/kg",
    cta: "Book Cargo",
    link: "/cargo-courier",
    color: "bg-route-bd-ca",
  },
  {
    id: "air-ticket",
    icon: Plane,
    image: boardingPass3D,
    title: "Air Ticket Booking",
    description: "Book flights from Canada to Bangladesh and vice versa at the best prices",
    features: [
      "Canada → Bangladesh flights",
      "Bangladesh → Canada flights",
      "Economy & Business Class",
      "One-Way & Round Trip",
      "Group Bookings Available",
      "Flexible Dates",
      "Best Airline Options",
      "24/7 Booking Support",
    ],
    pricing: "Compare prices from multiple airlines",
    cta: "Book Air Ticket",
    link: "/air-ticket",
    color: "bg-route-ca-bd",
  },
  {
    id: "international-shipping",
    icon: Globe,
    image: containerShip3D,
    title: "International Shipping",
    description: "Reliable shipping solutions with global coverage",
    features: [
      "Worldwide delivery options",
      "Express & Standard shipping",
      "Import/Export assistance",
      "Customs clearance support",
      "Secure packaging",
      "Full tracking visibility",
    ],
    pricing: "Contact for pricing",
    cta: "Learn More",
    link: "/contact",
    color: "bg-primary",
  },
  {
    id: "door-to-door",
    icon: Truck,
    image: truck3D,
    title: "Door-to-Door Delivery",
    description: "Complete pickup and delivery service in both countries",
    features: [
      "Pickup from your location in Canada",
      "Delivery to any address in Bangladesh",
      "Or vice versa",
      "No need to visit offices",
      "Scheduled pickups",
      "Delivery notifications",
    ],
    pricing: "Included with cargo service",
    cta: "Get Quote",
    link: "/get-quote",
    color: "bg-cta",
  },
];

export default function Services() {
  return (
    <Layout>
      <Seo
        title="Services - Cargo, Freight & Air Tickets"
        description="Explore our professional logistics, air cargo, freight, and air ticket services for global shipments."
      />
      {/* Hero */}
      <section className="bg-hero-pattern text-primary-foreground py-16 md:py-20 relative overflow-hidden">
        {/* Floating 3D images - BIGGER */}
        <motion.img
          src={airplane3D}
          alt="Airplane"
          className="absolute top-2 right-[2%] w-40 sm:w-56 md:w-72 lg:w-80 opacity-80 hidden md:block"
          animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img
          src={box3D}
          alt="Box"
          className="absolute bottom-4 left-[3%] w-32 sm:w-44 md:w-56 lg:w-64 opacity-70 hidden md:block"
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img
          src={globe3D}
          alt="Globe"
          className="absolute top-1/2 right-[8%] w-32 sm:w-48 md:w-56 opacity-60 hidden lg:block"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.img
          src={flyingBox3D}
          alt="Flying Box"
          className="absolute bottom-10 right-[12%] w-36 sm:w-48 md:w-60 opacity-60 hidden lg:block"
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img
          src={warehouse3D}
          alt="Warehouse"
          className="absolute bottom-4 right-[30%] w-44 sm:w-60 md:w-72 opacity-50 hidden xl:block"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        <div className="container-wacc relative">
          <div className="flex items-center gap-2 text-primary-foreground/70 text-sm mb-4">
            <Link to="/" className="hover:text-primary-foreground">Home</Link>
            <span>/</span>
            <span>Services</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Services</h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl">
            We offer comprehensive cargo, courier, and air ticketing services between Canada and Bangladesh
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="section-padding">
        <div className="container-wacc">
          <div className="grid md:grid-cols-2 gap-8">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <motion.div
                  key={service.title}
                  id={service.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="bg-card rounded-xl border border-border overflow-hidden shadow-card scroll-mt-24"
                >
                  <div className={`${service.color} text-white p-6 relative overflow-hidden`}>
                    {/* 3D image in header */}
                    <motion.img
                      src={service.image}
                      alt={service.title}
                      className="absolute -right-4 -top-4 w-24 sm:w-32 opacity-40"
                      animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <Icon className="h-10 w-10 mb-4 relative z-10" />
                    <h3 className="text-2xl font-bold mb-2 relative z-10">{service.title}</h3>
                    <p className="text-white/80 relative z-10">{service.description}</p>
                  </div>
                  <div className="p-6">
                    <ul className="space-y-3 mb-6">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm text-muted-foreground mb-4">{service.pricing}</p>
                    <Button asChild className="w-full">
                      <Link to={service.link} className="flex items-center justify-center gap-2">
                        {service.cta}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="section-padding bg-secondary relative overflow-hidden">
        <motion.img
          src={containerShip3D}
          alt="Container Ship"
          className="absolute bottom-4 right-[3%] w-52 sm:w-72 md:w-96 opacity-40 hidden lg:block"
          animate={{ y: [0, 10, 0], x: [0, -8, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="container-wacc relative">
          <h2 className="section-title text-center mb-8">Service Comparison</h2>
          <div className="max-w-3xl mx-auto overflow-x-auto">
            <table className="w-full bg-card rounded-xl border border-border overflow-hidden">
              <thead>
                <tr className="bg-primary text-primary-foreground">
                  <th className="px-6 py-4 text-left font-semibold">Feature</th>
                  <th className="px-6 py-4 text-left font-semibold">Cargo Service</th>
                  <th className="px-6 py-4 text-left font-semibold">Air Ticket</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-6 py-4 font-medium">Delivery Time</td>
                  <td className="px-6 py-4 text-muted-foreground">5-7 days</td>
                  <td className="px-6 py-4 text-muted-foreground">Same day (flight)</td>
                </tr>
                <tr className="bg-secondary/50">
                  <td className="px-6 py-4 font-medium">Weight Limit</td>
                  <td className="px-6 py-4 text-muted-foreground">Up to 100kg+</td>
                  <td className="px-6 py-4 text-muted-foreground">Baggage allowance</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">Tracking</td>
                  <td className="px-6 py-4 text-muted-foreground">Real-time</td>
                  <td className="px-6 py-4 text-muted-foreground">Booking confirmation</td>
                </tr>
                <tr className="bg-secondary/50">
                  <td className="px-6 py-4 font-medium">Door Service</td>
                  <td className="px-6 py-4 text-muted-foreground">Yes</td>
                  <td className="px-6 py-4 text-muted-foreground">Airport only</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-medium">Pricing</td>
                  <td className="px-6 py-4 text-muted-foreground">Per kg</td>
                  <td className="px-6 py-4 text-muted-foreground">Per ticket</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding relative overflow-hidden">
        <motion.img
          src={truck3D}
          alt="Truck"
          className="absolute top-1/2 left-[2%] w-48 sm:w-64 md:w-80 opacity-40 hidden lg:block -translate-y-1/2"
          animate={{ x: [0, 20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="container-wacc text-center relative">
          <h2 className="section-title mb-4">Not Sure Which Service You Need?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Contact us and our team will help you choose the best option for your needs
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="bg-cta hover:bg-cta/90 text-cta-foreground">
              <Link to="/get-quote">Get a Quote</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/contact">Talk to Expert</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}