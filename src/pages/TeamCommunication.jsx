import React, { useState, useRef, useEffect } from "react";
import { localAgents } from "@/api/localAgentsClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Loader2, Send, MessageSquareMore, ChevronDown, ChevronUp, Sparkles, BookOpen, BrainCircuit, Database, CheckCircle2, XCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

const AGENT_META = {
  electrochemistry_researcher: { codename: "Faraday", domain: "Electrochemistry", color: "#0ea5e9" },
  thermochemistry_researcher:  { codename: "Carnot",  domain: "Thermochemistry",  color: "#f97316" },
  kinetics_researcher:         { codename: "Arrhenius", domain: "Kinetics",       color: "#22c55e" },
  organic_chemistry_researcher:{ codename: "Kekulé",  domain: "Organic Chemistry",color: "#a855f7" },
  quantum_chemistry_researcher:{ codename: "Bohr",    domain: "Quantum Chemistry",color: "#ec4899" },
  stoichiometry_researcher:    { codename: "Lavoisier",domain: "Stoichiometry",   color: "#eab308" },
  synthesis_agent:             { codename: "Maxwell", domain: "Multi-Domain Synthesis", color: "#94a3b8" },
};

const STARTER_PROMPTS = [
  "A shared exhaust header mixes gases from multiple industrial machines. Can mixing cause reactions, deposits, or corrosion?",
  "What is 'equilibrium' and how is it expressed mathematically across all chemistry domains?",
  "How does energy appear, transform, and conserve across all six chemistry domains?",
  "Find all the places where a differential equation governs a chemistry concept.",
];

const ROUND_META = {
  1: { label: "Round 1 — Domain Experts", description: "Each agent independently formalizes the concept in their domain.", color: "#0ea5e9" },
  2: { label: "Round 2 — Cross-Domain Debate", description: "Each agent reads all colleagues and finds mathematical bridges.", color: "#a855f7" },
  3: { label: "Round 3 — Maxwell Synthesizes", description: "Maxwell reads the full debate and produces a unified mathematical framework.", color: "#94a3b8" },
  4: { label: "Round 4 — Decision Model", description: "Converts the scientific debate into a machine-operable engineering decision framework.", color: "#22c55e" },
};

