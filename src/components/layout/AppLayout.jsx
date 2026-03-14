import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, BookOpen, FlaskConical, Bot, Menu, X, Zap, MessageSquareMore } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/Dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/Domains", label: "Domains", icon: FlaskConical },
  { path: "/Dictionary", label: "Dictionary", icon: BookOpen },
  { path: "/Agents", label: "Agents", icon: Bot },
  { path: "/Mission", label: "Team Mission", icon: Zap },
  { path: "/TeamCommunication", label: "Team Communication", icon: MessageSquareMore },
];

export default function AppLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card/50 backdrop-blur-sm">
        <div className="p-6 border-b border-border">
          <Link to="/Dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground tracking-tight">ChemLang</h1>
              <p className="text-xs text-muted-foreground">Chemistry → Math → Code</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                location.pathname === item.path
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="px-3 py-2 rounded-lg bg-secondary/30 border border-border">
            <p className="text-xs text-muted-foreground">Translating chemistry into<br/>computable mathematics</p>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Link to="/Dashboard" className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold">ChemLang</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
        {mobileOpen && (
          <nav className="p-4 pt-0 space-y-1 border-t border-border">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                  location.pathname === item.path
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>

      {/* Main content */}
      <main className="flex-1 md:overflow-y-auto">
        <div className="pt-16 md:pt-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}