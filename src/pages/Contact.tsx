import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, MapPin, Clock, CheckCircle, MessageCircle, Send, ArrowRight } from "lucide-react";
import { contactInfo } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

// Import 3D images
import customerSupport3D from "@/assets/customer-support-3d.png";
import envelope3D from "@/assets/envelope-3d.png";
import bangladeshFlag3D from "@/assets/bangladesh-flag-3d.png";
import canadaFlag3D from "@/assets/canada-flag-3d.png";
import mapRoute3D from "@/assets/map-route-3d.png";
import globe3D from "@/assets/globe-3d.png";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Please fill required fields",
        description: "Name, email, and message are required",
        variant: "destructive",
      });
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Layout>
        <Seo title="Message Sent" description="Thank you for contacting Wing Way Connect." />
        <section className="section-padding">
          <div className="container-wacc">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="max-w-xl mx-auto text-center"
            >
              <div className="w-20 h-20 rounded-3xl bg-success/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-4 font-display">Message Sent!</h1>
              <p className="text-muted-foreground mb-8 text-lg">
                Thank you for contacting us. We'll respond within 2 hours.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild size="lg" className="h-12 rounded-xl">
                  <Link to="/">Back to Home</Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 rounded-xl"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: "", email: "", phone: "", country: "", subject: "", message: "" });
                  }}
                >
                  Send Another Message
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <Seo
        title="Contact Us"
        description="Get in touch with our team for inquiries, support, or logistics assistance."
      />
      {/* Hero */}
      <section className="page-hero text-primary-foreground py-14 sm:py-18 lg:py-22 relative overflow-hidden">
        {/* Floating 3D images - BIGGER */}
        <motion.img
          src={customerSupport3D}
          alt="Support"
          className="absolute top-2 right-[2%] w-40 sm:w-56 md:w-72 lg:w-80 opacity-80 hidden md:block"
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img
          src={envelope3D}
          alt="Envelope"
          className="absolute bottom-4 left-[3%] w-32 sm:w-48 md:w-60 opacity-70 hidden md:block"
          animate={{ y: [0, 10, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img
          src={globe3D}
          alt="Globe"
          className="absolute top-1/2 left-[18%] w-32 sm:w-48 md:w-56 opacity-50 hidden lg:block -translate-y-1/2"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.img
          src={mapRoute3D}
          alt="Map Route"
          className="absolute bottom-10 right-[12%] w-40 sm:w-56 md:w-64 opacity-60 hidden lg:block"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        <div className="container-wacc relative">
          <motion.div {...fadeInUp} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-2 text-primary-foreground/60 text-sm mb-4">
              <Link to="/" className="hover:text-primary-foreground transition-colors">Home</Link>
              <span>/</span>
              <span className="text-primary-foreground">Contact Us</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-display font-display font-bold mb-4">
              Contact <span className="text-gradient-gold">WACC</span>
            </h1>
            <p className="text-xl text-primary-foreground/80">
              We're here to help in both Canada and Bangladesh
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-wacc">
          {/* Contact Cards */}
          <div className="grid md:grid-cols-2 gap-5 sm:gap-6 mb-12 sm:mb-16">
            {/* Canada Office */}
            <motion.div {...fadeInUp} transition={{ duration: 0.5 }}>
              <div className="h-full bg-card rounded-2xl border border-border/50 p-6 sm:p-8 shadow-premium hover:shadow-premium-lg transition-all duration-500 relative overflow-hidden">
                <motion.img
                  src={canadaFlag3D}
                  alt="Canada Flag"
                  className="absolute -right-8 -top-8 w-36 sm:w-48 md:w-56 opacity-40"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                />

                <div className="flex items-center gap-4 mb-6">
                  <span className="text-4xl sm:text-5xl">🇨🇦</span>
                  <h2 className="text-2xl sm:text-3xl font-bold font-display">Canada Office</h2>
                </div>
                <div className="space-y-4">
                  <a href={`tel:${contactInfo.canada.phone}`} className="flex items-center gap-4 text-lg hover:text-primary transition-colors group">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium">{contactInfo.canada.phone}</span>
                  </a>
                  <a href={`mailto:${contactInfo.canada.email}`} className="flex items-center gap-4 hover:text-primary transition-colors group">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <span>{contactInfo.canada.email}</span>
                  </a>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <span>{contactInfo.canada.address}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <span>{contactInfo.canada.hours}</span>
                  </div>
                </div>
                <a
                  href="https://wa.me/14378497607"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 bg-route-bd-ca text-white px-5 py-3 rounded-xl hover:bg-route-bd-ca/90 transition-colors font-medium"
                >
                  <MessageCircle className="h-5 w-5" />
                  WhatsApp Chat
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </motion.div>

            {/* Bangladesh Office */}
            <motion.div {...fadeInUp} transition={{ duration: 0.5, delay: 0.1 }}>
              <div className="h-full bg-card rounded-2xl border border-border/50 p-6 sm:p-8 shadow-premium hover:shadow-premium-lg transition-all duration-500 relative overflow-hidden">
                <motion.img
                  src={bangladeshFlag3D}
                  alt="Bangladesh Flag"
                  className="absolute -right-8 -top-8 w-36 sm:w-48 md:w-56 opacity-40"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                />

                <div className="flex items-center gap-4 mb-6">
                  <span className="text-4xl sm:text-5xl">🇧🇩</span>
                  <h2 className="text-2xl sm:text-3xl font-bold font-display">Bangladesh Office</h2>
                </div>
                <div className="space-y-4">
                  <a href={`tel:${contactInfo.bangladesh.phone}`} className="flex items-center gap-4 text-lg hover:text-primary transition-colors group">
                    <div className="w-12 h-12 rounded-xl bg-route-ca-bd/10 flex items-center justify-center group-hover:bg-route-ca-bd/20 transition-colors">
                      <Phone className="h-5 w-5 text-route-ca-bd" />
                    </div>
                    <span className="font-medium">{contactInfo.bangladesh.phone}</span>
                  </a>
                  <a href={`mailto:${contactInfo.bangladesh.email}`} className="flex items-center gap-4 hover:text-primary transition-colors group">
                    <div className="w-12 h-12 rounded-xl bg-route-ca-bd/10 flex items-center justify-center group-hover:bg-route-ca-bd/20 transition-colors">
                      <Mail className="h-5 w-5 text-route-ca-bd" />
                    </div>
                    <span>{contactInfo.bangladesh.email}</span>
                  </a>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-route-ca-bd/10 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-route-ca-bd" />
                    </div>
                    <span>{contactInfo.bangladesh.address}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-route-ca-bd/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-route-ca-bd" />
                    </div>
                    <span>{contactInfo.bangladesh.hours}</span>
                  </div>
                </div>
                <a
                  href="https://wa.me/8801715044409"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 bg-route-ca-bd text-white px-5 py-3 rounded-xl hover:bg-route-ca-bd/90 transition-colors font-medium"
                >
                  <MessageCircle className="h-5 w-5" />
                  WhatsApp Chat
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </motion.div>
          </div>

          {/* Contact Form */}
          <motion.div {...fadeInUp} transition={{ duration: 0.5, delay: 0.2 }} className="max-w-2xl mx-auto">
            <div className="bg-card rounded-2xl sm:rounded-3xl border border-border/50 p-6 sm:p-10 shadow-premium relative overflow-hidden">
              <motion.img
                src={envelope3D}
                alt="Envelope"
                className="absolute -right-10 -bottom-10 w-40 sm:w-52 md:w-64 opacity-25"
                animate={{ rotate: [0, 5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />

              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Send className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold font-display">Send Us a Message</h2>
              </div>
              <p className="text-muted-foreground mb-8">We'll respond within 2 hours</p>

              <form onSubmit={handleSubmit} className="space-y-5 relative">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Full Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your name"
                      className="mt-1.5 h-12 rounded-xl bg-muted/30"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your@email.com"
                      className="mt-1.5 h-12 rounded-xl bg-muted/30"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 XXX-XXX-XXXX"
                      className="mt-1.5 h-12 rounded-xl bg-muted/30"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Country</Label>
                    <Select value={formData.country} onValueChange={(v) => setFormData({ ...formData, country: v })}>
                      <SelectTrigger className="mt-1.5 h-12 rounded-xl bg-muted/30">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="canada">Canada</SelectItem>
                        <SelectItem value="bangladesh">Bangladesh</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Subject</Label>
                  <Select value={formData.subject} onValueChange={(v) => setFormData({ ...formData, subject: v })}>
                    <SelectTrigger className="mt-1.5 h-12 rounded-xl bg-muted/30">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="cargo">Cargo/Courier Question</SelectItem>
                      <SelectItem value="flight">Air Ticket Inquiry</SelectItem>
                      <SelectItem value="tracking">Tracking Issue</SelectItem>
                      <SelectItem value="feedback">Complaint/Feedback</SelectItem>
                      <SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Message *</Label>
                  <Textarea
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="How can we help you?"
                    className="mt-1.5 rounded-xl bg-muted/30 resize-none"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-14 rounded-xl text-lg bg-cta hover:bg-cta/90 text-cta-foreground shadow-lg shadow-cta/20"
                >
                  Send Message
                  <Send className="h-5 w-5 ml-2" />
                </Button>
              </form>
            </div>

            {/* FAQ Link */}
            <div className="text-center mt-8">
              <p className="text-muted-foreground mb-3">Looking for quick answers?</p>
              <Button asChild variant="outline" size="lg" className="h-12 rounded-xl">
                <Link to="/faq">View FAQs</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}