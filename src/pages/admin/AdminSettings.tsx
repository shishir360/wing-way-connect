import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2, DollarSign, Percent } from "lucide-react";
import Seo from "@/components/Seo";

export default function AdminSettings() {
    const [settings, setSettings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('site_settings' as any)
                .select('*')
                .order('key');

            if (error) throw error;
            setSettings(data || []);
        } catch (error) {
            console.error('Error fetching settings:', error);
            toast({ title: "Error", description: "Failed to load settings", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (id: string, key: string, newValue: any) => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('site_settings' as any)
                .update({ value: newValue, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (error) throw error;

            toast({ title: "Success", description: "Settings updated successfully" });

            // Update local state
            setSettings(prev => prev.map(s => s.id === id ? { ...s, value: newValue } : s));
        } catch (error) {
            console.error('Error updating settings:', error);
            toast({ title: "Error", description: "Failed to save changes", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    return (
        <div className="space-y-6">
            <Seo title="Admin Settings" description="Configure global site settings and pricing." />
            <div>
                <h1 className="text-3xl font-bold font-display">Site Settings</h1>
                <p className="text-muted-foreground">Manage pricing, taxes, and global configurations.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {settings.map((setting) => (
                    <div key={setting.id} className="bg-card border border-border rounded-xl p-6 shadow-sm">
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                            {setting.key.includes('pricing') ? <DollarSign className="h-5 w-5 text-green-500" /> : <Percent className="h-5 w-5 text-blue-500" />}
                            {setting.label}
                        </h3>

                        <div className="space-y-4">
                            {Object.keys(setting.value).map((field) => (
                                <div key={field}>
                                    <Label className="capitalize mb-1 block text-xs text-muted-foreground">{field.replace(/([A-Z])/g, ' $1').trim()}</Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            value={setting.value[field]}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                const cleanVal = isNaN(val) ? 0 : val;
                                                const newValue = { ...setting.value, [field]: cleanVal };
                                                // Update local state temporarily for smooth typing
                                                setSettings(prev => prev.map(s => s.id === setting.id ? { ...s, value: newValue } : s));
                                            }}
                                            className="font-mono"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Button
                            className="w-full mt-6"
                            onClick={() => handleUpdate(setting.id, setting.key, setting.value)}
                            disabled={saving}
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Save Changes
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}
