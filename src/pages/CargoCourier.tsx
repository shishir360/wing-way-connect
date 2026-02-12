import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SmartPhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plane, ArrowRight, Package, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cities, cargoTypes, serviceTypes, calculateShippingCost } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { generateShortId } from "@/utils/generateShortId";

// Import 3D images
import box3D from "@/assets/box-3d.png";
import flyingBox3D from "@/assets/flying-box-3d.png";
import warehouse3D from "@/assets/warehouse-3d.png";
import truck3D from "@/assets/truck-3d.png";
import weightScale3D from "@/assets/weight-scale-3d.png";
import giftBox3D from "@/assets/gift-box-3d.png";

// Storage key for pending booking
const PENDING_BOOKING_KEY = 'pending_cargo_booking';

export default function CargoCourier() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const initialRoute = searchParams.get("route") as "bd-to-ca" | "ca-to-bd" | null;

  const [route, setRoute] = useState<"bd-to-ca" | "ca-to-bd">(initialRoute || "ca-to-bd");
  const [formData, setFormData] = useState({
    fromCity: "",
    toCity: "",
    cargoType: "",
    weight: "",
    packages: "1",
    contents: "",
    senderName: "",
    senderPhone: "",
    senderEmail: "",
    pickupAddress: "",
    receiverName: "",
    receiverPhone: "",
    deliveryAddress: "",
    serviceType: "standard",
    insurance: false,
    fragile: false,
  });
  const [submitted, setSubmitted] = useState(false);
  const [bookingId, setBookingId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const originCities = route === "bd-to-ca" ? cities.bangladesh : cities.canada;
  const destCities = route === "bd-to-ca" ? cities.canada : cities.bangladesh;

  const weight = parseFloat(formData.weight) || 0;
  const priceBreakdown = calculateShippingCost(
    weight,
    route,
    formData.serviceType as "standard" | "express" | "priority",
    formData.insurance,
    formData.fragile
  );

  // Check for pending booking after login
  useEffect(() => {
    const processPendingBooking = async () => {
      const pendingBooking = localStorage.getItem(PENDING_BOOKING_KEY);
      if (pendingBooking && user) {
        const bookingData = JSON.parse(pendingBooking);
        localStorage.removeItem(PENDING_BOOKING_KEY);

        // Set form data and submit
        setRoute(bookingData.route);
        setFormData(bookingData.formData);

        // Auto-submit after restoring data
        await submitBooking(bookingData.route, bookingData.formData, bookingData.priceBreakdown);
      }
    };

    processPendingBooking();
  }, [user]);

  const submitBooking = async (
    bookingRoute: string,
    data: typeof formData,
    pricing: typeof priceBreakdown
  ) => {
    if (!user) return;

    setIsSubmitting(true);

    try {
      // Generate tracking ID
      const { data: trackingData, error: trackingError } = await supabase
        .rpc('generate_tracking_id');

      if (trackingError) throw trackingError;

      const trackingId = trackingData || `WC-SH-${Math.floor(10000 + Math.random() * 90000)}`;

      // Generate Short ID (PIN)
      const shortId = generateShortId();

      // Insert shipment to database
      const { error: insertError } = await supabase
        .from('shipments')
        .insert({
          user_id: user.id,
          tracking_id: trackingId,
          short_id: shortId,
          route: bookingRoute,
          status: 'pending',
          cargo_type: data.cargoType || null,
          weight: parseFloat(data.weight) || null,
          packages: parseInt(data.packages) || 1,
          contents: data.contents,
          sender_name: data.senderName,
          sender_phone: data.senderPhone,
          sender_email: data.senderEmail,
          pickup_address: data.pickupAddress,
          from_city: data.fromCity || null,
          receiver_name: data.receiverName,
          receiver_phone: data.receiverPhone,
          delivery_address: data.deliveryAddress,
          to_city: data.toCity || null,
          service_type: data.serviceType,
          base_cost: pricing.base + pricing.weight,
          insurance_cost: pricing.insurance,
          fragile_fee: pricing.fragile,
          total_cost: pricing.total,
          has_insurance: data.insurance,
          is_fragile: data.fragile,
        });

      if (insertError) throw insertError;

      setBookingId(trackingId);
      setSubmitted(true);

      toast({
        title: "Booking Successful! 🎉",
        description: `Your Tracking ID: ${trackingId}`,
      });
    } catch (error: any) {
      console.error('Booking error:', error);
      toast({
        title: "Booking Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting Form Data:", formData);

    // Detailed validation
    const missingFields: string[] = [];
    if (!formData.senderName) missingFields.push("Sender Name");
    if (!formData.senderPhone) missingFields.push("Sender Phone");
    if (!formData.senderEmail) missingFields.push("Sender Email");
    if (!formData.pickupAddress) missingFields.push("Pickup Address");
    if (!formData.receiverName) missingFields.push("Receiver Name");
    if (!formData.receiverPhone) missingFields.push("Receiver Phone");
    if (!formData.deliveryAddress) missingFields.push("Delivery Address");
    if (!formData.contents) missingFields.push("Contents");

    if (missingFields.length > 0) {
      toast({
        title: "Required Fields Missing",
        description: `Please fill: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    if (weight < 0.5) {
      toast({
        title: "Invalid Weight",
        description: "Minimum weight is 0.5 kg",
        variant: "destructive",
      });
      return;
    }

    // If user is not logged in, save booking data and redirect to auth
    if (!user) {
      const pendingBooking = {
        route,
        formData,
        priceBreakdown,
      };
      localStorage.setItem(PENDING_BOOKING_KEY, JSON.stringify(pendingBooking));

      toast({
        title: "Login Required",
        description: "Please login to complete your booking. Your booking will be auto-confirmed after login.",
      });

      navigate("/auth");
      return;
    }

    // User is logged in, proceed with booking
    await submitBooking(route, formData, priceBreakdown);
  };

  if (submitted) {
    return (
      <Layout>
        <Seo title="Booking Confirmed" description="Your cargo booking has been confirmed with Wing Way Connect." />
        <section className="section-padding">
          <div className="container-wacc">
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
              <h1 className="text-3xl font-bold mb-4">Booking Confirmed!</h1>
              <div className="bg-card rounded-xl border border-border p-6 mb-6 text-left">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Booking ID</p>
                    <p className="font-bold text-lg text-primary">{bookingId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tracking ID</p>
                    <p className="font-bold text-lg text-primary">{bookingId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Route</p>
                    <p className="font-medium">{route === "bd-to-ca" ? "Bangladesh → Canada" : "Canada → Bangladesh"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Cost</p>
                    <p className="font-bold text-lg">${priceBreakdown.total.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <p className="text-muted-foreground mb-6">
                Thank you! Your cargo booking is confirmed. We'll contact you within 30 minutes to arrange pickup.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild>
                  <Link to={`/track-shipment?id=${bookingId}`}>Track Shipment</Link>
                </Button>
                <Button variant="outline" onClick={() => { setSubmitted(false); setFormData({ ...formData, contents: "", weight: "" }); }}>
                  Book Another Shipment
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
        title="Cargo & Courier Services"
        description="Fast and secure cargo and courier delivery services with door-to-door international shipping."
      />
      {/* Hero */}
      <section className="bg-hero-pattern text-primary-foreground py-12 md:py-16 relative overflow-hidden">
        {/* Floating 3D images - BIGGER */}
        <motion.img
          src={box3D}
          alt="Box"
          className="absolute top-2 right-[2%] w-40 sm:w-56 md:w-72 lg:w-80 opacity-80 hidden md:block"
          animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img
          src={flyingBox3D}
          alt="Flying Box"
          className="absolute bottom-4 left-[3%] w-32 sm:w-48 md:w-60 opacity-70 hidden md:block"
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img
          src={warehouse3D}
          alt="Warehouse"
          className="absolute top-1/2 left-[12%] w-40 sm:w-56 md:w-64 opacity-50 hidden lg:block -translate-y-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        <motion.img
          src={truck3D}
          alt="Truck"
          className="absolute bottom-8 right-[18%] w-36 sm:w-48 md:w-60 opacity-60 hidden lg:block"
          animate={{ x: [0, 15, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img
          src={giftBox3D}
          alt="Gift"
          className="absolute top-12 right-[28%] w-32 sm:w-44 md:w-56 opacity-50 hidden xl:block"
          animate={{ y: [0, -12, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />

        <div className="container-wacc relative">
          <div className="flex items-center gap-2 text-primary-foreground/70 text-sm mb-4">
            <Link to="/" className="hover:text-primary-foreground">Home</Link>
            <span>/</span>
            <span>Cargo & Courier</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Cargo & Courier Services</h1>
          <p className="text-xl text-primary-foreground/80 flex items-center gap-2">
            <span>Both Way Shipping:</span>
            <span className="text-lg">🇧🇩</span>
            <span>↔</span>
            <span className="text-lg">🇨🇦</span>
          </p>
        </div>
      </section>

      <section className="section-padding relative overflow-hidden">
        {/* Background decorative images */}
        <motion.img
          src={weightScale3D}
          alt="Weight Scale"
          className="absolute top-20 right-[3%] w-16 sm:w-24 opacity-15 hidden lg:block"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="container-wacc">
          {/* Route Selection */}
          <div className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-center">Select Your Route</h2>
            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <button
                onClick={() => setRoute("bd-to-ca")}
                className={`p-6 rounded-xl border-2 transition-all ${route === "bd-to-ca"
                  ? "border-route-bd-ca bg-route-bd-ca/5"
                  : "border-border hover:border-route-bd-ca/50"
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-lg">Bangladesh to Canada</span>
                  <Plane className="h-5 w-5 text-route-bd-ca" />
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-xl">🇧🇩</span>
                  <ArrowRight className="h-4 w-4" />
                  <span className="text-xl">🇨🇦</span>
                </div>
              </button>

              <button
                onClick={() => setRoute("ca-to-bd")}
                className={`p-6 rounded-xl border-2 transition-all ${route === "ca-to-bd"
                  ? "border-route-ca-bd bg-route-ca-bd/5"
                  : "border-border hover:border-route-ca-bd/50"
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-lg">Canada to Bangladesh</span>
                  <Plane className="h-5 w-5 text-route-ca-bd -scale-x-100" />
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-xl">🇨🇦</span>
                  <ArrowRight className="h-4 w-4" />
                  <span className="text-xl">🇧🇩</span>
                </div>
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Form */}
            <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-8">
              {/* Route Details */}
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Shipment Details
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>From (Origin)</Label>
                    <Select value={formData.fromCity} onValueChange={(v) => setFormData({ ...formData, fromCity: v })}>
                      <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                      <SelectContent>
                        {originCities.map((city) => (
                          <SelectItem key={city.value} value={city.value}>{city.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>To (Destination)</Label>
                    <Select value={formData.toCity} onValueChange={(v) => setFormData({ ...formData, toCity: v })}>
                      <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                      <SelectContent>
                        {destCities.map((city) => (
                          <SelectItem key={city.value} value={city.value}>{city.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Cargo Type</Label>
                    <Select value={formData.cargoType} onValueChange={(v) => setFormData({ ...formData, cargoType: v })}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        {cargoTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Weight (kg) *</Label>
                    <Input
                      type="number"
                      min="0.5"
                      step="0.1"
                      placeholder="Enter weight"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Number of Packages</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.packages}
                      onChange={(e) => setFormData({ ...formData, packages: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Contents Description *</Label>
                    <Textarea
                      placeholder="Briefly describe what you're sending..."
                      value={formData.contents}
                      onChange={(e) => setFormData({ ...formData, contents: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Sender Info */}
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-semibold mb-4">Sender Information</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name *</Label>
                    <Input
                      placeholder="Your full name"
                      value={formData.senderName}
                      onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Phone *</Label>
                    <SmartPhoneInput
                      placeholder={route === "bd-to-ca" ? "Enter phone number" : "Enter phone number"}
                      defaultCountry={route === "bd-to-ca" ? "BD" : "CA"}
                      value={formData.senderPhone}
                      onChange={(value) => {
                        console.log("Sender Phone:", value);
                        setFormData({ ...formData, senderPhone: value || "" });
                      }}
                      className="h-10"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      placeholder="your@email.com"
                      value={formData.senderEmail}
                      onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Pickup Address *</Label>
                    <Textarea
                      placeholder="Complete pickup address"
                      value={formData.pickupAddress}
                      onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Receiver Info */}
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-semibold mb-4">Receiver Information</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Full Name *</Label>
                    <Input
                      placeholder="Receiver's full name"
                      value={formData.receiverName}
                      onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Phone *</Label>
                    <SmartPhoneInput
                      placeholder={route === "bd-to-ca" ? "Enter phone number" : "Enter phone number"}
                      defaultCountry={route === "bd-to-ca" ? "CA" : "BD"}
                      value={formData.receiverPhone}
                      onChange={(value) => {
                        console.log("Receiver Phone:", value);
                        setFormData({ ...formData, receiverPhone: value || "" });
                      }}
                      className="h-10"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Delivery Address *</Label>
                    <Textarea
                      placeholder="Complete delivery address"
                      value={formData.deliveryAddress}
                      onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Service Options */}
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-semibold mb-4">Shipping Options</h3>
                <RadioGroup
                  value={formData.serviceType}
                  onValueChange={(v) => setFormData({ ...formData, serviceType: v })}
                  className="space-y-3"
                >
                  {serviceTypes.map((type) => (
                    <div key={type.value} className="flex items-center space-x-3 border border-border rounded-lg p-4">
                      <RadioGroupItem value={type.value} id={type.value} />
                      <Label htmlFor={type.value} className="flex-1 cursor-pointer">
                        <span className="font-medium">{type.label}</span>
                        <span className="text-sm text-muted-foreground ml-2">({type.days})</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                <div className="mt-4 space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="insurance"
                      checked={formData.insurance}
                      onCheckedChange={(checked) => setFormData({ ...formData, insurance: checked as boolean })}
                    />
                    <Label htmlFor="insurance" className="cursor-pointer">Add Insurance (recommended for valuable items)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="fragile"
                      checked={formData.fragile}
                      onCheckedChange={(checked) => setFormData({ ...formData, fragile: checked as boolean })}
                    />
                    <Label htmlFor="fragile" className="cursor-pointer">Fragile Item Handling (+$8)</Label>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-cta hover:bg-cta/90 text-cta-foreground"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Booking...
                  </>
                ) : user ? (
                  "Confirm Booking"
                ) : (
                  "Login to Book"
                )}
              </Button>
            </form>

            {/* Price Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-card rounded-xl border border-border p-6">
                <h3 className="font-semibold mb-4">Price Estimate</h3>

                {weight > 0 ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base Shipping</span>
                      <span>${priceBreakdown.base.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Weight ({weight} kg)</span>
                      <span>${priceBreakdown.weight.toFixed(2)}</span>
                    </div>
                    {priceBreakdown.service > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Express Fee</span>
                        <span>${priceBreakdown.service.toFixed(2)}</span>
                      </div>
                    )}
                    {priceBreakdown.insurance > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Insurance</span>
                        <span>${priceBreakdown.insurance.toFixed(2)}</span>
                      </div>
                    )}
                    {priceBreakdown.fragile > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fragile Handling</span>
                        <span>${priceBreakdown.fragile.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-border pt-3 mt-3">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total Estimate</span>
                        <span className="text-primary">${priceBreakdown.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Enter weight to see price estimate</p>
                )}

                <p className="text-xs text-muted-foreground mt-4">
                  Final price confirmed after pickup inspection
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What You Can Ship */}
      <section className="section-padding bg-secondary">
        <div className="container-wacc">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-success" />
                What You Can Ship
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {["📄 Documents & Papers", "🎁 Gifts & Personal Items", "👕 Clothing & Textiles",
                  "📱 Electronics", "🍬 Non-perishable Food", "📚 Books & Media", "💼 Business Samples", "🛠️ Tools & Equipment"].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm bg-card p-3 rounded-lg">
                      {item}
                    </div>
                  ))}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Prohibited Items
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {["❌ Illegal substances", "❌ Weapons & explosives", "❌ Perishable foods",
                  "❌ Live animals", "❌ Hazardous materials", "❌ Liquids (unpackaged)", "❌ Counterfeit items"].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm bg-card p-3 rounded-lg text-muted-foreground">
                      {item}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
