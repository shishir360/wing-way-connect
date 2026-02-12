import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAgent } from "@/hooks/useAgent";
import { Truck, Package, ScanLine, LayoutDashboard, ArrowLeft, LogOut, User, QrCode } from "lucide-react";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

const agentNav = [
  { name: "Dashboard", href: "/agent", icon: LayoutDashboard },
  { name: "Scan", href: "/agent/scan", icon: QrCode },
  { name: "My Jobs", href: "/agent/shipments", icon: Package },
  { name: "Profile", href: "/agent/profile", icon: User },
];

export default function AgentLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAgent, isApproved, loading: agentLoading } = useAgent();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !agentLoading) {
      if (!user) navigate("/agent/login");
      else if (!isAgent || !isApproved) navigate("/agent/login");
      else fetchProfile();
    }
  }, [user, isAgent, isApproved, authLoading, agentLoading, navigate]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) setProfile(data);
  };

  // Global Real-time Listener for Job Role updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`agent-role-monitor-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_roles',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newStatus = payload.new.designated_status;
          const oldStatus = payload.old.designated_status;

          if (newStatus !== oldStatus) {
            const roleLabel = newStatus ? newStatus.replace('_', ' ').toUpperCase() : 'MANUAL SCANNER';
            toast.success("Job Role Updated! 🔔", {
              description: `Admin assigned you to: ${roleLabel}`,
              duration: 6000,
            });
            // Haptic/Sound cue if supported
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (authLoading || agentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAgent || !isApproved) return null;

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  return (
    <div className="min-h-screen flex bg-secondary/30">
      <Seo title="Agent Dashboard" description="Agent Dashboard - Wing Way Connect" />

      {/* Desktop Sidebar */}
      <aside className="w-64 bg-card border-r border-border hidden lg:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Truck className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg font-bold text-primary font-display">WACC</span>
              <p className="text-[10px] text-muted-foreground">Agent Panel</p>
            </div>
          </Link>
        </div>

        {/* User Profile Summary in Sidebar */}
        <div className="px-4 py-6 text-center border-b border-border/50">
          <Avatar className="w-16 h-16 mx-auto mb-3 border-2 border-primary/20">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
              {profile?.full_name?.substring(0, 2).toUpperCase() || 'AG'}
            </AvatarFallback>
          </Avatar>
          <h3 className="font-bold text-sm truncate px-2">{profile?.full_name || 'Agent'}</h3>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {agentNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link key={item.name} to={item.href} className={cn("flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all", isActive ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                <Icon className="h-5 w-5" />{item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border space-y-2 mt-auto">
          <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
            <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" />Back to Home</Link>
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />Logout
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen bg-gray-50/50 dark:bg-gray-900/50">

        {/* Mobile Top Header (Enhanced) */}
        <header className="lg:hidden bg-card/80 backdrop-blur-md border-b border-border p-4 sticky top-0 z-30 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9 border border-primary/20">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {profile?.full_name?.substring(0, 2).toUpperCase() || 'AG'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider leading-none mb-0.5">Welcome</p>
              <p className="font-bold text-sm leading-none truncate max-w-[150px]">{profile?.full_name?.split(' ')[0] || 'Agent'}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-muted-foreground hover:text-destructive active:bg-destructive/10">
            <LogOut className="h-5 w-5" />
          </Button>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto pb-24 lg:pb-8">
          <Outlet context={{ profile }} />
        </main>

        {/* Mobile Bottom Navigation (Improved) */}
        <nav className="lg:hidden fixed bottom-6 left-4 right-4 bg-card/90 backdrop-blur-lg border border-white/20 shadow-xl rounded-2xl flex justify-between items-center z-40 px-6 py-2">
          {agentNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 transition-all duration-300 relative w-16 py-2",
                  isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground opacity-70"
                )}
              >
                <div className={cn(
                  "p-2 rounded-xl transition-all",
                  isActive ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-transparent"
                )}>
                  <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-current")} />
                </div>
                {/* <span className={cn("text-[10px] font-bold transition-all", isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 hidden")}>{item.name}</span> */}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
