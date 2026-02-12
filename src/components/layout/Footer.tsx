import { Link } from "react-router-dom";
import { Plane, Phone, Mail, MapPin, Facebook, Instagram, Youtube, MessageCircle, ArrowUp } from "lucide-react";
import { contactInfo } from "@/data/mockData";

const quickLinks = [
  { name: "Home", href: "/" },
  { name: "About Us", href: "/about" },
  { name: "Services", href: "/services" },
  { name: "Cargo & Courier", href: "/cargo-courier" },
  { name: "Air Ticket Booking", href: "/air-ticket" },
  { name: "Track Shipment", href: "/track-shipment" },
  { name: "Get a Quote", href: "/get-quote" },
  { name: "FAQ", href: "/faq" },
  { name: "Contact Us", href: "/contact" },
];

const services = [
  { name: "Cargo Services", href: "/services#cargo-courier" },
  { name: "Courier Services", href: "/services#cargo-courier" },
  { name: "Air Ticket Booking", href: "/air-ticket" },
  { name: "Door-to-Door Delivery", href: "/services#door-to-door" },
  { name: "International Shipping", href: "/services#international-shipping" },
  { name: "Express Delivery", href: "/cargo-courier" },
  { name: "Commercial Cargo", href: "/cargo-courier" },
  { name: "Personal Packages", href: "/cargo-courier" },
];

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-primary text-primary-foreground overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />

      <div className="container-wacc relative py-12 sm:py-16 lg:py-20">
        {/* Main footer content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Company Info */}
          <div className="sm:col-span-2 lg:col-span-1 space-y-5">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="WACC" className="h-16 w-auto object-contain bg-white/10 p-2 rounded-xl backdrop-blur-sm" />
              <div>
                <span className="text-2xl font-bold font-display">WACC</span>
                <p className="text-xs text-primary-foreground/70">
                  Worldwide AirTicketing Cargo & Courier
                </p>
              </div>
            </div>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              Your reliable partner for cargo, courier, and air ticketing services between Canada and Bangladesh.
            </p>
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="text-xl">🇧🇩</span>
              <span className="text-primary-foreground/40">↔</span>
              <span className="text-xl">🇨🇦</span>
              <span className="ml-2">Both Way Shipping</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-xs font-medium border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              Safe • Trusted • Affordable
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-5 font-display">Quick Links</h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-primary-foreground/30 group-hover:bg-cta transition-colors" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-bold mb-5 font-display">Our Services</h3>
            <ul className="space-y-2.5">
              {services.map((service) => (
                <li key={service.name}>
                  <Link
                    to={service.href}
                    className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-primary-foreground/30 group-hover:bg-cta transition-colors" />
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-5 font-display">Contact Us</h3>

            {/* Canada Office */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🇨🇦</span>
                <span className="font-semibold">Canada Office</span>
              </div>
              <ul className="space-y-2.5 text-sm text-primary-foreground/80">
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-4 w-4" />
                  </div>
                  <a href={`tel:${contactInfo.canada.phone}`} className="hover:text-primary-foreground transition-colors">
                    {contactInfo.canada.phone}
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <a href={`mailto:${contactInfo.canada.email}`} className="hover:text-primary-foreground transition-colors">
                    {contactInfo.canada.email}
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <span>{contactInfo.canada.address}</span>
                </li>
              </ul>
            </div>

            {/* Bangladesh Office */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🇧🇩</span>
                <span className="font-semibold">Bangladesh Office</span>
              </div>
              <ul className="space-y-2.5 text-sm text-primary-foreground/80">
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="h-4 w-4" />
                  </div>
                  <a href={`tel:${contactInfo.bangladesh.phone}`} className="hover:text-primary-foreground transition-colors">
                    {contactInfo.bangladesh.phone}
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <a href={`mailto:${contactInfo.bangladesh.email}`} className="hover:text-primary-foreground transition-colors">
                    {contactInfo.bangladesh.email}
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <span>{contactInfo.bangladesh.address}</span>
                </li>
              </ul>
            </div>

            {/* Social Media */}
            <div>
              <h4 className="font-semibold mb-3">Follow Us</h4>
              <div className="flex gap-2">
                <a href="#" className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Facebook className="h-5 w-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-colors">
                  <Youtube className="h-5 w-5" />
                </a>
                <a href="https://wa.me/14378497607" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-route-bd-ca rounded-xl flex items-center justify-center hover:bg-route-bd-ca/80 transition-colors">
                  <MessageCircle className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 sm:mt-16 pt-8 border-t border-primary-foreground/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-primary-foreground/60 text-center md:text-left">
              © 2026 WACC - wcargo2024.com. All Rights Reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-primary-foreground/60">
              <Link to="/terms" className="hover:text-primary-foreground transition-colors">Terms</Link>
              <span className="text-primary-foreground/20">•</span>
              <Link to="/privacy" className="hover:text-primary-foreground transition-colors">Privacy</Link>
              <span className="text-primary-foreground/20">•</span>
              <Link to="/refund" className="hover:text-primary-foreground transition-colors">Refunds</Link>
            </div>
            <div className="flex items-center gap-2 text-sm text-primary-foreground/60">
              <span className="text-base">🇧🇩</span>
              <span className="text-base">🇨🇦</span>
              <span>Proudly serving Canada-Bangladesh</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll to top button */}
      <button
        onClick={scrollToTop}
        className="absolute bottom-6 right-6 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/20 transition-all duration-300 border border-white/10 hover:-translate-y-1"
        aria-label="Scroll to top"
      >
        <ArrowUp className="h-5 w-5" />
      </button>
    </footer>
  );
}
