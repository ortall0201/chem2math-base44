import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, BookOpen, Terminal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import CodePlayground from "@/components/dictionary/CodePlayground";
import SemanticSearch from "@/components/dictionary/SemanticSearch";

const domainLabels = {
  electrochemistry: "Electrochemistry",
  thermochemistry: "Thermochemistry",
  kinetics: "Kinetics",
  organic_chemistry: "Organic Chemistry",
  quantum_chemistry: "Quantum Chemistry",
  stoichiometry: "Stoichiometry"
};

const domainColors = {
  electrochemistry: "#0ea5e9",
  thermochemistry: "#f97316",
  kinetics: "#22c55e",
  organic_chemistry: "#a855f7",
  quantum_chemistry: "#ec4899",
  stoichiometry: "#eab308"
};

export default function Dictionary() {
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [mode, setMode] = useState("keyword"); // "keyword" | "semantic"
  const [semanticResults, setSemanticResults] = useState(null);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["dictionary"],
    queryFn: () => base44.entities.MathDictionary.list(),
  });

  const filtered = useMemo(() => {
    return entries.filter(e => {
      const matchSearch = !search ||
        e.concept_name?.toLowerCase().includes(search.toLowerCase()) ||
        e.math_formalism?.toLowerCase().includes(search.toLowerCase()) ||
        e.natural_language?.toLowerCase().includes(search.toLowerCase());
      const matchDomain = domainFilter === "all" || e.domain === domainFilter;
      const matchStatus = statusFilter === "all" || e.status === statusFilter;
      return matchSearch && matchDomain && matchStatus;
    });
  }, [entries, search, domainFilter, statusFilter]);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Math Dictionary</h1>
        <Badge variant="outline" className="ml-2 font-mono">{entries.length} entries</Badge>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <Button
          size="sm" variant={mode === "keyword" ? "default" : "outline"}
          onClick={() => { setMode("keyword"); setSemanticResults(null); }}
          className="gap-1.5"
        >
          <Search className="w-3.5 h-3.5" /> Keyword
        </Button>
        <Button
          size="sm" variant={mode === "semantic" ? "default" : "outline"}
          onClick={() => setMode("semantic")}
          className="gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" /> Semantic
        </Button>
      </div>

      {/* Semantic search */}
      {mode === "semantic" && (
        <SemanticSearch onResults={setSemanticResults} />
      )}

      {/* Filters */}
      {mode === "keyword" && <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search concepts, equations, code..."
            className="pl-9 bg-card/50"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={domainFilter} onValueChange={setDomainFilter}>
          <SelectTrigger className="w-48 bg-card/50">
            <SelectValue placeholder="All Domains" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Domains</SelectItem>
            {Object.entries(domainLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-card/50">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="validated">Validated</SelectItem>
            <SelectItem value="needs_revision">Needs Revision</SelectItem>
          </SelectContent>
        </Select>
      </div>}

      {/* Results */}
      {mode === "semantic" && semanticResults !== null && (
        semanticResults.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-sm">No matching entries found.</div>
        ) : (
          <div className="space-y-3">
            {semanticResults.map(entry => (
              <DictEntryRow key={entry.id} entry={entry} score={entry.score} />
            ))}
          </div>
        )
      )}

      {mode === "keyword" && (
        isLoading ? (
          <div className="text-center py-20 text-muted-foreground text-sm">Loading dictionary...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {entries.length === 0 ? "Dictionary is empty. Use the domain agents to start building it." : "No entries match your filters."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(entry => (
              <DictEntryRow key={entry.id} entry={entry} />
            ))}
          </div>
        )
      )}
    </div>
  );
}

function DictEntryRow({ entry }) {
  const [open, setOpen] = useState(false);
  const [playgroundOpen, setPlaygroundOpen] = useState(false);
  const color = domainColors[entry.domain] || "#0ea5e9";

  return (
    <Card
      className="bg-card/40 border-border/40 hover:border-border transition-colors cursor-pointer"
      onClick={() => setOpen(!open)}
    >
      <div className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="font-medium text-sm">{entry.concept_name}</span>
          <Badge variant="outline" className="text-xs" style={{ borderColor: `${color}40`, color }}>
            {domainLabels[entry.domain] || entry.domain}
          </Badge>
          <Badge variant="outline" className="text-xs capitalize ml-auto">{entry.status || "draft"}</Badge>
          {entry.code_representation && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-xs gap-1 text-primary hover:text-primary hover:bg-primary/10"
              onClick={e => { e.stopPropagation(); setOpen(true); setPlaygroundOpen(p => !p); }}
            >
              <Terminal className="w-3 h-3" />
              {playgroundOpen ? "Close" : "Run"}
            </Button>
          )}
        </div>

        {open && (
          <div className="mt-4 space-y-3 text-xs border-t border-border/30 pt-4">
            {entry.chemistry_notation && (
              <div><span className="text-muted-foreground">Chemistry: </span><span className="font-mono">{entry.chemistry_notation}</span></div>
            )}
            {entry.math_formalism && (
              <div>
                <span className="text-muted-foreground block mb-1">Math Formalism:</span>
                <div className="font-mono bg-secondary/30 p-3 rounded-lg border border-border/30 whitespace-pre-wrap">{entry.math_formalism}</div>
              </div>
            )}
            {entry.code_representation && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-muted-foreground">Code:</span>
                  {!playgroundOpen && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-5 px-2 text-xs gap-1 text-primary hover:bg-primary/10"
                      onClick={e => { e.stopPropagation(); setPlaygroundOpen(true); }}
                    >
                      <Terminal className="w-3 h-3" /> Open Playground
                    </Button>
                  )}
                </div>
                <pre className="font-mono bg-secondary/50 p-3 rounded-lg border border-border/30 overflow-x-auto">{entry.code_representation}</pre>
                {playgroundOpen && (
                  <CodePlayground
                    initialCode={entry.code_representation}
                    onClose={() => setPlaygroundOpen(false)}
                  />
                )}
              </div>
            )}
            {entry.natural_language && (
              <div><span className="text-muted-foreground">Natural Language: </span><span className="text-secondary-foreground">{entry.natural_language}</span></div>
            )}
            {entry.prediction_potential && (
              <div><span className="text-muted-foreground">Prediction: </span><span className="text-chart-2">{entry.prediction_potential}</span></div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}