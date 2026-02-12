import { useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAgent } from "@/hooks/useAgent";
import { Truck, Package, ScanLine, LayoutDashboard, ArrowLeft, LogOut } from "lucide-react";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const agentNav = [
  { name: "Dashboard", href: "/agent", icon: LayoutDashboard },
  { name: "Shipments", href: "/agent/shipments", icon: Package },
  { name: "QR Scan", href: "/agent/scan", icon: ScanLine },
];

export default function AgentLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, signOut } = useAuth();
  const { isAgent, isApproved, loading: agentLoading } = useAgent();

  useEffect(() => {
    if (!authLoading && !agentLoading) {
      if (!user) navigate("/agent/login");
      else if (!isAgent || !isApproved) navigate("/agent/login");
    }
  }, [user, isAgent, isApproved, authLoading, agentLoading, navigate]);

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
      <aside className="w-64 bg-card border-r border-border hidden lg:flex flex-col">
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
        <nav className="flex-1 p-4 space-y-1">
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
        <div className="p-4 border-t border-border space-y-2">
          <Button variant="ghost" size="sm" className="w-full justify-start" asChild>
            <Link to="/"><ArrowLeft className="h-4 w-4 mr-2" />Back to Home</Link>
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start text-destructive" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />Logout
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="lg:hidden bg-card border-b border-border p-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Truck className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-primary font-display">Agent</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={handleSignOut}><LogOut className="h-4 w-4" /></Button>
        </header>
        <nav className="lg:hidden bg-card border-b border-border px-4 py-2 flex gap-1 overflow-x-auto scrollbar-hide">
          {agentNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link key={item.name} to={item.href} className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all", isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}>
                <Icon className="h-4 w-4" />{item.name}
              </Link>
            );
          })}
        </nav>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto"><Outlet /></main>
      </div>
    </div>
  );
}
