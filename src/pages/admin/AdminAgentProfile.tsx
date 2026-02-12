import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAgentDetails } from "@/hooks/useAdminData";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Truck, CheckCircle, Clock, Package, MapPin, ExternalLink, Calendar, DollarSign, Ban, ShieldAlert, Download, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label as UILabel } from "@/components/ui/label";
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const statusOptions = [
    { value: "pickup", label: "Pickup Agent (Mark as Picked Up)" },
    { value: "handover", label: "Hub Agent (Mark as Handed Over)" },
    { value: "in_transit", label: "Transit Agent (Mark as In Transit)" },
    { value: "customs", label: "Customs Agent (Mark as Customs Cleared)" },
    { value: "checkpoint", label: "Checkpoint Agent (Checkpoint Scan)" },
    { value: "out_for_delivery", label: "Delivery Driver (Mark as Out for Delivery)" },
    { value: "delivery", label: "Delivery Agent (Mark as Delivered)" }
];

export default function AdminAgentProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { agent, shipments, stats, loading, refetch } = useAgentDetails(id);
    const { toast } = useToast();
    const [updatingRole, setUpdatingRole] = React.useState(false);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!agent) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-bold">Agent Not Found</h2>
                <Button onClick={() => navigate("/admin")} className="mt-4">Back to Admin</Button>
            </div>
        );
    }

    const currentTasks = shipments.filter(s =>
        (s as any).assigned_agent === id &&
        s.status !== 'delivered' &&
        s.status !== 'cancelled'
    );

    // History includes delivered/cancelled OR items scanned but now assigned to someone else
    const history = shipments.filter(s =>
        !currentTasks.includes(s)
    );

    const handleDeactivate = async () => {
        if (!id) return;
        if (!confirm("Are you sure you want to deactivate this agent?")) return;

        // Deactivate in profiles
        const { error } = await supabase.from('profiles' as any).update({ is_active: false }).eq('id', id);
        if (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Agent Deactivated" });
            navigate("/admin");
        }
    };

    const updateJobRole = async (value: string) => {
        if (!id) return;
        setUpdatingRole(true);
        try {
            const { error: roleError } = await supabase
                .from('user_roles')
                .update({ designated_status: value === "none" ? null : value } as any)
                .eq('user_id', id)
                .eq('role', 'agent');

            if (roleError) throw roleError;

            // Also update agents table vehicle_type/metadata if it exists
            const displayRole = statusOptions.find(o => o.value === value)?.label || 'Delivery Agent';
            await supabase.from('agents' as any).update({ vehicle_type: displayRole.split('(')[0].trim() }).eq('user_id', id);

            toast({ title: "Job Role Updated", description: `Agent assigned as ${displayRole}` });
            if (refetch) refetch();
        } catch (err: any) {
            toast({ title: "Update Failed", description: err.message, variant: "destructive" });
        } finally {
            setUpdatingRole(false);
        }
    };

    const handleDownloadPDF = async () => {
        const element = document.getElementById('agent-profile-content');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${agent?.full_name || 'agent'}_profile.pdf`);
            toast({ title: "PDF Downloaded" });
        } catch (error) {
            console.error("PDF generation failed", error);
            toast({ title: "PDF Generation Failed", variant: "destructive" });
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-6xl">
            <Seo title={`${agent.full_name || 'Agent'} - Agent Profile`} description="Manage agent profile, shipments, and performance." />

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold font-display flex items-center gap-2">
                        {agent.full_name}
                        {agent.is_approved && <CheckCircle className="h-5 w-5 text-green-500" />}
                    </h1>
                    <p className="text-muted-foreground text-sm flex items-center gap-2">
                        <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> {agent.vehicle_type || 'Delivery Agent'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {agent.location || agent.city || 'Unknown Location'}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                        <Download className="h-4 w-4 mr-2" /> Download PDF
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleDeactivate}>
                        <Ban className="h-4 w-4 mr-2" /> Deactivate
                    </Button>
                </div>
            </div>

            <div id="agent-profile-content">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <p className="text-xs text-muted-foreground">Lifetime shipments</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completed</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.delivered}</div>
                            <p className="text-xs text-muted-foreground">{((stats.delivered / (stats.total || 1)) * 100).toFixed(0)}% Success Rate</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                            <Clock className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.pending}</div>
                            <p className="text-xs text-muted-foreground">Active assignments</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Today's Jobs</CardTitle>
                            <Calendar className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.today}</div>
                            <p className="text-xs text-muted-foreground">Jobs assigned today</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">This Month</CardTitle>
                            <Calendar className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.thisMonth}</div>
                            <p className="text-xs text-muted-foreground">Jobs assigned this month</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
                            <DollarSign className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{agent.wallet?.currency || 'BDT'} {agent.wallet?.balance || '0.00'}</div>
                            <p className="text-xs text-muted-foreground">Current earnings</p>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="tasks" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="tasks">Current Tasks ({currentTasks.length})</TabsTrigger>
                        <TabsTrigger value="history">History ({history.length})</TabsTrigger>
                        <TabsTrigger value="info">Profile Info</TabsTrigger>
                    </TabsList>

                    <TabsContent value="tasks" className="space-y-4">
                        {currentTasks.length > 0 ? (
                            currentTasks.map(shipment => (
                                <ShipmentCard key={shipment.id} shipment={shipment} />
                            ))
                        ) : (
                            <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
                                <CheckCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                                <h3 className="text-lg font-medium">No Active Tasks</h3>
                                <p className="text-muted-foreground">This agent has no pending deliveries.</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="history" className="space-y-4">
                        {history.length > 0 ? (
                            history.map(shipment => (
                                <ShipmentCard key={shipment.id} shipment={shipment} isHistory />
                            ))
                        ) : (
                            <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed">
                                <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                                <h3 className="text-lg font-medium">No History Yet</h3>
                                <p className="text-muted-foreground">No completed shipments found.</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="info">
                        <Card>
                            <CardHeader>
                                <CardTitle>Personal Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>Full Name</Label>
                                        <div className="font-medium">{agent.full_name}</div>
                                    </div>
                                    <div>
                                        <Label>Email</Label>
                                        <div className="font-medium">{agent.email}</div>
                                    </div>
                                    <div>
                                        <Label>Phone</Label>
                                        <div className="font-medium">{agent.phone || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <Label>License Number</Label>
                                        <div className="font-medium">{agent.license_number || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <Label>Joined Date</Label>
                                        <div className="font-medium">{format(new Date(agent.created_at), 'PPP')}</div>
                                    </div>
                                    <div>
                                        <Label>Status</Label>
                                        <Badge>{agent.status || 'Offline'}</Badge>
                                    </div>
                                    <div className="col-span-2 pt-4 border-t">
                                        <UILabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 block">
                                            Assigned Job Role
                                        </UILabel>
                                        <div className="flex items-center gap-3">
                                            <Select
                                                disabled={updatingRole}
                                                value={agent.designated_status || "none"}
                                                onValueChange={updateJobRole}
                                            >
                                                <SelectTrigger className="max-w-md">
                                                    <SelectValue placeholder="No specific role assigned" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Manual Scanner (No Auto-Status)</SelectItem>
                                                    {statusOptions.map(opt => (
                                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {updatingRole && <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />}
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mt-2 italic">
                                            * Changing this will automatically update the agent's scanner application in real-time.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

function Label({ children }: { children: React.ReactNode }) {
    return <p className="text-xs text-muted-foreground font-medium mb-1">{children}</p>;
}

function ShipmentCard({ shipment, isHistory }: { shipment: any, isHistory?: boolean }) {
    return (
        <Card className={`overflow-hidden transition-all hover:shadow-md ${isHistory ? 'opacity-80 hover:opacity-100' : ''}`}>
            <CardContent className="p-0">
                <div className="flex items-stretch">
                    <div className={`w-2 ${shipment.status === 'delivered' ? 'bg-green-500' : 'bg-primary'} shrink-0`} />
                    <div className="p-4 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono font-bold text-lg">{shipment.tracking_id}</span>
                                <Badge variant="outline" className="capitalize">{shipment.status.replace('_', ' ')}</Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {shipment.from_city || 'BD'} ➔ {shipment.to_city || 'Global'}</span>
                                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(shipment.created_at), 'MMM d, yyyy')}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="text-right hidden md:block">
                                <p className="xs text-muted-foreground">Sender / Receiver</p>
                                <div className="flex flex-col items-end">
                                    {shipment.user_id ? (
                                        <a href={`/admin/users/${shipment.user_id}`} target="_blank" rel="noreferrer" className="font-medium hover:underline text-primary text-sm flex items-center gap-1" title="View Sender Profile">
                                            <User className="h-3 w-3" /> {shipment.sender_name}
                                        </a>
                                    ) : (
                                        <span className="font-medium text-sm">{shipment.sender_name}</span>
                                    )}
                                    <a href={`/admin/users?search=${shipment.receiver_name}`} target="_blank" rel="noreferrer" className="text-xs hover:underline text-muted-foreground flex items-center gap-1" title="Search Receiver">
                                        ➔ {shipment.receiver_name}
                                    </a>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                                <a href={`/admin/shipments?id=${shipment.id}`} target="_blank" rel="noreferrer">
                                    View <ExternalLink className="h-3 w-3 ml-2" />
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
