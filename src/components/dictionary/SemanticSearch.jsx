import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const domainLabels = {
  electrochemistry: "Electrochemistry",
  thermochemistry: "Thermochemistry",
  kinetics: "Kinetics",
  organic_chemistry: "Organic Chemistry",
  quantum_chemistry: "Quantum Chemistry",
  stoichiometry: "Stoichiometry",
};

const domainColors = {
  electrochemistry: "#0ea5e9",
  thermochemistry: "#f97316",
  kinetics: "#22c55e",
  organic_chemistry: "#a855f7",
  quantum_chemistry: "#ec4899",
  stoichiometry: "#eab308",
};

export default function SemanticSearch({ onResults }) {
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("all");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [totalSearched, setTotalSearched] = useState(0);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    const resp = await base44.functions.invoke("semanticSearch", { query: query.trim(), top_k: 12, domain });
    setLoading(false);
    setSearched(true);
    setTotalSearched(resp.data.total_searched || 0);
    onResults(resp.data.results || []);
  };

  const handleKey = (e) => {
    if (e.key === "Enter") search();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 p-3 rounded-xl border border-primary/20 bg-primary/5">
        <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="text-xs text-primary font-medium">Semantic Search — find conceptually related entries across all domains</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="e.g. 'energy minimization', 'electron transfer rate'..."
            className="pl-9 bg-card/50"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
          />
        </div>
        <Select value={domain} onValueChange={setDomain}>
          <SelectTrigger className="w-44 bg-card/50">
            <SelectValue placeholder="All Domains" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Domains</SelectItem>
            {Object.entries(domainLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={search} disabled={!query.trim() || loading} className="gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Search
        </Button>
      </div>
      {searched && !loading && (
        <p className="text-xs text-muted-foreground">
          Searched {totalSearched} embedded entries — showing top results by semantic similarity
        </p>
      )}
    </div>
  );
}