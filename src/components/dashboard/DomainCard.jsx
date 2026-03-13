import React from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const statusLabels = {
  not_started: "Not Started",
  in_progress: "In Progress",
  foundational_complete: "Foundation Done",
  advanced: "Advanced"
};

const statusColors = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  foundational_complete: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  advanced: "bg-primary/10 text-primary border-primary/20"
};

export default function DomainCard({ domain, entryCount = 0 }) {
  return (
    <Link to={`/Domains?domain=${domain.domain_key}`}>
      <Card className={cn(
        "group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm",
        "hover:border-primary/30 hover:bg-card/80 transition-all duration-300 cursor-pointer"
      )}>
        <div
          className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity"
          style={{ background: `radial-gradient(circle at 80% 20%, ${domain.color_accent || '#0ea5e9'}, transparent 60%)` }}
        />
        <div className="relative p-6">
          <div className="flex items-start justify-between mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
              style={{ backgroundColor: `${domain.color_accent || '#0ea5e9'}15`, color: domain.color_accent || '#0ea5e9' }}
            >
              {domain.display_name?.[0] || "?"}
            </div>
            <Badge variant="outline" className={cn("text-xs", statusColors[domain.research_status || 'not_started'])}>
              {statusLabels[domain.research_status || 'not_started']}
            </Badge>
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
            {domain.display_name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
            {domain.description || "No description yet"}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              <span className="font-mono text-foreground">{entryCount}</span> dictionary entries
            </span>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </Card>
    </Link>
  );
}