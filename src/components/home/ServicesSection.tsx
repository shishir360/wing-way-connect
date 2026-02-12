import { Link } from "react-router-dom";
import { Package, Plane, Globe, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const services = [
  {
    icon: Package,
    title: "Cargo & Courier",
    description: "Send packages, documents, and cargo between Canada and Bangladesh with real-time tracking.",
    badge: "Both Way Shipping",
    badgeColor: "bg-route-bd-ca/10 text-route-bd-ca border-route-bd-ca/20",
    link: "/cargo-courier",
    linkText: "Learn More",
    gradient: "from-emerald-500/10 to-emerald-500/5",
  },
  {
    icon: Plane,
    title: "Air Ticket Booking",
    description: "Book flights from Canada to Bangladesh with the best prices and hassle-free experience.",
    badge: "Best Prices",
    badgeColor: "bg-cta/10 text-cta border-cta/20",
    link: "/air-ticket",
    linkText: "Book Now",
    gradient: "from-amber-500/10 to-amber-500/5",
  },
  {
    icon: Globe,
    title: "International Shipping",
    description: "Reliable shipping services connecting Bangladesh with major Canadian cities.",
    badge: "Safe & Secure",
    badgeColor: "bg-primary/10 text-primary border-primary/20",
    link: "/services",
    linkText: "Learn More",
    gradient: "from-blue-500/10 to-blue-500/5",
  },
  {
    icon: Zap,
    title: "Express Delivery",
    description: "Fast track delivery between Dhaka and Toronto for urgent documents and parcels.",
    badge: "2-3 Days",
    badgeColor: "bg-route-ca-bd/10 text-route-ca-bd border-route-ca-bd/20",
    link: "/get-quote",
    linkText: "Get Quote",
    gradient: "from-rose-500/10 to-rose-500/5",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export default function ServicesSection() {
  return (
    <section className="section-padding overflow-hidden">
      <div className="container-wacc">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 sm:mb-16"
        >
          <span className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/5 rounded-full px-4 py-1.5 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Our Services
          </span>
          <h2 className="section-title">What We Offer</h2>
          <p className="section-subtitle mx-auto">
            Comprehensive cargo, courier, and air ticketing services connecting Canada and Bangladesh
          </p>
        </motion.div>

        {/* Services grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6"
        >
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.title}
                variants={itemVariants}
                className="group"
              >
                <div className="relative h-full bg-card rounded-2xl border border-border/50 p-6 sm:p-7 transition-all duration-500 hover:-translate-y-2 hover:shadow-premium-lg hover:border-primary/20 overflow-hidden">
                  {/* Gradient background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                  <div className="relative">
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-5 group-hover:bg-primary group-hover:scale-110 transition-all duration-500">
                      <Icon className="h-7 w-7 text-primary group-hover:text-primary-foreground transition-colors duration-500" />
                    </div>

                    {/* Badge */}
                    <span className={`inline-flex text-xs font-semibold px-3 py-1.5 rounded-full mb-4 border ${service.badgeColor}`}>
                      {service.badge}
                    </span>

                    {/* Content */}
                    <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                      {service.description}
                    </p>

                    {/* Link */}
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="p-0 h-auto text-primary hover:text-primary/80 hover:bg-transparent font-semibold group/btn"
                    >
                      <Link to={service.link} className="flex items-center gap-1.5">
                        {service.linkText}
                        <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
