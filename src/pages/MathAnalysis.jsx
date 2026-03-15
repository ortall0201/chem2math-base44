import React, { useState, useRef } from "react";
import { localAgents } from "@/api/localAgentsClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FlaskConical, BrainCircuit, Telescope, BarChart3 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

const DOMAIN_COLORS = {
  electrochemistry:      "#0ea5e9",
  thermochemistry:       "#f97316",
  kinetics:              "#22c55e",
  organic_chemistry:     "#a855f7",
  quantum_chemistry:     "#ec4899",
  stoichiometry:         "#eab308",
  synthesis:             "#94a3b8",
};

export default function MathAnalysis() {
  const [running, setRunning]   = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState(null);
  const [stats, setStats]       = useState(null);
  const [output, setOutput]     = useState("");
  const outputRef = useRef(null);

  async function runAnalysis() {
    setRunning(true);
    setDone(false);
    setError(null);
    setStats(null);
    setOutput("");

    try {
      await localAgents.analyzeDict({
        onStats: (event) => setStats(event),
        onAgentStart: () => {},
        onChunk: (text) => {
          setOutput(prev => prev + text);
          setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), 50);
        },
        onDone: () => { setDone(true); setRunning(false); },
        onError: (msg) => { setError(msg); setRunning(false); },
      });
    } catch (e) {
      setError(e.message);
      setRunning(false);
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Telescope className="w-6 h-6 text-primary" />
          Math Analysis Engine
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Reads the full Math Dictionary, computes cross-domain semantic similarity from embeddings,
          extracts the recurring mathematical operators and equation archetypes, and builds the
          formal grammar that maps chemistry language to mathematical structure — the foundation
          layer for future NLP training.
        </p>
        <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
          <BrainCircuit className="w-3.5 h-3.5" />
          Powered by Turing — mathematical linguist and data scientist
        </div>
      </div>

      {/* Stats (pre-run or post-stats) */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total entries" value={stats.total_entries} color="#0ea5e9" />
          <StatCard label="Embedded" value={`${stats.embedded} / ${stats.total_entries}`} color="#22c55e" />
          <StatCard label="Cross-domain links" value={stats.cross_domain_pairs_found} color="#a855f7" />
          <StatCard label="Domains" value={Object.keys(stats.by_domain || {}).length} color="#f97316" />
        </div>
      )}

      {stats?.by_domain && (
        <Card className="p-4 bg-card/50 border-border/50">
          <p className="text-xs font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            Entries by domain
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.by_domain).map(([domain, count]) => (
              <div
                key={domain}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                style={{
                  backgroundColor: `${DOMAIN_COLORS[domain] || "#64748b"}15`,
                  borderColor: `${DOMAIN_COLORS[domain] || "#64748b"}40`,
                  color: DOMAIN_COLORS[domain] || "#64748b",
                }}
              >
                {domain.replace("_", " ")}
                <span className="opacity-70">({count})</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Run button */}
      {!running && !done && (
        <div className="space-y-3">
          <Button onClick={runAnalysis} size="lg" className="gap-2">
            <Telescope className="w-4 h-4" />
            Analyze Math Dictionary
          </Button>
          <p className="text-xs text-muted-foreground">
            Turing will read every entry, compute similarity clusters from embeddings, and extract
            the formal grammar of chemistry-math translation. Requires at least a few dictionary entries
            — run some agent sessions or a Team Mission first.
          </p>
        </div>
      )}

      {running && !stats && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading dictionary and computing similarity clusters...
        </div>
      )}

      {/* Analysis output */}
      {output && (
        <Card className="p-5 bg-card/50 border-border/50 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                T
              </div>
              <div>
                <p className="text-xs font-semibold">Turing</p>
                <p className="text-[10px] text-muted-foreground">Mathematical Linguist</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {running && (
                <span className="flex items-center gap-1 text-[10px] text-primary">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Analyzing...
                </span>
              )}
              {done && (
                <Badge variant="outline" className="text-[10px] text-green-500 border-green-500/40">
                  Complete
                </Badge>
              )}
            </div>
          </div>
          <div className="prose prose-invert prose-sm max-w-none text-sm leading-relaxed">
            <ReactMarkdown
              components={{
                h2: ({ children }) => {
                  const text = String(children);
                  const colors = ["#0ea5e9","#f97316","#22c55e","#a855f7","#ec4899","#eab308"];
                  const idx = text.charCodeAt(0) % colors.length;
                  return <h2 className="text-sm font-bold mt-5 mb-2 pb-1 border-b border-border/50" style={{ color: colors[idx] }}>{children}</h2>;
                },
                h3: ({ children }) => <h3 className="text-sm font-semibold mt-3 mb-1 text-foreground/90">{children}</h3>,
                code: ({ inline, children }) =>
                  inline
                    ? <code className="px-1 py-0.5 rounded bg-secondary/60 text-primary font-mono text-xs">{children}</code>
                    : <pre className="p-3 rounded-lg bg-secondary/40 overflow-x-auto text-xs font-mono my-2 border border-border/30"><code>{children}</code></pre>,
                p: ({ children }) => <p className="text-sm text-foreground/80 leading-relaxed mb-2">{children}</p>,
                ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 text-sm text-foreground/80 mb-2">{children}</ul>,
                li: ({ children }) => <li className="text-sm">{children}</li>,
                table: ({ children }) => (
                  <div className="overflow-x-auto my-3">
                    <table className="text-xs w-full border-collapse border border-border/40">{children}</table>
                  </div>
                ),
                th: ({ children }) => <th className="border border-border/40 px-2 py-1 bg-secondary/50 text-left font-semibold">{children}</th>,
                td: ({ children }) => <td className="border border-border/40 px-2 py-1">{children}</td>,
              }}
            >
              {output}
            </ReactMarkdown>
          </div>
          <div ref={outputRef} />
        </Card>
      )}

      {error && (
        <Card className="p-4 border-destructive/40 bg-destructive/5">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={runAnalysis}>
            Retry
          </Button>
        </Card>
      )}

      {done && (
        <Button variant="outline" onClick={runAnalysis} className="gap-2">
          <Telescope className="w-4 h-4" />
          Run Again
        </Button>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <Card className="p-3 bg-card/50 border-border/50">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold mt-0.5" style={{ color }}>{value}</p>
    </Card>
  );
}
