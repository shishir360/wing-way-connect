
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera, Save, User, Phone, MapPin, Truck, History } from "lucide-react";
import Seo from "@/components/Seo";

export default function AgentProfile() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [agentData, setAgentData] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        full_name: "",
        phone: "",
        city: "",
        country: "",
        avatar_url: "",
    });

    useEffect(() => {
        if (user) fetchProfile();
    }, [user]);

    const fetchProfile = async () => {
        try {
            const { data: prof, error: profError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user?.id)
                .single();

            if (profError) throw profError;

            const { data: ag, error: agError } = await (supabase
                .from('agents' as any)
                .select('*')
                .eq('user_id', user?.id)
                .maybeSingle());

            setProfile(prof);
            setAgentData(ag || {});
            setFormData({
                full_name: prof.full_name || "",
                phone: prof.phone || "",
                city: prof.city || "",
                country: prof.country || "",
                avatar_url: prof.avatar_url || "",
            });
        } catch (error: any) {
            toast({ title: "Error", description: "Failed to load profile", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) {
            return;
        }
        const file = event.target.files[0];
        const fileExt = file.name.split('.').pop();
        const filePath = `${user?.id}-${Math.random()}.${fileExt}`;

        setSaving(true);
        try {
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, avatar_url: publicUrl }));

            // Auto-save avatar update
            await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user?.id);
            toast({ title: "Avatar Updated", description: "Your profile picture has been updated." });

        } catch (error: any) {
            toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    phone: formData.phone,
                    city: formData.city,
                    country: formData.country,
                })
                .eq('id', user?.id);

            if (error) throw error;

            toast({ title: "Profile Updated", description: "Your changes have been saved." });
            setIsEditing(false);
            fetchProfile();
        } catch (error: any) {
            toast({ title: "Update Failed", description: error.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="pb-20 space-y-6">
            <Seo title="My Profile" description="View and update agent profile information and contact details." />

            <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 rounded-b-[2.5rem] -mx-4 px-4 pt-4 pb-12 shadow-xl shadow-primary/20 mb-8 mt-[-1rem]">
                <div className="flex justify-between items-start mb-6 text-white">
                    <h1 className="text-xl font-bold">My Profile</h1>
                    <Button
                        variant="secondary"
                        size="sm"
                        className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md"
                        onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                        disabled={saving}
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : isEditing ? <><Save className="h-4 w-4 mr-1" /> Save</> : "Edit"}
                    </Button>
                </div>

                <div className="flex flex-col items-center">
                    <div className="relative group">
                        <Avatar className="h-28 w-28 border-4 border-white/20 shadow-2xl">
                            <AvatarImage src={formData.avatar_url} className="object-cover" />
                            <AvatarFallback className="text-2xl bg-white text-primary font-bold">
                                {formData.full_name?.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        {isEditing && (
                            <label className="absolute bottom-0 right-0 p-2 bg-white rounded-full text-primary cursor-pointer shadow-lg hover:scale-110 transition-transform">
                                <Camera className="h-5 w-5" />
                                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                            </label>
                        )}
                    </div>
                    <h2 className="text-2xl font-bold text-white mt-4 font-display">{profile?.full_name}</h2>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="bg-white/20 text-white border-0 hover:bg-white/30 backdrop-blur-md">
                            <Truck className="h-3 w-3 mr-1" /> {agentData?.vehicle_type || 'Agent'}
                        </Badge>
                        <Badge variant={profile?.is_active ? "default" : "destructive"} className={profile?.is_active ? "bg-emerald-500 hover:bg-emerald-600 text-white border-0" : ""}>
                            {profile?.is_active ? "Active" : "Inactive"}
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="px-1 space-y-6">
                <Card className="border-border/50 shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Personal Details</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/50">
                            <div className="p-4 flex items-center gap-4">
                                <div className="p-2 bg-primary/10 rounded-full text-primary shrink-0"><User className="h-5 w-5" /></div>
                                <div className="flex-1">
                                    <Label className="text-xs text-muted-foreground">Full Name</Label>
                                    {isEditing ? (
                                        <Input value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} className="h-8 mt-1" />
                                    ) : (
                                        <p className="font-medium">{profile?.full_name}</p>
                                    )}
                                </div>
                            </div>
                            <div className="p-4 flex items-center gap-4">
                                <div className="p-2 bg-primary/10 rounded-full text-primary shrink-0"><Phone className="h-5 w-5" /></div>
                                <div className="flex-1">
                                    <Label className="text-xs text-muted-foreground">Phone Number</Label>
                                    {isEditing ? (
                                        <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="h-8 mt-1" />
                                    ) : (
                                        <p className="font-medium">{profile?.phone || 'Not set'}</p>
                                    )}
                                </div>
                            </div>
                            <div className="p-4 flex items-center gap-4">
                                <div className="p-2 bg-primary/10 rounded-full text-primary shrink-0"><MapPin className="h-5 w-5" /></div>
                                <div className="flex-1">
                                    <Label className="text-xs text-muted-foreground">City & Country</Label>
                                    {isEditing ? (
                                        <div className="flex gap-2 mt-1">
                                            <Input placeholder="City" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="h-8" />
                                            <Input placeholder="Country" value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value })} className="h-8" />
                                        </div>
                                    ) : (
                                        <p className="font-medium">{profile?.city}, {profile?.country}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/50 shadow-sm overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-4">
                        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Account Info</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                            <span className="text-sm text-muted-foreground">Email</span>
                            <span className="font-medium text-sm">{profile?.email}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                            <span className="text-sm text-muted-foreground">Joined</span>
                            <span className="font-medium text-sm">{new Date(profile?.created_at).toLocaleDateString()}</span>
                        </div>
                        {agentData?.license_number && (
                            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                                <span className="text-sm text-muted-foreground">License</span>
                                <span className="font-mono text-sm">{agentData.license_number}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
