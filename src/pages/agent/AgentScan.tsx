import { useState, useEffect } from "react";
import Seo from "@/components/Seo";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import QRScanner from "@/components/qr/QRScanner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CheckCircle, Package, AlertCircle, RefreshCw, Box, MapPin, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AgentScan() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [scannedData, setScannedData] = useState<{ id: string } | null>(null);
  const [shipmentInfo, setShipmentInfo] = useState<any>(null);
  const [scanType, setScanType] = useState("checkpoint");
  const [designatedStatus, setDesignatedStatus] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);

  // Fetch agent's designated role/status & Auto-Location
  useEffect(() => {
    if (user) {
      const fetchRole = async () => {
        const { data } = await (supabase as any)
          .from('user_roles')
          .select('designated_status')
          .eq('user_id', user.id)
          .eq('role', 'agent')
          .single() as any;

        if (data?.designated_status) {
          setDesignatedStatus(data.designated_status);
          setScanType(data.designated_status);
        }
      };
      fetchRole();
    }

    // Auto-fetch location
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        // Simple reverse geocoding via OpenStreetMap (Free, no key needed for small usage)
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data && data.display_name) {
            // Shorten the address for UI
            const shortLoc = data.address.city || data.address.town || data.address.village || data.address.suburb || "Unknown Location";
            setLocation(`${shortLoc}, ${data.address.country_code?.toUpperCase()}`);
          } else {
            setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
          }
        } catch (e) {
          setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }
      }, (error) => {
        console.error("Geo Error:", error);
      });
    }
  }, [user]);

  const handleScan = async (data: string) => {
    try {
      if (window.navigator && window.navigator.vibrate) window.navigator.vibrate(200);

      let trackingId = data;
      // Try to parse JSON if it is one
      if (data.trim().startsWith('{')) {
        try {
          const parsed = JSON.parse(data);
          if (parsed.id) trackingId = parsed.id;
        } catch {
          // Ignore parse error, use raw data
        }
      }

      setScannedData({ id: trackingId });

      // Fetch shipment details
      const { data: shipment } = await supabase
        .from('shipments')
        .select('*')
        .eq('tracking_id', trackingId)
        .maybeSingle();

      if (shipment) {
        setShipmentInfo(shipment);
        toast({ title: "Shipment Found! 📦", description: `Tracking: ${trackingId}` });
      } else {
        toast({ title: "Shipment Not Found", description: `No shipment found for ID: ${trackingId}`, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Scan Error", description: "Could not process QR code", variant: "destructive" });
    }
  };

  const handleSubmitScan = async () => {
    if (!user || !shipmentInfo) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('shipment_scans').insert({
        shipment_id: shipmentInfo.id,
        scanned_by: user.id,
        scan_type: scanType,
        location: location || null,
        notes: notes || null,
      });

      if (error) throw error;

      // If delivery scan, update shipment status
      if (scanType === 'delivery') {
        await supabase.from('shipments').update({ status: 'delivered', actual_delivery: new Date().toISOString() }).eq('id', shipmentInfo.id);
      }

      // Auto-update status for "Handed Over" to "In Transit" logic if needed, 
      // but for now relying on scan entry. Timeline will be added below.

      const scanTypeLabels: Record<string, string> = {
        pickup: "Picked Up", handover: "Handed Over",
        checkpoint: "Checkpoint Passed", delivery: "Delivered"
      };

      await supabase.from('shipment_timeline').insert({
        shipment_id: shipmentInfo.id,
        status: scanType === 'delivery' ? 'delivered' : shipmentInfo.status, // Keep current status unless delivered, or update based on scan logic
        description: scanTypeLabels[scanType] + (location ? ` - ${location}` : ''),
        location: location || null,
        is_current: scanType === 'delivery',
      });

      if (window.navigator && window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]); // Success vibration
      setScanSuccess(true);
      toast({ title: "Scan Saved! ✅", description: `${scanTypeLabels[scanType]} recorded.` });
    } catch (e: any) {
      toast({ title: "Scan Failed", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const resetScan = () => {
    setScannedData(null);
    setShipmentInfo(null);
    setScanType(designatedStatus || "checkpoint"); // Reset to designated default
    setLocation("");
    setNotes("");
    setScanSuccess(false);
  };

  const scanTypeLabels: Record<string, string> = {
    pickup: "Picked Up", handover: "Handed Over",
    checkpoint: "Checkpoint Passed", delivery: "Delivered"
  };

  if (scanSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in zoom-in duration-300">
        <Seo title="Scan Complete" />
        <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-6 ring-4 ring-green-500/10">
          <CheckCircle className="h-12 w-12 text-green-600 drop-shadow-sm" />
        </div>
        <h2 className="text-3xl font-bold font-display mb-2 text-foreground">Scan Complete!</h2>
        <div className="bg-muted/50 px-6 py-3 rounded-full mb-8 border border-border/50">
          <p className="text-muted-foreground font-mono font-medium tracking-wide">
            {scannedData?.id}
          </p>
        </div>

        <Button onClick={resetScan} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg px-8 rounded-full h-12 text-lg">
          Scan Next Parcel
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <Seo title="Smart Scan" />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold font-display flex items-center gap-2">
          <RefreshCw className="h-6 w-6 text-primary animate-pulse-slow" />
          Smart Scan
        </h1>
        {designatedStatus && (
          <Badge variant="secondary" className="px-3 py-1 text-xs uppercase tracking-wider font-semibold bg-primary/10 text-primary border-primary/20">
            Role: {designatedStatus}
          </Badge>
        )}
      </div>

      {!shipmentInfo ? (
        <Card className="p-1 border-2 border-dashed border-primary/20 bg-muted/30 shadow-none overflow-hidden rounded-3xl">
          <div className="bg-background rounded-[1.2rem] overflow-hidden relative">
            <QRScanner onScan={handleScan} onError={(err) => toast({ title: "Camera Error", description: err, variant: "destructive" })} />
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-white/50 rounded-xl relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary -mt-1 -ml-1 rounded-tl-sm" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary -mt-1 -mr-1 rounded-tr-sm" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary -mb-1 -ml-1 rounded-bl-sm" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary -mb-1 -mr-1 rounded-br-sm" />
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground py-3">Point camera at the shipping label QR code</p>
        </Card>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <Card className="p-5 border-border/50 shadow-md bg-gradient-to-br from-card to-muted/20">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-xl text-foreground font-mono tracking-tight">{scannedData?.id}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="bg-background/50">
                    {shipmentInfo.route === 'bd-to-ca' ? '🇧🇩 BD ➔ 🇨🇦 CA' : '🇨🇦 CA ➔ 🇧🇩 BD'}
                  </Badge>
                  <Badge variant="outline" className="bg-background/50 capitalize">
                    {shipmentInfo.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm bg-background/50 p-4 rounded-xl border border-border/50">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Sender</p>
                <p className="font-semibold truncate">{shipmentInfo.sender_name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Receiver</p>
                <p className="font-semibold truncate">{shipmentInfo.receiver_name}</p>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Scan Action</Label>
              {designatedStatus ? (
                <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex items-center justify-between">
                  <span className="font-medium text-foreground">{scanTypeLabels[designatedStatus]}</span>
                  <Badge className="bg-primary text-primary-foreground">Auto-Selected</Badge>
                </div>
              ) : (
                <Select value={scanType} onValueChange={setScanType}>
                  <SelectTrigger className="h-12 rounded-xl bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pickup">Pickup</SelectItem>
                    <SelectItem value="handover">Handover</SelectItem>
                    <SelectItem value="checkpoint">Checkpoint</SelectItem>
                    <SelectItem value="delivery">Delivery (Completed)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Current Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="e.g. Dhaka Hub" value={location} onChange={(e) => setLocation(e.target.value)} className="pl-10 h-12 rounded-xl bg-card" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Notes (Optional)</Label>
              <Input placeholder="Any comments..." value={notes} onChange={(e) => setNotes(e.target.value)} className="h-12 rounded-xl bg-card" />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 h-12 rounded-xl border-border/50" onClick={resetScan}>Cancel</Button>
              <Button className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md text-base font-semibold" onClick={handleSubmitScan} disabled={submitting}>
                {submitting ? (
                  <div className="flex items-center gap-2"><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Saving...</div>
                ) : "Confirm Scan"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
