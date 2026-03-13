import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, Send, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

const agents = [
  { key: "electrochemistry_researcher", codename: "Faraday", domain: "Electrochemistry", color: "#0ea5e9" },
  { key: "thermochemistry_researcher", codename: "Carnot", domain: "Thermochemistry", color: "#f97316" },
  { key: "kinetics_researcher", codename: "Arrhenius", domain: "Kinetics", color: "#22c55e" },
  { key: "organic_chemistry_researcher", codename: "Kekulé", domain: "Organic Chemistry", color: "#a855f7" },
  { key: "quantum_chemistry_researcher", codename: "Bohr", domain: "Quantum Chemistry", color: "#ec4899" },
  { key: "stoichiometry_researcher", codename: "Lavoisier", domain: "Stoichiometry", color: "#eab308" },
];

const STARTER_PROMPTS = [
  "Define the mathematical structure of energy conservation across all chemistry domains and how they connect.",
  "What are the universal mathematical operators that appear across all chemistry domains?",
  "Formalize the concept of equilibrium in your domain — how is 'balance' expressed mathematically?",
  "What is the role of time in your domain? Translate its mathematical meaning into code.",
  "Define the concept of a 'state' in your domain mathematically, and how state transitions are computed.",
];

function AgentPanel({ agent, mission }) {
  const [status, setStatus] = useState("idle"); // idle | working | done | error
  const [response, setResponse] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [conversationId, setConversationId] = useState(null);

  useEffect(() => {
    if (!mission) return;
    let unsubscribe;

    const run = async () => {
      setStatus("working");
      setResponse("");
      setExpanded(false);

      const conv = await base44.agents.createConversation({
        agent_name: agent.key,
        metadata: { name: `Team Mission: ${mission.slice(0, 40)}...` }
      });
      setConversationId(conv.id);

      unsubscribe = base44.agents.subscribeToConversation(conv.id, (data) => {
        const msgs = data.messages || [];
        const lastAssistant = [...msgs].reverse().find(m => m.role === "assistant");
        if (lastAssistant?.content) {
          setResponse(lastAssistant.content);
        }
        // Check if done (no tool calls running)
        const lastMsg = msgs[msgs.length - 1];
        if (lastMsg?.role === "assistant" && lastMsg?.content) {
          setStatus("done");
          setExpanded(true);
        }
      });

      await base44.agents.addMessage(conv, {
        role: "user",
        content: mission
      });
    };

    run().catch(() => setStatus("error"));

    return () => { if (unsubscribe) unsubscribe(); };
  }, [mission]);

  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-300 overflow-hidden",
        status === "working" && "border-border animate-pulse",
        status === "done" && "border-border/60",
        status === "idle" && "border-border/30 opacity-60",
        status === "error" && "border-destructive/30"
      )}
      style={status === "done" ? { borderColor: `${agent.color}30` } : {}}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer bg-card/40"
        onClick={() => status === "done" && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: `${agent.color}15`, color: agent.color }}
          >
            {agent.codename[0]}
          </div>
          <div>
            <p className="text-sm font-semibold">{agent.codename}</p>
            <p className="text-xs text-muted-foreground">{agent.domain}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status === "working" && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" style={{ color: agent.color }} />
              <span style={{ color: agent.color }}>Researching...</span>
            </div>
          )}
          {status === "done" && (
            <div className="flex items-center gap-1.5 text-xs" style={{ color: agent.color }}>
              <BookOpen className="w-3 h-3" />
              <span>Done</span>
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </div>
          )}
          {status === "idle" && <span className="text-xs text-muted-foreground">Waiting...</span>}
          {status === "error" && <span className="text-xs text-destructive">Error</span>}
        </div>
      </div>

      {/* Response */}
      {expanded && response && (
        <div className="px-4 pb-4 border-t border-border/30">
          <div className="mt-3 text-xs leading-relaxed text-secondary-foreground prose prose-sm prose-invert max-w-none">
            <ReactMarkdown
              components={{
                code: ({ inline, children }) =>
                  inline
                    ? <code className="px-1 py-0.5 rounded bg-secondary text-secondary-foreground font-mono text-xs">{children}</code>
                    : <pre className="bg-secondary/50 rounded-lg p-3 border border-border/30 overflow-x-auto font-mono text-xs mt-2"><code>{children}</code></pre>,
                p: ({ children }) => <p className="my-1.5">{children}</p>,
                h3: ({ children }) => <h3 className="text-sm font-semibold mt-3 mb-1" style={{ color: agent.color }}>{children}</h3>,
                ul: ({ children }) => <ul className="ml-4 list-disc space-y-0.5">{children}</ul>,
              }}
            >
              {response}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Mission() {
  const [prompt, setPrompt] = useState("");
  const [activeMission, setActiveMission] = useState(null);
  const [missionKey, setMissionKey] = useState(0);
  const queryClient = useQueryClient();

  const launch = () => {
    if (!prompt.trim()) return;
    setActiveMission(prompt.trim());
    setMissionKey(k => k + 1);
    setTimeout(() => queryClient.invalidateQueries({ queryKey: ["dictionary"] }), 10000);
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-3">
          <Zap className="w-6 h-6 text-primary" />
          Team Mission
        </h1>
        <p className="text-sm text-muted-foreground">
          Send one research question to all 6 domain agents simultaneously. Each builds the math language for their domain and saves to the shared dictionary.
        </p>
      </div>

      {/* Prompt input */}
      <div className="space-y-3">
        <Textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Enter a research question for the entire team..."
          className="bg-card/50 border-border/50 min-h-24 resize-none font-mono text-sm"
        />
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {STARTER_PROMPTS.slice(0, 3).map((p, i) => (
              <button
                key={i}
                onClick={() => setPrompt(p)}
                className="text-xs px-3 py-1.5 rounded-full border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
              >
                {p.slice(0, 40)}...
              </button>
            ))}
          </div>
          <Button onClick={launch} disabled={!prompt.trim()} className="gap-2">
            <Send className="w-4 h-4" />
            Launch Mission
          </Button>
        </div>
      </div>

      {/* Agent panels */}
      {activeMission && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border/30" />
            <Badge variant="outline" className="text-xs font-mono">Mission Active</Badge>
            <div className="h-px flex-1 bg-border/30" />
          </div>
          <div className="bg-secondary/20 rounded-xl border border-border/30 px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">Mission Brief</p>
            <p className="text-sm font-mono text-foreground">{activeMission}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map(agent => (
              <AgentPanel key={`${agent.key}-${missionKey}`} agent={agent} mission={activeMission} />
            ))}
          </div>
        </div>
      )}

      {!activeMission && (
        <div className="text-center py-16 border border-dashed border-border/30 rounded-xl">
          <Zap className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="text-sm text-muted-foreground">Launch a mission to deploy all agents simultaneously.</p>
        </div>
      )}
    </div>
  );
}