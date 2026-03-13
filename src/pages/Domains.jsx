import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Atom } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function Domains() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialDomain = urlParams.get("domain");
  const [selectedDomain, setSelectedDomain] = useState(initialDomain);

  const { data: domains = [] } = useQuery({
    queryKey: ["domains"],
    queryFn: () => base44.entities.DomainDefinition.list(),
  });

  const { data: entries = [] } = useQuery({
    queryKey: ["dictionary"],
    queryFn: () => base44.entities.MathDictionary.list(),
  });

  const domain = domains.find(d => d.domain_key === selectedDomain);
  const domainEntries = useMemo(
    () => entries.filter(e => e.domain === selectedDomain),
    [entries, selectedDomain]
  );

  if (!selectedDomain || !domain) {
    return (
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">All Domains</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {domains.map(d => (
            <Card
              key={d.id}
              className="p-5 cursor-pointer hover:border-primary/30 transition-all bg-card/50"
              onClick={() => setSelectedDomain(d.domain_key)}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                  style={{ backgroundColor: `${d.color_accent || '#0ea5e9'}15`, color: d.color_accent }}
                >
                  {d.display_name?.[0]}
                </div>
                <h3 className="font-semibold text-sm">{d.display_name}</h3>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{d.description}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {d.core_math_branches?.slice(0, 3).map(b => (
                  <Badge key={b} variant="outline" className="text-xs">{b}</Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" onClick={() => setSelectedDomain(null)} className="mb-4 text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" /> All Domains
        </Button>
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold"
            style={{ backgroundColor: `${domain.color_accent || '#0ea5e9'}15`, color: domain.color_accent }}
          >
            {domain.display_name?.[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{domain.display_name}</h1>
            <p className="text-sm text-muted-foreground">{domain.description}</p>
          </div>
        </div>
      </div>

      {/* Math branches */}
      {domain.core_math_branches?.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Core Math Branches</h3>
          <div className="flex flex-wrap gap-2">
            {domain.core_math_branches.map(b => (
              <Badge key={b} variant="outline" className="bg-primary/5 border-primary/20 text-primary">{b}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Key equations */}
      {domain.key_equations?.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Key Equations</h3>
          <div className="space-y-2">
            {domain.key_equations.map((eq, i) => (
              <div key={i} className="font-mono text-sm bg-secondary/30 rounded-lg px-4 py-2 border border-border/50">
                {eq}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dictionary entries */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Dictionary Entries ({domainEntries.length})</h3>
        </div>
        {domainEntries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center">
            <Atom className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No entries yet for this domain.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Use the domain's AI agent to start building the math dictionary.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {domainEntries.map(entry => (
              <EntryCard key={entry.id} entry={entry} color={domain.color_accent} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EntryCard({ entry, color }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card
      className={cn(
        "bg-card/50 border-border/50 overflow-hidden cursor-pointer transition-all",
        expanded && "border-primary/20"
      )}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-semibold text-sm">{entry.concept_name}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">{entry.chemistry_notation}</p>
          </div>
          <Badge variant="outline" className="text-xs capitalize">{entry.status || 'draft'}</Badge>
        </div>

        {expanded && (
          <div className="mt-5 space-y-4 text-sm">
            {entry.math_formalism && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Math Formalism</p>
                <div className="font-mono text-xs bg-secondary/30 rounded-lg p-3 border border-border/50 whitespace-pre-wrap">
                  {entry.math_formalism}
                </div>
              </div>
            )}
            {entry.code_representation && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Code</p>
                <pre className="font-mono text-xs bg-secondary/50 rounded-lg p-3 border border-border/50 overflow-x-auto">
                  {entry.code_representation}
                </pre>
              </div>
            )}
            {entry.natural_language && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Natural Language</p>
                <p className="text-muted-foreground text-xs leading-relaxed">{entry.natural_language}</p>
              </div>
            )}
            {entry.variables?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Variables</p>
                <div className="grid grid-cols-2 gap-2">
                  {entry.variables.map((v, i) => (
                    <div key={i} className="text-xs bg-secondary/20 rounded-lg px-3 py-2 border border-border/30">
                      <span className="font-mono font-semibold" style={{ color }}>{v.symbol}</span>
                      <span className="text-muted-foreground ml-2">{v.meaning}</span>
                      {v.unit && <span className="text-muted-foreground/60 ml-1">({v.unit})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {entry.prediction_potential && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Prediction Potential</p>
                <p className="text-xs text-chart-2 leading-relaxed">{entry.prediction_potential}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}