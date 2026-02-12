import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SmartPhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { motion } from "framer-motion";
import { User, Phone, Mail, MapPin, Globe, Save, ArrowLeft, Loader2 } from "lucide-react";
import Seo from "@/components/Seo";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();

  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address: "",
    city: "",
    country: "Canada",
  });

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
        return;
      }

      if (role === 'admin') {
        navigate("/admin");
      } else if (role === 'agent') {
        navigate("/agent");
      }
    }
  }, [user, authLoading, role, navigate]);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
        country: profile.country || "Canada",
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateProfile(formData);
    setIsSaving(false);
  };

  if (authLoading || profileLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Seo title="My Profile" />
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Seo
        title="My Profile"
        description="View and update your personal account information and preferences."
      />
      {/* Hero */}
      <section className="bg-hero-pattern text-primary-foreground py-10 md:py-14 relative overflow-hidden">
        <div className="container-wacc relative">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white mb-4"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display">
            Your Profile
          </h1>
          <p className="text-primary-foreground/70 mt-1">Update your information</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-wacc">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-card rounded-2xl border border-border/50 p-6 sm:p-8 shadow-premium">
              {/* Avatar Section */}
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <User className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{profile?.full_name || "User"}</h2>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Full Name</Label>
                    <div className="relative mt-1.5">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="Your name"
                        className="pl-10 h-12 rounded-xl"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Phone Number</Label>
                    <div className="mt-1.5">
                      <SmartPhoneInput
                        value={formData.phone}
                        onChange={(value) => setFormData({ ...formData, phone: value || "" })}
                        placeholder="Enter phone number"
                        className="h-12"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Address</Label>
                  <div className="relative mt-1.5">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Your address"
                      className="pl-10 h-12 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">City</Label>
                    <div className="relative mt-1.5">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="City name"
                        className="pl-10 h-12 rounded-xl"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Country</Label>
                    <div className="relative mt-1.5">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        placeholder="Country"
                        className="pl-10 h-12 rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="w-full h-12 rounded-xl text-base bg-cta hover:bg-cta/90 text-cta-foreground shadow-lg"
                  >
                    {isSaving ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>

            {/* Account Info */}
            <div className="bg-card rounded-2xl border border-border/50 p-6 sm:p-8 shadow-premium mt-6">
              <h3 className="font-semibold mb-4">Account Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{user?.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground">Account Created:</span>
                  <span className="font-medium">
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString("en-US")
                      : "-"
                    }
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
