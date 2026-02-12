import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SmartPhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plane, ArrowRight, CalendarIcon, Users, Briefcase, Clock, CheckCircle, Loader2, Info, Star, ShieldCheck, Zap } from "lucide-react";
import { cities, mockFlights } from "@/data/mockData";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Import 3D images
import airplane3D from "@/assets/airplane-3d.png";
import boardingPass3D from "@/assets/boarding-pass-3d.png";
import suitcase3D from "@/assets/suitcase-3d.png";
import passport3D from "@/assets/passport-3d.png";
import globe3D from "@/assets/globe-3d.png";

// Storage key for pending flight booking
const PENDING_FLIGHT_KEY = 'pending_flight_booking';

export default function AirTicket() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tripType, setTripType] = useState("round-trip");
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [departureDate, setDepartureDate] = useState<Date>();
  const [returnDate, setReturnDate] = useState<Date>();
  const [adults, setAdults] = useState("1");
  const [children, setChildren] = useState("0");
  const [flightClass, setFlightClass] = useState("economy");
  const [searchResults, setSearchResults] = useState<typeof mockFlights | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<typeof mockFlights[0] | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingRef, setBookingRef] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Check for pending booking after login
  useEffect(() => {
    const processPendingBooking = async () => {
      const pendingBooking = localStorage.getItem(PENDING_FLIGHT_KEY);
      if (pendingBooking && user) {
        const bookingData = JSON.parse(pendingBooking);
        localStorage.removeItem(PENDING_FLIGHT_KEY);

        // Restore state
        setTripType(bookingData.tripType);
        setFromCity(bookingData.fromCity);
        setToCity(bookingData.toCity);
        setDepartureDate(bookingData.departureDate ? new Date(bookingData.departureDate) : undefined);
        setReturnDate(bookingData.returnDate ? new Date(bookingData.returnDate) : undefined);
        setAdults(bookingData.adults);
        setChildren(bookingData.children);
        setFlightClass(bookingData.flightClass);

        // Set selected flight and auto-book
        const flight = mockFlights.find(f => f.id === bookingData.selectedFlightId);
        if (flight) {
          setSearchResults(mockFlights);
          setSelectedFlight(flight);

          // Auto-submit after restoring data
          await submitFlightBooking(flight, bookingData);
        }
      }
    };

    processPendingBooking();
  }, [user]);

  const submitFlightBooking = async (
    flight: typeof mockFlights[0],
    bookingData: {
      tripType: string;
      fromCity: string;
      toCity: string;
      departureDate: string;
      returnDate?: string;
      adults: string;
      children: string;
      flightClass: string;
    }
  ) => {
    if (!user) return;

    setIsSubmitting(true);

    try {
      // Generate booking reference
      const { data: refData, error: refError } = await supabase
        .rpc('generate_booking_ref');

      if (refError) throw refError;

      const ref = refData || `WC-FL-${Math.floor(10000 + Math.random() * 90000)}`;

      // Insert flight booking to database
      const { error: insertError } = await supabase
        .from('flight_bookings')
        .insert({
          user_id: user.id,
          booking_ref: ref,
          from_city: flight.from,
          to_city: flight.to,
          departure_date: bookingData.departureDate,
          return_date: bookingData.returnDate || null,
          departure_time: flight.departureTime,
          arrival_time: flight.arrivalTime,
          arrival_date: bookingData.departureDate, // Same day for simplicity
          airline: flight.airline,
          flight_number: flight.flightNumber,
          duration: flight.duration,
          stops: flight.stops,
          stop_location: flight.stopLocation,
          adults: parseInt(bookingData.adults) || 1,
          children: parseInt(bookingData.children) || 0,
          cabin_class: bookingData.flightClass,
          trip_type: bookingData.tripType,
          price_per_person: flight.price,
          total_price: flight.price * (parseInt(bookingData.adults) + parseInt(bookingData.children)),
          status: 'confirmed',
          pnr: `PNR${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        });

      if (insertError) throw insertError;

      setBookingRef(ref);
      setBookingConfirmed(true);

      toast({
        title: "Flight Booking Successful! 🎉",
        description: `Your Booking Reference: ${ref}`,
      });
    } catch (error: any) {
      console.error('Flight booking error:', error);
      toast({
        title: "Booking Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearch = () => {
    if (!fromCity || !toCity || !departureDate) {
      toast({
        title: "Fill all fields",
        description: "Please select cities and date",
        variant: "destructive",
      });
      return;
    }
    // Show mock flights
    setSearchResults(mockFlights);
  };

  const handleSelectFlight = (flight: typeof mockFlights[0]) => {
    setSelectedFlight(flight);
  };

  const handleBookFlight = async () => {
    if (!selectedFlight || !departureDate) return;

    // If user is not logged in, save booking data and redirect to auth
    if (!user) {
      const pendingBooking = {
        tripType,
        fromCity,
        toCity,
        departureDate: departureDate.toISOString(),
        returnDate: returnDate?.toISOString(),
        adults,
        children,
        flightClass,
        selectedFlightId: selectedFlight.id,
      };
      localStorage.setItem(PENDING_FLIGHT_KEY, JSON.stringify(pendingBooking));

      toast({
        title: "Login Required",
        description: "Please login to complete your booking. Your booking will be auto-confirmed after login.",
      });

      navigate("/auth");
      return;
    }

    // User is logged in, proceed with booking
    await submitFlightBooking(selectedFlight, {
      tripType,
      fromCity,
      toCity,
      departureDate: departureDate.toISOString(),
      returnDate: returnDate?.toISOString(),
      adults,
      children,
      flightClass,
    });
  };

  if (bookingConfirmed && selectedFlight) {
    return (
      <Layout>
        <Seo title="Flight Booked" description="Your flight booking has been confirmed with Wing Way Connect." />
        <section className="section-padding">
          <div className="container-wacc">
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
              <h1 className="text-3xl font-bold mb-4">Flight Booked Successfully!</h1>
              <div className="bg-card rounded-xl border border-border p-6 mb-6 text-left">
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Booking Reference</p>
                    <p className="font-bold text-lg text-primary">{bookingRef}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">PNR</p>
                    <p className="font-bold text-lg">ABC123</p>
                  </div>
                </div>
                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{selectedFlight.airline}</span>
                    <span className="text-sm text-muted-foreground">{selectedFlight.flightNumber}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-lg font-semibold">{selectedFlight.departureTime}</p>
                      <p className="text-sm text-muted-foreground">{selectedFlight.from}</p>
                    </div>
                    <div className="flex-1 flex items-center gap-2 text-muted-foreground">
                      <div className="flex-1 h-px bg-border" />
                      <Plane className="h-4 w-4" />
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">{selectedFlight.arrivalTime}</p>
                      <p className="text-sm text-muted-foreground">{selectedFlight.to}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{selectedFlight.duration} • {selectedFlight.stops} stop</p>
                </div>
                <div className="border-t border-border pt-4 mt-4">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-bold text-2xl text-primary">${selectedFlight.price * parseInt(adults)}</p>
                </div>
              </div>
              <p className="text-muted-foreground mb-6">
                Your booking is confirmed! E-ticket will be sent to your email within 30 minutes.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button asChild>
                  <Link to="/">Back to Home</Link>
                </Button>
                <Button variant="outline" onClick={() => { setBookingConfirmed(false); setSelectedFlight(null); setSearchResults(null); }}>
                  Book Another Flight
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
        title="Book Flights"
        description="Find and book the best flight deals between Canada and Bangladesh. Affordable air tickets with top airlines."
      />
      {/* Hero */}
      <section className="bg-hero-pattern text-primary-foreground py-12 md:py-16 relative overflow-hidden">
        {/* Floating 3D images - BIGGER */}
        <motion.img
          src={airplane3D}
          alt="Airplane"
          className="absolute top-2 right-[2%] w-44 sm:w-60 md:w-80 lg:w-96 opacity-80 hidden md:block"
          animate={{ y: [0, -15, 0], rotate: [0, 5, 0], x: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img
          src={boardingPass3D}
          alt="Boarding Pass"
          className="absolute bottom-4 left-[3%] w-36 sm:w-52 md:w-64 opacity-70 hidden md:block"
          animate={{ y: [0, 12, 0], rotate: [0, -3, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img
          src={suitcase3D}
          alt="Suitcase"
          className="absolute top-1/2 left-[12%] w-32 sm:w-48 md:w-56 opacity-60 hidden lg:block -translate-y-1/2"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        <motion.img
          src={passport3D}
          alt="Passport"
          className="absolute bottom-10 right-[18%] w-32 sm:w-44 md:w-56 opacity-60 hidden lg:block"
          animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img
          src={globe3D}
          alt="Globe"
          className="absolute top-12 right-[28%] w-32 sm:w-48 md:w-60 opacity-50 hidden xl:block"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />

        <div className="container-wacc relative">
          <div className="flex items-center gap-2 text-primary-foreground/70 text-sm mb-4">
            <Link to="/" className="hover:text-primary-foreground">Home</Link>
            <span>/</span>
            <span>Air Ticket Booking</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Book Air Tickets</h1>
          <p className="text-xl text-primary-foreground/80">
            Canada ↔ Bangladesh - Best Flight Prices
          </p>
        </div>
      </section>

      <section className="section-padding relative overflow-hidden">
        {/* Background decorative images */}
        <motion.img
          src={suitcase3D}
          alt="Suitcase"
          className="absolute top-20 right-[3%] w-16 sm:w-24 opacity-15 hidden lg:block"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="container-wacc">
          {/* Search Form */}
          <div className="bg-card rounded-xl border border-border p-6 mb-8 relative overflow-hidden shadow-lg">
            <motion.img
              src={boardingPass3D}
              alt="Boarding Pass"
              className="absolute -right-8 -bottom-8 w-28 opacity-10"
              animate={{ rotate: [0, 5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />

            <h2 className="text-xl font-semibold mb-6 relative">Search & Book Your Flight</h2>

            {/* Trip Type */}
            <RadioGroup value={tripType} onValueChange={setTripType} className="flex gap-6 mb-6 relative">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="one-way" id="one-way" />
                <Label htmlFor="one-way">One-Way</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="round-trip" id="round-trip" />
                <Label htmlFor="round-trip">Round Trip</Label>
              </div>
            </RadioGroup>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <Label>From</Label>
                <Select value={fromCity} onValueChange={setFromCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...cities.canada, ...cities.bangladesh].filter(c => c.code).map((city) => (
                      <SelectItem key={city.value} value={city.value}>
                        {city.label} ({city.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>To</Label>
                <Select value={toCity} onValueChange={setToCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...cities.canada, ...cities.bangladesh].filter(c => c.code).map((city) => (
                      <SelectItem key={city.value} value={city.value}>
                        {city.label} ({city.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Departure Date</Label>
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
              {tripType === "round-trip" && (
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
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div>
                <Label className="flex items-center gap-2"><Users className="h-4 w-4" /> Adults (12+)</Label>
                <Input type="number" min="1" value={adults} onChange={(e) => setAdults(e.target.value)} />
              </div>
              <div>
                <Label className="flex items-center gap-2"><Users className="h-4 w-4" /> Children (2-12)</Label>
                <Input type="number" min="0" value={children} onChange={(e) => setChildren(e.target.value)} />
              </div>
              <div>
                <Label className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> Class</Label>
                <Select value={flightClass} onValueChange={setFlightClass}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="economy">Economy</SelectItem>
                    <SelectItem value="premium">Premium Economy</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleSearch} size="lg" className="w-full sm:w-auto">
              <Plane className="mr-2 h-4 w-4" />
              Search Flights
            </Button>
          </div>

          {/* Search Results - REDESIGNED */}
          {searchResults && !selectedFlight && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Available Flights ({searchResults.length})</h2>
                <div className="text-sm text-muted-foreground">Prices include taxes and fees</div>
              </div>

              {searchResults.map((flight, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={flight.id}
                  className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-all duration-300 group"
                >
                  {/* Card Header - Airline Branding */}
                  <div className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1">
                        <span className="text-primary font-bold text-lg">{flight.logo}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg leading-none">{flight.airline}</h3>
                        <p className="text-slate-400 text-sm mt-1">{flight.flightNumber} • {flightClass === 'business' ? 'Business Class' : 'Economy'}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {idx === 0 && (
                        <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                          <Star className="h-3 w-3 fill-current" /> BEST VALUE
                        </span>
                      )}
                      {flight.stops === 0 && (
                        <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                          <Zap className="h-3 w-3 fill-current" /> FASTEST
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row gap-8 items-center">

                      {/* Flight Details */}
                      <div className="flex-1 w-full grid grid-cols-3 gap-4 items-center text-center">
                        {/* Departure */}
                        <div className="text-left">
                          <p className="text-2xl font-bold">{flight.departureTime}</p>
                          <p className="font-medium text-foreground/80">{flight.from.split(" ")[0]}</p>
                          <p className="text-xs text-muted-foreground">{flight.from}</p>
                        </div>

                        {/* Duration Graphic */}
                        <div className="flex flex-col items-center px-4">
                          <span className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {flight.duration}
                          </span>
                          <div className="w-full h-px bg-border relative flex items-center justify-center">
                            <div className="absolute w-2 h-2 bg-primary rounded-full left-0"></div>
                            <Plane className="h-4 w-4 text-primary absolute" />
                            <div className={`absolute w-2 h-2 rounded-full right-0 ${flight.stops === 0 ? 'bg-primary' : 'bg-orange-500'}`}></div>
                          </div>
                          <span className={`text-xs mt-2 px-2 py-0.5 rounded-full ${flight.stops === 0 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {flight.stops === 0 ? 'Direct' : `${flight.stops} Stop`}
                          </span>
                        </div>

                        {/* Arrival */}
                        <div className="text-right">
                          <p className="text-2xl font-bold">{flight.arrivalTime}</p>
                          <p className="font-medium text-foreground/80">{flight.to.split(" ")[0]}</p>
                          <p className="text-xs text-muted-foreground">{flight.to}</p>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="hidden lg:block w-px h-24 bg-border/50"></div>

                      {/* Price & Action */}
                      <div className="w-full lg:w-auto flex flex-row lg:flex-col justify-between lg:justify-center items-center gap-4 min-w-[180px]">
                        <div className="text-right lg:text-center">
                          <p className="text-3xl font-bold text-primary">${flight.price}</p>
                          <div className="flex items-center gap-1 justify-end lg:justify-center mt-1">
                            <ShieldCheck className="h-3 w-3 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">Refundable</span>
                          </div>
                        </div>
                        <Button size="lg" className="w-full lg:w-auto px-8" onClick={() => handleSelectFlight(flight)}>
                          Select Flight <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>

                    </div>

                    {/* Footer Info */}
                    <div className="mt-6 pt-4 border-t border-border flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1 bg-secondary px-2 py-1 rounded">
                        <Briefcase className="h-3 w-3" /> Baggage: {flight.baggage}
                      </span>
                      <span className="flex items-center gap-1 bg-secondary px-2 py-1 rounded">
                        <Users className="h-3 w-3" /> {flight.cabin}
                      </span>
                      {flight.meal && (
                        <span className="flex items-center gap-1 bg-secondary px-2 py-1 rounded">
                          🍔 Meal included
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Selected Flight - Booking Form */}
          {selectedFlight && !bookingConfirmed && (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-card rounded-xl border border-border p-6 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">Flight Details</h3>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedFlight(null)} className="text-destructive hover:bg-destructive/10">
                      Change Flight
                    </Button>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-secondary/30 rounded-xl border border-border/50">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xl">
                      {selectedFlight.logo}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-lg">{selectedFlight.airline}</p>
                          <p className="text-sm text-muted-foreground">{selectedFlight.flightNumber}</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded">Confirmed</span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-xl">{selectedFlight.departureTime}</p>
                          <p className="text-sm">{selectedFlight.from}</p>
                        </div>
                        <div className="flex flex-col items-center px-4">
                          <p className="text-xs text-muted-foreground">{selectedFlight.duration}</p>
                          <ArrowRight className="h-4 w-4 text-muted-foreground my-1" />
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-xl">{selectedFlight.arrivalTime}</p>
                          <p className="text-sm">{selectedFlight.to}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-xl border border-border p-6 shadow-md">
                  <h3 className="font-semibold mb-6 flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" /> Passenger Information
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <Label>First Name</Label>
                      <Input placeholder="Enter first name" />
                    </div>
                    <div>
                      <Label>Last Name</Label>
                      <Input placeholder="Enter last name" />
                    </div>
                    <div>
                      <Label>Email Address</Label>
                      <Input type="email" placeholder="your@email.com" />
                    </div>
                    <div>
                      <Label>Phone Number</Label>
                      <SmartPhoneInput
                        placeholder="Enter phone number"
                        className="h-10"
                        defaultCountry="BD"
                        onChange={() => { }}
                      />
                    </div>
                    <div>
                      <Label>Passport Number</Label>
                      <Input placeholder="Enter passport number" />
                    </div>
                    <div>
                      <Label>Nationality</Label>
                      <Select>
                        <SelectTrigger><SelectValue placeholder="Select nationality" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ca">🇨🇦 Canada</SelectItem>
                          <SelectItem value="bd">🇧🇩 Bangladesh</SelectItem>
                          <SelectItem value="us">🇺🇸 United States</SelectItem>
                          <SelectItem value="uk">🇬🇧 United Kingdom</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="sticky top-24 bg-card rounded-xl border border-border p-6 shadow-lg">
                  <h3 className="font-semibold mb-4 text-lg">Booking Summary</h3>
                  <div className="space-y-4 text-sm mb-6">
                    <div className="flex justify-between items-center pb-2 border-b border-border/50">
                      <span className="text-muted-foreground">Flight Route</span>
                      <span className="font-medium text-right">{selectedFlight.from.split(" ")[0]} ➔ {selectedFlight.to.split(" ")[0]}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Passengers</span>
                      <span>{adults} Adult(s)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Base fare</span>
                      <span>${selectedFlight.price} × {adults}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Taxes & Fees</span>
                      <span>$0.00</span>
                    </div>
                  </div>
                  <div className="bg-secondary/50 p-4 rounded-lg flex justify-between items-center mb-6">
                    <span className="font-semibold">Total Amount</span>
                    <span className="font-bold text-2xl text-primary">${selectedFlight.price * parseInt(adults)}</span>
                  </div>
                  <Button
                    className="w-full bg-cta hover:bg-cta/90 text-cta-foreground font-bold h-12 text-lg shadow-lg hover:shadow-xl transition-all"
                    onClick={handleBookFlight}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : user ? (
                      "Confirm Booking Now"
                    ) : (
                      "Login to Book"
                    )}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground mt-4 flex items-center justify-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Secure Payment
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Airlines */}
      <section className="section-padding bg-secondary">
        <div className="container-wacc text-center">
          <h2 className="section-title mb-8">Popular Airlines</h2>
          <div className="flex flex-wrap justify-center gap-8">
            {["Air Canada", "Biman Bangladesh", "Emirates", "Qatar Airways", "Turkish Airlines"].map((airline) => (
              <div key={airline} className="bg-card px-6 py-4 rounded-lg shadow-sm border border-border hover:shadow-md transition-all cursor-pointer">
                <p className="font-medium text-lg">{airline}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