function AgentCard({ agentKey, agentData, isActive }) {
  const [expanded, setExpanded] = useState(true);
  const meta = AGENT_META[agentKey] || { codename: agentKey, domain: "", color: "#64748b" };
  const isMaxwell = agentKey === "synthesis_agent";

  useEffect(() => {
    if (agentData.done && !isMaxwell) setExpanded(false);
  }, [agentData.done]);

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-300",
        isActive && "border-primary/40",
        agentData.done && !isMaxwell && "border-border/30",
        isMaxwell && "border-2"
      )}
      style={isMaxwell ? { borderColor: `${meta.color}40` } : {}}
    >
      <div
        className={cn("flex items-center justify-between p-3 cursor-pointer", isMaxwell ? "bg-secondary/30" : "bg-card/40")}
        onClick={() => agentData.text && setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
          >
            {meta.codename[0]}
          </div>
          <div>
            <p className="text-xs font-semibold">{meta.codename}</p>
            <p className="text-[10px] text-muted-foreground">{meta.domain}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {agentData.entries?.length > 0 && (
            <Badge variant="outline" className="text-[10px] font-mono" style={{ color: meta.color, borderColor: `${meta.color}40` }}>
              +{agentData.entries.length} saved
            </Badge>
          )}
          {isActive && (
            <span className="flex items-center gap-1 text-[10px]" style={{ color: meta.color }}>
              <Loader2 className="w-3 h-3 animate-spin" />
              Thinking...
            </span>
          )}
          {agentData.done && (
            <span className="text-[10px] text-muted-foreground">Done</span>
          )}
          {agentData.text && (expanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />)}
        </div>
      </div>

      {expanded && agentData.text && (
        <div className="px-4 pb-4 pt-2 border-t border-border/20">
          <div className="text-xs leading-relaxed text-secondary-foreground prose prose-sm prose-invert max-w-none">
            <ReactMarkdown
              components={{
                code: ({ inline, children }) =>
                  inline
                    ? <code className="px-1 py-0.5 rounded bg-secondary text-secondary-foreground font-mono text-xs">{children}</code>
                    : <pre className="bg-secondary/50 rounded-lg p-3 border border-border/30 overflow-x-auto font-mono text-xs mt-2"><code>{children}</code></pre>,
                p: ({ children }) => <p className="my-1.5">{children}</p>,
                h3: ({ children }) => <h3 className="text-sm font-semibold mt-3 mb-1" style={{ color: meta.color }}>{children}</h3>,
                ul: ({ children }) => <ul className="ml-4 list-disc space-y-0.5">{children}</ul>,
              }}
            >
              {agentData.text}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {isActive && !agentData.text && (
        <div className="px-4 pb-3 pt-2 border-t border-border/20">
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ backgroundColor: meta.color, animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function DataFetchPanel({ dataFetch }) {
  if (!dataFetch) return null;
  return (
    <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-blue-500/10">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold text-blue-400">Live Data Lookup — PubChem</span>
        </div>
        {dataFetch.fetching && <Loader2 className="w-3 h-3 animate-spin text-blue-400" />}
        {dataFetch.done && (
          <span className="text-[10px] text-blue-400 font-mono">
            {dataFetch.total_found}/{dataFetch.total_searched} compounds found
          </span>
        )}
      </div>
      <div className="px-4 py-3 flex flex-wrap gap-2">
        {dataFetch.chemicals.map(({ name, data }) => (
          <div
            key={name}
            className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-lg border"
            style={{
              borderColor: data ? "#3b82f620" : "#ef444420",
              backgroundColor: data ? "#3b82f608" : "#ef444408",
            }}
          >
            {data ? (
              <CheckCircle2 className="w-3 h-3 text-blue-400 flex-shrink-0" />
            ) : (
              <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
            )}
            <span className={data ? "text-blue-300" : "text-red-400"}>{name}</span>
            {data?.boiling_point_C != null && (
              <span className="text-muted-foreground">bp {data.boiling_point_C}°C</span>
            )}
            {data?.ghs_hazard_codes?.length > 0 && (
              <span className="text-orange-400">{data.ghs_hazard_codes.slice(0, 3).join(" ")}</span>
            )}
          </div>
        ))}
        {dataFetch.fetching && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Loader2 className="w-2.5 h-2.5 animate-spin" /> querying...
          </div>
        )}
      </div>
    </div>
  );
}

function DecisionModelCard({ agentData, isActive }) {
  const SECTION_COLORS = {
    "1. Required Inputs": "#0ea5e9",
    "2. Key Variables and Units": "#f97316",
    "3. Risk Mechanisms": "#ef4444",
    "4. Mathematical Models": "#a855f7",
    "5. Decision Logic": "#22c55e",
    "6. JSON Schema": "#eab308",
    "7. Missing Data in Practice": "#64748b",
    "8. Recommended First Prototype": "#ec4899",
  };

  return (
    <Card className="overflow-hidden border-2 border-green-500/20 bg-card/60">
      <div className="flex items-center justify-between px-5 py-4 bg-green-500/5 border-b border-green-500/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-500/10">
            <BrainCircuit className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-400">Engineering Decision Framework</p>
            <p className="text-[10px] text-muted-foreground">Structured for machine-operable reasoning</p>
          </div>
        </div>
        {isActive && (
          <span className="flex items-center gap-1.5 text-xs text-green-400">
            <Loader2 className="w-3 h-3 animate-spin" /> Building framework...
          </span>
        )}
        {agentData.done && (
          <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">Complete</Badge>
        )}
      </div>

      {agentData.text && (
        <div className="p-5">
          <div className="prose prose-sm prose-invert max-w-none text-xs leading-relaxed">
            <ReactMarkdown
              components={{
                h2: ({ children }) => {
                  const title = String(children);
                  const color = Object.entries(SECTION_COLORS).find(([k]) => title.includes(k.split(".")[1]?.trim() || k))?.[1] || "#94a3b8";
                  return (
                    <div className="mt-6 first:mt-0 mb-2 pb-1 border-b border-border/30">
                      <h2 className="text-sm font-bold m-0" style={{ color }}>{children}</h2>
                    </div>
                  );
                },
                code: ({ inline, children }) =>
                  inline
                    ? <code className="px-1 py-0.5 rounded bg-secondary text-secondary-foreground font-mono text-xs">{children}</code>
                    : <pre className="bg-secondary/50 rounded-lg p-3 border border-border/30 overflow-x-auto font-mono text-xs mt-2 mb-2"><code>{children}</code></pre>,
                p: ({ children }) => <p className="my-1.5 text-secondary-foreground">{children}</p>,
                li: ({ children }) => <li className="my-0.5">{children}</li>,
                ul: ({ children }) => <ul className="ml-4 list-disc space-y-0.5">{children}</ul>,
                ol: ({ children }) => <ol className="ml-4 list-decimal space-y-0.5">{children}</ol>,
                table: ({ children }) => <table className="w-full text-xs border-collapse my-2">{children}</table>,
                th: ({ children }) => <th className="text-left px-2 py-1 border border-border/30 bg-secondary/30 font-medium">{children}</th>,
                td: ({ children }) => <td className="px-2 py-1 border border-border/30">{children}</td>,
              }}
            >
              {agentData.text}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {isActive && !agentData.text && (
        <div className="px-5 py-4 flex gap-1">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      )}
    </Card>
  );
}

function RoundSection({ roundData }) {
  const meta = ROUND_META[roundData.round] || {};
  const agentKeys = Object.keys(roundData.agents);
  const isMaxwellRound = roundData.round === 3;
  const isDecisionRound = roundData.round === 4;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border/20" />
        <div className="text-center">
          <p className="text-xs font-semibold" style={{ color: meta.color }}>{meta.label}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{meta.description}</p>
        </div>
        <div className="h-px flex-1 bg-border/20" />
      </div>

      {isDecisionRound ? (
        agentKeys.map(agentKey => (
          <DecisionModelCard
            key={agentKey}
            agentData={roundData.agents[agentKey]}
            isActive={!roundData.agents[agentKey].done}
          />
        ))
      ) : (
        <div className={cn(isMaxwellRound ? "space-y-3" : "grid grid-cols-1 md:grid-cols-2 gap-3")}>
          {agentKeys.map(agentKey => (
            <AgentCard
              key={agentKey}
              agentKey={agentKey}
              agentData={roundData.agents[agentKey]}
              isActive={!roundData.agents[agentKey].done}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TeamCommunication() {
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [rounds, setRounds] = useState([]);
  const [dataFetch, setDataFetch] = useState(null); // {fetching, chemicals: [{name, data}], done}
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (running) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [rounds]);

  const updateAgent = (agentKey, updater) => {
    setRounds(prev => {
      const next = [...prev];
      for (let i = next.length - 1; i >= 0; i--) {
        if (agentKey in next[i].agents) {
          next[i] = { ...next[i], agents: { ...next[i].agents, [agentKey]: updater(next[i].agents[agentKey]) } };
          break;
        }
      }
      return next;
    });
  };

  const launch = async () => {
    if (!prompt.trim() || running) return;
    setRunning(true);
    setFinished(false);
    setRounds([]);
    setDataFetch(null);
    setError(null);

    try {
      await localAgents.teamCommunication(prompt.trim(), {
        onAgentStart: ({ agent_key, codename }) => {
          setRounds(prev => {
            const next = [...prev];
            const last = { ...next[next.length - 1] };
            last.agents = { ...last.agents, [agent_key]: { codename, text: "", done: false, entries: [] } };
            next[next.length - 1] = last;
            return next;
          });
        },
        onAgentChunk: ({ agent_key, content }) => {
          updateAgent(agent_key, a => ({ ...a, text: a.text + content }));
        },
        onAgentDone: ({ agent_key }) => {
          updateAgent(agent_key, a => ({ ...a, done: true }));
        },
        onToolCall: ({ agent_key, entry }) => {
          updateAgent(agent_key, a => ({ ...a, entries: [...a.entries, entry] }));
        },
        onRoundStart: ({ round, label }) => {
          setRounds(prev => [...prev, { round, label, agents: {} }]);
        },
        onDataFetchStart: () => {
          setDataFetch({ fetching: true, chemicals: [], done: false });
        },
        onDataFetchResult: ({ chemical, data }) => {
          setDataFetch(prev => ({
            ...prev,
            chemicals: [...(prev?.chemicals || []), { name: chemical, data }],
          }));
        },
        onDataFetchDone: ({ total_found, total_searched }) => {
          setDataFetch(prev => ({ ...prev, fetching: false, done: true, total_found, total_searched }));
        },
        onDone: () => {
          setRunning(false);
          setFinished(true);
        },
        onError: (msg) => {
          setError(msg);
          setRunning(false);
        },
      });
    } catch (e) {
      setError(e.message);
      setRunning(false);
    }
  };

  const totalEntries = rounds.reduce((sum, r) =>
    sum + Object.values(r.agents).reduce((s, a) => s + (a.entries?.length || 0), 0), 0
  );

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <MessageSquareMore className="w-6 h-6 text-primary" />
          Team Communication
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          A structured 3-round debate. Each agent first defines the concept in their domain, then reads all colleagues and argues about mathematical connections, and finally Maxwell synthesizes a unified framework from the full conversation.
        </p>
        <div className="flex gap-2 flex-wrap pt-1">
          {Object.values(ROUND_META).map(r => (
            <div key={r.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: r.color }} />
              {r.label.split(" — ")[1]}
            </div>
          ))}
        </div>
      </div>

      {/* Prompt input */}
      <div className="space-y-3">
        <Textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Enter a research question for the team..."
          className="bg-card/50 border-border/50 min-h-24 resize-none font-mono text-sm"
          disabled={running}
        />
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {STARTER_PROMPTS.slice(0, 2).map((p, i) => (
              <button
                key={i}
                onClick={() => setPrompt(p)}
                disabled={running}
                className="text-xs px-3 py-1.5 rounded-full border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors disabled:opacity-40"
              >
                {p.slice(0, 45)}...
              </button>
            ))}
          </div>
          <Button onClick={launch} disabled={!prompt.trim() || running} className="gap-2">
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {running ? "Debating..." : "Launch Debate"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-3">{error}</div>
      )}

      {/* Live stats bar */}
      {running && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-primary/20 bg-primary/5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span className="text-xs font-medium text-primary">Debate in progress</span>
          {totalEntries > 0 && (
            <span className="text-xs text-muted-foreground font-mono ml-auto">+{totalEntries} entries saved to dictionary</span>
          )}
        </div>
      )}

      {/* Rounds */}
      {rounds.map(round => (
        <React.Fragment key={round.round}>
          {round.round === 4 && <DataFetchPanel dataFetch={dataFetch} />}
          <RoundSection roundData={round} />
        </React.Fragment>
      ))}
      {/* Show data fetch panel between Round 3 and Round 4 while fetching */}
      {dataFetch && !rounds.find(r => r.round === 4) && <DataFetchPanel dataFetch={dataFetch} />}

      {/* Done summary */}
      {finished && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-green-500/20 bg-green-500/5">
          <Sparkles className="w-4 h-4 text-green-400" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-green-400">Debate complete</p>
            <p className="text-xs text-muted-foreground">{totalEntries} new entries saved to the Math Dictionary</p>
          </div>
          <BookOpen className="w-4 h-4 text-muted-foreground" />
        </div>
      )}

      {!running && rounds.length === 0 && (
        <div className="text-center py-16 border border-dashed border-border/30 rounded-xl">
          <MessageSquareMore className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm text-muted-foreground">Launch a debate to watch the agents argue their way to unified math.</p>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
