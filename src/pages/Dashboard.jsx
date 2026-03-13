import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import StatsRow from "../components/dashboard/StatsRow";
import DomainCard from "../components/dashboard/DomainCard";
import GraphView from "../components/dashboard/GraphView";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [tab, setTab] = useState("overview");
  const { data: domains = [], isLoading: domainsLoading } = useQuery({
    queryKey: ["domains"],
    queryFn: () => base44.entities.DomainDefinition.list(),
  });

  const { data: entries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ["dictionary"],
    queryFn: () => base44.entities.MathDictionary.list(),
  });

  const isLoading = domainsLoading || entriesLoading;

  const codeEntries = entries.filter(e => e.code_representation).length;
  const translatedEntries = entries.filter(e => e.natural_language && e.math_formalism && e.code_representation).length;

  const getEntryCount = (domainKey) => entries.filter(e => e.domain === domainKey).length;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
      {/* Hero */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Chem<span className="text-primary">Lang</span>
        </h1>
        <p className="text-muted-foreground max-w-xl">
          A multilingual dictionary translating chemistry into mathematical formalisms,
          computable code, and natural language — domain by domain.
        </p>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-2">
        <Button size="sm" variant={tab === "overview" ? "default" : "outline"} onClick={() => setTab("overview")}>Overview</Button>
        <Button size="sm" variant={tab === "graph" ? "default" : "outline"} onClick={() => setTab("graph")}>Graph View</Button>
      </div>

      {tab === "graph" && <GraphView entries={entries} />}

      {tab === "overview" && <>
        {/* Stats */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
        ) : (
          <StatsRow
            totalEntries={entries.length}
            domainCount={domains.length}
            codeEntries={codeEntries}
            translatedEntries={translatedEntries}
          />
        )}

        {/* Domains Grid */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Research Domains</h2>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {domains.map(d => (
                <DomainCard key={d.id} domain={d} entryCount={getEntryCount(d.domain_key)} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Entries */}
        {entries.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Recent Dictionary Entries</h2>
            <div className="space-y-3">
              {entries.slice(0, 5).map(entry => (
                <div key={entry.id} className="rounded-xl border border-border/50 bg-card/30 p-4 flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{entry.concept_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{entry.domain?.replace(/_/g, ' ')}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground capitalize">{entry.status || 'draft'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </>}
    </div>
  );
}