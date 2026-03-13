import React from "react";
import { BookOpen, FlaskConical, Code, Languages } from "lucide-react";

export default function StatsRow({ totalEntries, domainCount, codeEntries, translatedEntries }) {
  const stats = [
    { label: "Dictionary Entries", value: totalEntries, icon: BookOpen, color: "text-primary" },
    { label: "Active Domains", value: domainCount, icon: FlaskConical, color: "text-chart-2" },
    { label: "With Code", value: codeEntries, icon: Code, color: "text-chart-3" },
    { label: "Fully Translated", value: translatedEntries, icon: Languages, color: "text-chart-4" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map(stat => (
        <div
          key={stat.label}
          className="relative overflow-hidden rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
          <p className="text-3xl font-bold font-mono tracking-tight text-foreground">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}