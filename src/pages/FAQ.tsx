import { useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Seo from "@/components/Seo";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Phone, MessageCircle } from "lucide-react";
import { faqs, contactInfo } from "@/data/mockData";
import { motion } from "framer-motion";

// Import 3D images
import question3D from "@/assets/question-3d.png";
import customerSupport3D from "@/assets/customer-support-3d.png";
import box3D from "@/assets/box-3d.png";
import airplane3D from "@/assets/airplane-3d.png";
import trackingPhone3D from "@/assets/tracking-phone-3d.png";
import wallet3D from "@/assets/wallet-3d.png";

const categories = [
  { value: "all", label: "All" },
  { value: "general", label: "General" },
  { value: "cargo", label: "Cargo & Courier" },
  { value: "flight", label: "Air Tickets" },
  { value: "tracking", label: "Tracking & Delivery" },
  { value: "payment", label: "Payment & Pricing" },
];

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout>
      <Seo
        title="FAQ"
        description="Frequently asked questions about shipments, air tickets, and our services."
      />
      {/* Hero */}
      <section className="bg-hero-pattern text-primary-foreground py-12 md:py-16 relative overflow-hidden">
        {/* Floating 3D images - BIGGER */}
        <motion.img
          src={question3D}
          alt="FAQ"
          className="absolute top-2 right-[2%] w-40 sm:w-56 md:w-72 lg:w-80 opacity-80 hidden md:block"
          animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img
          src={customerSupport3D}
          alt="Support"
          className="absolute bottom-4 left-[3%] w-36 sm:w-48 md:w-60 opacity-70 hidden md:block"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img
          src={box3D}
          alt="Box"
          className="absolute top-14 left-[12%] w-28 sm:w-40 md:w-48 opacity-60 hidden lg:block"
          animate={{ y: [0, 12, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        <motion.img
          src={airplane3D}
          alt="Airplane"
          className="absolute bottom-10 right-[18%] w-36 sm:w-48 md:w-60 opacity-60 hidden lg:block"
          animate={{ y: [0, -10, 0], x: [0, 8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img
          src={trackingPhone3D}
          alt="Tracking"
          className="absolute top-1/2 right-[32%] w-28 sm:w-40 md:w-48 opacity-50 hidden xl:block -translate-y-1/2"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        <div className="container-wacc relative">
          <div className="flex items-center gap-2 text-primary-foreground/70 text-sm mb-4">
            <Link to="/" className="hover:text-primary-foreground">Home</Link>
            <span>/</span>
            <span>FAQ</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Frequently Asked Questions</h1>
          <p className="text-xl text-primary-foreground/80">
            Find answers about cargo, courier, and air ticket services
          </p>
        </div>
      </section>

      <section className="section-padding relative overflow-hidden">
        {/* Background decorative images - BIGGER */}
        <motion.img
          src={wallet3D}
          alt="Wallet"
          className="absolute top-10 right-[2%] w-32 sm:w-44 md:w-56 opacity-25 hidden lg:block"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="container-wacc">
          <div className="max-w-3xl mx-auto">
            {/* Search */}
            <div className="relative mb-8">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>

            {/* Category Tabs */}
            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-8">
              <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent">
                {categories.map((cat) => (
                  <TabsTrigger
                    key={cat.value}
                    value={cat.value}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* FAQs */}
            {filteredFaqs.length > 0 ? (
              <Accordion type="single" collapsible className="space-y-4">
                {filteredFaqs.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <AccordionItem
                      value={`item-${index}`}
                      className="bg-card rounded-xl border border-border px-6 data-[state=open]:shadow-md"
                    >
                      <AccordionTrigger className="text-left hover:no-underline py-5">
                        <span className="font-semibold pr-4">{faq.question}</span>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-5">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No FAQs found matching your search.</p>
              </div>
            )}

            {/* Still Have Questions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-12 bg-secondary rounded-xl p-8 text-center relative overflow-hidden"
            >
              <motion.img
                src={customerSupport3D}
                alt="Support"
                className="absolute -right-8 -top-8 w-36 sm:w-48 md:w-56 opacity-40"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />

              <h2 className="text-xl font-semibold mb-4 relative">Can't Find Your Answer?</h2>
              <p className="text-muted-foreground mb-6 relative">Contact us directly and we'll help you</p>
              <div className="flex flex-wrap justify-center gap-4 relative">
                <a
                  href={`tel:${contactInfo.canada.phone}`}
                  className="inline-flex items-center gap-2 bg-card px-4 py-3 rounded-lg shadow-sm border border-border hover:bg-muted transition-colors"
                >
                  <span className="text-lg">🇨🇦</span>
                  <Phone className="h-4 w-4" />
                  <span>{contactInfo.canada.phone}</span>
                </a>
                <a
                  href={`tel:${contactInfo.bangladesh.phone}`}
                  className="inline-flex items-center gap-2 bg-card px-4 py-3 rounded-lg shadow-sm border border-border hover:bg-muted transition-colors"
                >
                  <span className="text-lg">🇧🇩</span>
                  <Phone className="h-4 w-4" />
                  <span>{contactInfo.bangladesh.phone}</span>
                </a>
                <a
                  href="https://wa.me/14378497607"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-route-bd-ca text-white px-4 py-3 rounded-lg hover:bg-route-bd-ca/90 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </Layout>
  );
}