import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Seo from "@/components/Seo";
import { useAdminProfiles } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search, RefreshCw, User, ShieldCheck, Truck, CheckCircle, XCircle, Eye, FileText, Download, Ban, Briefcase, ExternalLink } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AgentRequest {
  id: string; // user_roles table id
  user_id: string;
  role: string;
  is_approved: boolean;
  designated_status?: string | null;
  created_at: string;
  profile?: any; // Allow full profile object
}

const statusOptions = [
  { value: "pickup", label: "Pickup Agent (Mark as Picked Up)" },
  { value: "handover", label: "Hub Agent (Mark as Handed Over)" },
  { value: "in_transit", label: "Transit Agent (Mark as In Transit)" },
  { value: "customs", label: "Customs Agent (Mark as Customs Cleared)" },
  { value: "checkpoint", label: "Checkpoint Agent (Checkpoint Scan)" },
  { value: "out_for_delivery", label: "Delivery Driver (Mark as Out for Delivery)" },
  { value: "delivery", label: "Delivery Agent (Mark as Delivered)" }
];

export default function AdminUsers() {
  const { profiles, loading, error, refetch } = useAdminProfiles();
  const navigate = useNavigate();
  /* SEARCH PARAM SUPPORT */
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [agentRequests, setAgentRequests] = useState<AgentRequest[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [tab, setTab] = useState<"users" | "agents">("agents");
  const [selectedUser, setSelectedUser] = useState<any>(null); // This is the PROFILE object with extra props
  const [selectedAgentRole, setSelectedAgentRole] = useState<AgentRequest | null>(null); // This is the ROLE object for the selected agent
  const [agentDocuments, setAgentDocuments] = useState<any[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { toast } = useToast();

  /* WALLET: Add State for wallets */
  const [agentWallets, setAgentWallets] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchAgentRequests();
    const tabParam = searchParams.get("tab");
    if (tabParam === "users" || tabParam === "agents") {
      setTab(tabParam as "users" | "agents");
    } else if (searchParams.get("search")) {
      setTab("users");
    }

    // Real-time subscription for Job Role updates
    const channel = supabase
      .channel('admin-users-roles')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'user_roles'
      }, () => {
        fetchAgentRequests();
        toast({ title: "Data Updated", description: "Agent roles refreshed." });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [searchParams]);

  const fetchAgentRequests = async () => {
    setLoadingAgents(true);
    const { data: roles } = await supabase
      .from('user_roles')
      .select('*')
      .eq('role', 'agent')
      .order('created_at', { ascending: false });

    if (roles) {
      const userIds = roles.map(r => r.user_id);

      // Fetch ALL profile fields
      const { data: profs } = await supabase.from('profiles').select('*').in('id', userIds);

      // Fetch Wallets
      const { data: wallets } = await (supabase as any).from('wallets').select('*').in('user_id', userIds) as any;
      const walletMap: Record<string, any> = {};
      wallets?.forEach(w => {
        walletMap[w.user_id] = w;
      });
      setAgentWallets(walletMap);

      const merged = roles.map(r => ({
        ...r,
        profile: profs?.find(p => p.id === r.user_id) || null,
        wallet: walletMap[r.user_id] || null
      }));
      setAgentRequests(merged as any);
    }
    setLoadingAgents(false);
  };

  const fetchAgentDocuments = async (userId: string) => {
    const { data } = await (supabase as any)
      .from('agent_documents')
      .select('*')
      .eq('user_id', userId) as any;
    setAgentDocuments(data || []);
  };

  const handleUserClick = async (user: any, roleOverride?: string, roleObj?: AgentRequest) => {
    // If it's a standard user (not an agent), navigate to full details page
    const isAgent = roleOverride?.includes('Agent') || user.role === 'agent' || user.role === 'pending_agent';

    if (!isAgent) {
      window.location.href = `/admin/users/${user.id}`;
      return;
    }

    setSelectedUser({ ...user, role: roleOverride || user.role, wallet: agentWallets[user.id || user.user_id] });
    setSelectedAgentRole(roleObj || null);

    if (isAgent) {
      await fetchAgentDocuments(user.user_id || user.id);

      // If we didn't receive the roleObj (e.g. from Users tab), try to find it
      if (!roleObj && user.role === 'agent') {
        const found = agentRequests.find(ar => ar.user_id === user.id);
        if (found) setSelectedAgentRole(found);
      }
    } else {
      setAgentDocuments([]);
      setSelectedAgentRole(null);
    }
    setIsDetailsOpen(true);
  };

  const handleApprove = async (roleId: string, userId: string) => {
    // 1. Update user_roles
    const { error: roleError } = await supabase.from('user_roles' as any).update({ is_approved: true }).eq('id', roleId);

    if (roleError) {
      toast({ title: "Failed", description: roleError.message, variant: "destructive" });
      return;
    }

    // 2. Update agents table
    const { error: agentError } = await supabase.from('agents' as any).update({ is_approved: true, status: 'active' }).eq('user_id', userId);

    if (agentError) {
      console.error("Failed to update agents table:", agentError);
      // Don't block UI but warn
      toast({ title: "Agent Approved", description: "Role updated, but agents table sync failed." });
    } else {
      // 3. Update profile role to 'agent' just in case
      await supabase.from('profiles' as any).update({ role: 'agent' }).eq('id', userId);

      // Trigger Notification
      const { data: profile } = await supabase.from('profiles').select('email, full_name').eq('id', userId).single();
      if (profile) {
        supabase.functions.invoke('notification-service', {
          body: {
            type: 'agent_approved',
            record: { email: profile.email, fullName: profile.full_name }
          }
        });
      }

      toast({ title: "Agent Approved ✅", description: "User is now an active agent." });
    }

    fetchAgentRequests();
  };

  const handleReject = async (roleId: string, userId: string) => {
    // 1. Delete from user_roles
    const { error } = await supabase.from('user_roles' as any).delete().eq('id', roleId);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }

    // 2. Update agents table to unapproved/rejected
    // We don't verify error here as the agent row might not exist
    await supabase.from('agents' as any).update({ is_approved: false, status: 'rejected' }).eq('user_id', userId);

    toast({ title: "Agent Rejected" });
    fetchAgentRequests();
  };

  const toggleUserActivation = async (userId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const { error } = await supabase
      .from('profiles' as any)
      .update({ is_active: newStatus })
      .eq('id', userId);

    if (error) {
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: newStatus ? "User Activated ✅" : "User Deactivated ⛔" });
      refetch();
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, is_active: newStatus });
      }
    }
  };

  const updateDesignatedStatus = async (value: string) => {
    if (!selectedAgentRole) return;
    const { error } = await supabase
      .from('user_roles')
      .update({ designated_status: value === "none" ? null : value } as any)
      .eq('id', selectedAgentRole.id);

    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Role Updated" });
      setSelectedAgentRole({ ...selectedAgentRole, designated_status: value === "none" ? null : value });
      fetchAgentRequests();
    }
  };

  const updateDesignatedStatusInList = async (value: string, roleId: string) => {
    // Optimistic update
    const previous = agentRequests.find(a => a.id === roleId)?.designated_status;
    setAgentRequests(prev => prev.map(a => a.id === roleId ? { ...a, designated_status: value === "none" ? null : value } : a));

    const { error } = await supabase
      .from('user_roles')
      .update({ designated_status: value === "none" ? null : value } as any)
      .eq('id', roleId);

    if (error) {
      console.error("Role update failed:", error);
      toast({ title: "Failed to update role", description: "Database update failed. Reverting...", variant: "destructive" });
      // Revert optimism
      setAgentRequests(prev => prev.map(a => a.id === roleId ? { ...a, designated_status: previous } : a));
    } else {
      toast({ title: "Job Role Updated", description: "Agent's scanner will update automatically." });
    }
  };

  /* MAKE AGENT functionality */
  const handleMakeAgent = async () => {
    if (!selectedUser) return;

    // 1. Update Profile Role
    const { error: profileError } = await supabase
      .from('profiles' as any)
      .update({ role: 'agent' })
      .eq('id', selectedUser.id);

    if (profileError) {
      toast({ title: "Failed to update profile", description: profileError.message, variant: "destructive" });
      return;
    }

    // 2. Create User Role Entry if not exists
    const { error: roleError } = await supabase
      .from('user_roles' as any)
      .insert({
        user_id: selectedUser.id,
        role: 'agent',
        is_approved: true // Auto-approve if admin makes them agent
      });

    if (roleError && !roleError.message.includes('duplicate')) {
      toast({ title: "Failed to create agent role", description: roleError.message, variant: "destructive" });
    } else {
      toast({ title: "User Promoted to Agent 🎉", description: "They have been moved to the Agents tab." });
      setIsDetailsOpen(false);
      refetch(); // Reload profiles
      fetchAgentRequests(); // Reload agents
      setTab("agents"); // Switch to agents tab
    }
  };

  // Create a Set of Agent IDs for efficient lookup
  const agentIds = new Set(agentRequests.map(a => a.user_id));

  const filtered = profiles.filter(p => {
    // 1. Exclude Admins
    const pAny = p as any;
    if (pAny.role === 'admin' || pAny.role === 'super_admin') return false;

    // 2. Exclude Agents
    // Check if explicitly marked as agent or exists in agent requests (pending or approved)
    if (pAny.role === 'agent' || agentIds.has(p.id)) return false;

    // 3. Exclude System Admin (Safety Check)
    const emailLower = (p.email || '').toLowerCase();
    if (emailLower.includes('shishirmd681')) return false;

    // 4. Exclude anyone with Pending Agent role in profile (edge case)
    if (pAny.role === 'pending_agent') return false;

    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (p.full_name || '').toLowerCase().includes(q) ||
      (p.email || '').toLowerCase().includes(q) ||
      (p.phone || '').toLowerCase().includes(q) ||
      (p.city || '').toLowerCase().includes(q)
    );
  });

  const pendingAgents = agentRequests.filter(a => !a.is_approved);
  const approvedAgents = agentRequests.filter(a => a.is_approved);

  return (
    <div>
      <Seo title="Users & Agents" description="Manage all registered users and agents." />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold font-display">Users & Agents</h1>
        <Button variant="outline" size="sm" onClick={() => { refetch(); fetchAgentRequests(); }}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex bg-muted rounded-xl p-1 mb-6 max-w-xs">
        <button onClick={() => setTab("users")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${tab === "users" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
          <User className="h-4 w-4 inline mr-1" />Users
        </button>
        <button onClick={() => setTab("agents")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all relative ${tab === "agents" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
          <Truck className="h-4 w-4 inline mr-1" />Agents
          {pendingAgents.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">{pendingAgents.length}</span>
          )}
        </button>
      </div>

      {tab === "users" ? (
        <>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name, email, phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-xl mb-6 border border-destructive/20">
              <p className="font-semibold">Error loading users</p>
              <p className="text-sm">{error}</p>
              <p className="text-xs mt-2 text-muted-foreground">Note: If you are not an admin, you may not have permission to view this list.</p>
            </div>
          )}
          {filtered.length === 0 && !loading && (
            <div className="text-center py-12 bg-muted/30 rounded-2xl border-2 border-dashed border-border">
              <p className="text-muted-foreground">No users found.</p>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(p => (
                <div
                  key={p.id}
                  className={`bg-card rounded-2xl border ${(p as any).is_active === false ? 'border-destructive/30 bg-destructive/5' : 'border-border/50'} p-5 hover:shadow-md transition-all cursor-pointer relative group`}
                  onClick={() => handleUserClick(p)}
                >
                  <div className="absolute top-3 right-3 flex gap-2">
                    <Badge variant={(p as any).is_active === false ? "destructive" : "outline"} className="text-[10px]">
                      {(p as any).is_active === false ? "Inactive" : "Active"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{p.full_name || 'Unnamed User'}</p>
                      <p className="text-xs text-muted-foreground">{p.email || '-'}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{p.phone || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">City</span><span>{p.city || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Country</span><span>{p.country || '-'}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {pendingAgents.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                Pending Approval ({pendingAgents.length})
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {pendingAgents.map(a => (
                  <div
                    key={a.id}
                    className="bg-card rounded-2xl border-2 border-yellow-500/30 p-5 relative hover:shadow-md transition-all cursor-pointer"
                    onClick={() => handleUserClick(a.profile, 'Agent (Pending)', a)}
                  >
                    <div className="absolute top-3 right-3">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                        <Truck className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-semibold">{a.profile?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{a.profile?.email || '-'}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">Phone: {a.profile?.phone || '-'}</p>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={(e) => { e.stopPropagation(); handleApprove(a.id, a.user_id); }}>
                        <CheckCircle className="h-4 w-4 mr-1" />Approve
                      </Button>
                      <Button size="sm" variant="destructive" className="flex-1" onClick={(e) => { e.stopPropagation(); handleReject(a.id, a.user_id); }}>
                        <XCircle className="h-4 w-4 mr-1" />Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h2 className="text-lg font-bold mb-3">Approved Agents ({approvedAgents.length})</h2>
          {loadingAgents ? (
            <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
          ) : approvedAgents.length > 0 ? (
            <div className="bg-card rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Job Role</TableHead>
                    <TableHead>Wallet</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedAgents.map(a => (
                    <TableRow key={a.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/agents/${a.user_id}`)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                            <ShieldCheck className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">{a.profile?.full_name}</p>
                            <p className="text-xs text-muted-foreground">{a.profile?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{a.profile?.phone || '-'}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()} className="cursor-default">
                        <Select
                          value={a.designated_status || "none"}
                          onValueChange={(val) => {
                            updateDesignatedStatusInList(val, a.id);
                          }}
                        >
                          <SelectTrigger className="h-8 w-[180px] bg-background">
                            <SelectValue placeholder="Select Role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {statusOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <span className={`font-mono font-bold ${(a as any).wallet?.balance < 0 ? 'text-destructive' : 'text-green-600'}`}>
                          {(a as any).wallet?.currency || 'BDT'} {(a as any).wallet?.balance || '0.00'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{a.profile?.status || "Offline"}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild onClick={(e) => e.stopPropagation()}>
                          <a href={`/admin/agents/${a.user_id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border/50 p-8 text-center text-muted-foreground">
              No agents found
            </div>
          )}
        </>
      )}

      {/* User Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedUser?.role?.includes('Agent') ? <Truck className="h-5 w-5" /> : <User className="h-5 w-5" />}
              {selectedUser?.full_name}
              {selectedUser?.is_active === false && <Badge variant="destructive" className="ml-2">Inactive</Badge>}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.role || "User Details"}
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Profile Info</TabsTrigger>
                <TabsTrigger value="documents" disabled={!selectedUser.role?.includes('Agent')}>Documents</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-muted-foreground">Full Name</h4>
                    <p className="font-medium">{selectedUser.full_name || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-muted-foreground">Email</h4>
                    <p className="font-medium">{selectedUser.email || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-muted-foreground">Phone</h4>
                    <p className="font-medium">{selectedUser.phone || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant={selectedUser.is_active !== false ? "default" : "secondary"}>
                        {selectedUser.is_active !== false ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-muted-foreground">Country</h4>
                    <p className="font-medium">{selectedUser.country || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-muted-foreground">City</h4>
                    <p className="font-medium">{selectedUser.city || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-muted-foreground">Role</h4>
                    <Badge variant={selectedUser.role?.includes('Pending') ? "destructive" : "secondary"}>
                      {selectedUser.role || "User"}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-muted-foreground">Joined</h4>
                    <p className="font-medium">{selectedUser.created_at ? format(new Date(selectedUser.created_at), "PPP") : "N/A"}</p>
                  </div>
                </div>

                {/* JOB ASSIGNMENT FOR AGENTS */}
                {selectedUser.role?.includes('Agent') && selectedAgentRole && (
                  <div className="pt-4 mt-4 border-t">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2"><Briefcase className="h-4 w-4" /> Assigned Job Role</h4>
                    <p className="text-xs text-muted-foreground mb-3">Select the dedicated function for this agent. Their scanner will automatically apply this status.</p>

                    <Select
                      value={selectedAgentRole.designated_status || "none"}
                      onValueChange={updateDesignatedStatus}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="No specific role assigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No specific role (Manual Select)</SelectItem>
                        {statusOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="pt-4 mt-4 border-t">
                  <h4 className="text-sm font-medium mb-3">Account Actions</h4>
                  <div className="flex flex-col gap-2">
                    {!selectedUser.role?.includes('Agent') && (
                      <Button
                        variant="secondary"
                        className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
                        onClick={handleMakeAgent}
                      >
                        <ShieldCheck className="h-4 w-4 mr-2" /> Promote to Agent
                      </Button>
                    )}

                    <Button
                      variant={selectedUser.is_active !== false ? "destructive" : "default"}
                      className="w-full"
                      onClick={() => toggleUserActivation(selectedUser.id, selectedUser.is_active !== false)}
                    >
                      {selectedUser.is_active !== false ? (
                        <><Ban className="h-4 w-4 mr-2" /> Deactivate Account</>
                      ) : (
                        <><CheckCircle className="h-4 w-4 mr-2" /> Activate Account</>
                      )}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="py-4">
                {agentDocuments.length > 0 ? (
                  <div className="space-y-4">
                    {agentDocuments.map((doc, i) => (
                      <div key={doc.id || i} className="flex items-center justify-between p-4 bg-muted/40 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-full">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium capitalize">{doc.document_type.replace('_', ' ')}</p>
                            <p className="text-xs text-muted-foreground">Uploaded on {new Date(doc.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => window.open(doc.document_url, '_blank')}>
                          <Download className="h-4 w-4 mr-2" /> View
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border-2 border-dashed">
                    No documents uploaded by this agent.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
