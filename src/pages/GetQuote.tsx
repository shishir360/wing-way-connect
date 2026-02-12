import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SmartPhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Package, Plane, ArrowRight, CalendarIcon, CheckCircle } from "lucide-react";
import { cities, cargoTypes, calculateShippingCost } from "@/data/mockData";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

// Import 3D images
import calculator3D from "@/assets/calculator-3d.png";
import box3D from "@/assets/box-3d.png";
import airplane3D from "@/assets/airplane-3d.png";
import wallet3D from "@/assets/wallet-3d.png";
import document3D from "@/assets/document-3d.png";

export default function GetQuote() {
  const [activeTab, setActiveTab] = useState("cargo");
  const [submitted, setSubmitted] = useState(false);
  const [quoteRef, setQuoteRef] = useState("");
  const { toast } = useToast();

  // Cargo form state
  const [route, setRoute] = useState<"bd-to-ca" | "ca-to-bd">("ca-to-bd");
  const [weight, setWeight] = useState("");
  const [cargoFormData, setCargoFormData] = useState({
    name: "",
    phone: "",
    email: "",
    cargoType: "",
    contents: "",
    fromCity: "",
    toCity: "",
  });

  // Flight form state
  const [flightFormData, setFlightFormData] = useState({
    name: "",
    phone: "",
    email: "",
    tripType: "round-trip",
    from: "",
    to: "",
    adults: "1",
    children: "0",
    flightClass: "economy",
  });
  const [departureDate, setDepartureDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();

  // Dynamic settings state
  const [pricing, setPricing] = useState<any>({
    "bd-to-ca": { base: 15, perKg: 12 },
    "ca-to-bd": { base: 12, perKg: 10 },
  });

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    const { data } = await supabase.from('site_settings' as any).select('*');
    if (data) {
      const newPricing: any = { ...pricing };
      data.forEach((item: any) => {
        if (item.key === 'pricing_bd') newPricing['bd-to-ca'] = item.value;
        if (item.key === 'pricing_ca') newPricing['ca-to-bd'] = item.value;
      });
      setPricing(newPricing);
    }
  };

  const originCities = route === "bd-to-ca" ? cities.bangladesh : cities.canada;
  const destCities = route === "bd-to-ca" ? cities.canada : cities.bangladesh;

  const weightNum = parseFloat(weight) || 0;

  // Calculate using dynamic pricing
  const calculateDynamicCost = () => {
    const rates = pricing[route];
    const baseCost = rates.base;
    const weightCost = weightNum * rates.perKg;
    // Standard service multiplier is 1 (base + weight)
    // We can expand this later if service multipliers become dynamic too
    return {
      base: baseCost,
      weight: weightCost,
      total: baseCost + weightCost
    };
  };

  const priceEstimate = calculateDynamicCost();

  const handleCargoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cargoFormData.name || !cargoFormData.phone || !cargoFormData.email || weightNum < 0.5) {
      toast({
        title: "Please fill required fields",
        description: "Name, phone, email, and weight are required",
        variant: "destructive",
      });
      return;
    }
    const ref = `WC-QT-${Math.floor(10000 + Math.random() * 90000)}`;
    setQuoteRef(ref);
    setSubmitted(true);
  };

  const handleFlightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flightFormData.name || !flightFormData.phone || !flightFormData.email || !departureDate) {
      toast({
        title: "Please fill required fields",
        description: "Name, phone, email, and departure date are required",
        variant: "destructive",
      });
      return;
    }
    const ref = `WC-QT-${Math.floor(10000 + Math.random() * 90000)}`;
    setQuoteRef(ref);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Layout>
        <Seo title="Quote Request Sent" description="Your quote request has been received by Wing Way Connect." />
        <section className="section-padding">
          <div className="container-wacc">
            <div className="max-w-xl mx-auto text-center">
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
              <h1 className="text-3xl font-bold mb-4">Quote Request Received!</h1>
              <p className="text-lg text-muted-foreground mb-2">Reference: <span className="font-semibold text-primary">{quoteRef}</span></p>
              <p className="text-muted-foreground mb-8">
                Thank you! We'll send you a detailed quote within 30 minutes via email and SMS.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild>
                  <Link to="/">Back to Home</Link>
                </Button>
                <Button variant="outline" onClick={() => { setSubmitted(false); }}>
                  Request Another Quote
                </Button>
              </div>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <Seo
        title="Get a Quote"
        description="Request a fast and accurate shipping quote by providing your shipment details."
      />
      {/* Hero */}
      <section className="bg-hero-pattern text-primary-foreground py-12 md:py-16 relative overflow-hidden">
        {/* Floating 3D images - BIGGER */}
        <motion.img
          src={calculator3D}
          alt="Calculator"
          className="absolute top-2 right-[2%] w-40 sm:w-56 md:w-72 lg:w-80 opacity-80 hidden md:block"
          animate={{ y: [0, -12, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img
          src={box3D}
          alt="Box"
          className="absolute bottom-4 left-[3%] w-32 sm:w-48 md:w-60 opacity-70 hidden md:block"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img
          src={wallet3D}
          alt="Wallet"
          className="absolute top-1/2 left-[12%] w-32 sm:w-48 md:w-56 opacity-60 hidden lg:block -translate-y-1/2"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        <motion.img
          src={airplane3D}
          alt="Airplane"
          className="absolute bottom-10 right-[18%] w-36 sm:w-48 md:w-60 opacity-60 hidden lg:block"
          animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img
          src={document3D}
          alt="Document"
          className="absolute top-14 right-[28%] w-28 sm:w-40 md:w-48 opacity-50 hidden xl:block"
          animate={{ y: [0, 8, 0], rotate: [0, -3, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        <div className="container-wacc relative">
          <div className="flex items-center gap-2 text-primary-foreground/70 text-sm mb-4">
            <Link to="/" className="hover:text-primary-foreground">Home</Link>
            <span>/</span>
            <span>Get a Quote</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Get a Free Quote</h1>
          <p className="text-xl text-primary-foreground/80">
            Cargo, Courier & Air Tickets - Canada ↔ Bangladesh
          </p>
        </div>
      </section>

      <section className="section-padding relative overflow-hidden">
        {/* Background decorative images - BIGGER */}
        <motion.img
          src={calculator3D}
          alt="Calculator"
          className="absolute top-10 right-[2%] w-36 sm:w-48 md:w-60 opacity-20 hidden lg:block"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="container-wacc">
          <div className="max-w-3xl mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="cargo" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Cargo/Courier Quote
                </TabsTrigger>
                <TabsTrigger value="flight" className="flex items-center gap-2">
                  <Plane className="h-4 w-4" />
                  Air Ticket Quote
                </TabsTrigger>
              </TabsList>

              <TabsContent value="cargo">
                <form onSubmit={handleCargoSubmit} className="space-y-6">
                  {/* Route Selection */}
                  <div className="bg-card rounded-xl border border-border p-6">
                    <h3 className="font-semibold mb-4">Select Route</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setRoute("bd-to-ca")}
                        className={cn(
                          "p-4 rounded-lg border-2 text-left transition-all",
                          route === "bd-to-ca" ? "border-route-bd-ca bg-route-bd-ca/5" : "border-border"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🇧🇩</span>
                          <ArrowRight className="h-4 w-4" />
                          <span className="text-xl">🇨🇦</span>
                          <span className="ml-2 font-medium">Bangladesh to Canada</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRoute("ca-to-bd")}
                        className={cn(
                          "p-4 rounded-lg border-2 text-left transition-all",
                          route === "ca-to-bd" ? "border-route-ca-bd bg-route-ca-bd/5" : "border-border"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🇨🇦</span>
                          <ArrowRight className="h-4 w-4" />
                          <span className="text-xl">🇧🇩</span>
                          <span className="ml-2 font-medium">Canada to Bangladesh</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="bg-card rounded-xl border border-border p-6">
                    <h3 className="font-semibold mb-4">Your Information</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Full Name *</Label>
                        <Input
                          value={cargoFormData.name}
                          onChange={(e) => setCargoFormData({ ...cargoFormData, name: e.target.value })}
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <Label>Phone *</Label>
                        <SmartPhoneInput
                          placeholder="Enter phone number"
                          defaultCountry="CA"
                          value={cargoFormData.phone}
                          onChange={(value) => setCargoFormData({ ...cargoFormData, phone: value || "" })}
                          className="h-10"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          value={cargoFormData.email}
                          onChange={(e) => setCargoFormData({ ...cargoFormData, email: e.target.value })}
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cargo Details */}
                  <div className="bg-card rounded-xl border border-border p-6">
                    <h3 className="font-semibold mb-4">Cargo Details</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Cargo Type</Label>
                        <Select value={cargoFormData.cargoType} onValueChange={(v) => setCargoFormData({ ...cargoFormData, cargoType: v })}>
                          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                            {cargoTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Approximate Weight (kg) *</Label>
                        <Input
                          type="number"
                          min="0.5"
                          step="0.1"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          placeholder="Enter weight"
                        />
                      </div>
                      <div>
                        <Label>From</Label>
                        <Select value={cargoFormData.fromCity} onValueChange={(v) => setCargoFormData({ ...cargoFormData, fromCity: v })}>
                          <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                          <SelectContent>
                            {originCities.map((city) => (
                              <SelectItem key={city.value} value={city.value}>{city.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>To</Label>
                        <Select value={cargoFormData.toCity} onValueChange={(v) => setCargoFormData({ ...cargoFormData, toCity: v })}>
                          <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                          <SelectContent>
                            {destCities.map((city) => (
                              <SelectItem key={city.value} value={city.value}>{city.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="sm:col-span-2">
                        <Label>Contents Description</Label>
                        <Textarea
                          value={cargoFormData.contents}
                          onChange={(e) => setCargoFormData({ ...cargoFormData, contents: e.target.value })}
                          placeholder="Briefly describe what you're sending..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Price Estimate */}
                  {weightNum > 0 && (
                    <div className="bg-primary/5 rounded-xl border border-primary/20 p-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">Estimated Price</p>
                          <p className="text-sm text-muted-foreground">Standard shipping ({weight} kg)</p>
                        </div>
                        <p className="text-3xl font-bold text-primary">${priceEstimate.total.toFixed(2)}</p>
                      </div>
                    </div>
                  )}

                  <Button type="submit" size="lg" className="w-full bg-cta hover:bg-cta/90 text-cta-foreground">
                    Get Quote
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="flight">
                <form onSubmit={handleFlightSubmit} className="space-y-6">
                  {/* Contact Info */}
                  <div className="bg-card rounded-xl border border-border p-6">
                    <h3 className="font-semibold mb-4">Your Information</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Full Name *</Label>
                        <Input
                          value={flightFormData.name}
                          onChange={(e) => setFlightFormData({ ...flightFormData, name: e.target.value })}
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <Label>Phone *</Label>
                        <SmartPhoneInput
                          placeholder="Enter phone number"
                          defaultCountry="CA"
                          value={flightFormData.phone}
                          onChange={(value) => setFlightFormData({ ...flightFormData, phone: value || "" })}
                          className="h-10"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          value={flightFormData.email}
                          onChange={(e) => setFlightFormData({ ...flightFormData, email: e.target.value })}
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Flight Details */}
                  <div className="bg-card rounded-xl border border-border p-6">
                    <h3 className="font-semibold mb-4">Flight Details</h3>

                    <RadioGroup value={flightFormData.tripType} onValueChange={(v) => setFlightFormData({ ...flightFormData, tripType: v })} className="flex gap-6 mb-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="one-way" id="q-one-way" />
                        <Label htmlFor="q-one-way">One-Way</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="round-trip" id="q-round-trip" />
                        <Label htmlFor="q-round-trip">Round Trip</Label>
                      </div>
                    </RadioGroup>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label>From</Label>
                        <Select value={flightFormData.from} onValueChange={(v) => setFlightFormData({ ...flightFormData, from: v })}>
                          <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                          <SelectContent>
                            {[...cities.canada, ...cities.bangladesh].filter(c => c.code).map((city) => (
                              <SelectItem key={city.value} value={city.value}>{city.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>To</Label>
                        <Select value={flightFormData.to} onValueChange={(v) => setFlightFormData({ ...flightFormData, to: v })}>
                          <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                          <SelectContent>
                            {[...cities.canada, ...cities.bangladesh].filter(c => c.code).map((city) => (
                              <SelectItem key={city.value} value={city.value}>{city.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Departure Date *</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !departureDate && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {departureDate ? format(departureDate, "PPP") : "Select date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={departureDate} onSelect={setDepartureDate} initialFocus className="pointer-events-auto" />
                          </PopoverContent>
                        </Popover>
                      </div>
                      {flightFormData.tripType === "round-trip" && (
                        <div>
                          <Label>Return Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !returnDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {returnDate ? format(returnDate, "PPP") : "Select date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={returnDate} onSelect={setReturnDate} initialFocus className="pointer-events-auto" />
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}
                      <div>
                        <Label>Adults (12+)</Label>
                        <Input type="number" min="1" value={flightFormData.adults} onChange={(e) => setFlightFormData({ ...flightFormData, adults: e.target.value })} />
                      </div>
                      <div>
                        <Label>Children (2-12)</Label>
                        <Input type="number" min="0" value={flightFormData.children} onChange={(e) => setFlightFormData({ ...flightFormData, children: e.target.value })} />
                      </div>
                      <div className="sm:col-span-2">
                        <Label>Class</Label>
                        <Select value={flightFormData.flightClass} onValueChange={(v) => setFlightFormData({ ...flightFormData, flightClass: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="economy">Economy</SelectItem>
                            <SelectItem value="premium">Premium Economy</SelectItem>
                            <SelectItem value="business">Business</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Button type="submit" size="lg" className="w-full bg-cta hover:bg-cta/90 text-cta-foreground">
                    Get Flight Quote
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>
    </Layout>
  );
}
