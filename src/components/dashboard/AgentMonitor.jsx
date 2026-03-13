import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, FlaskConical, Save, CheckCircle2, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

const AGENTS = [
  { key: "electrochemistry_researcher", codename: "Faraday", domain: "Electrochemistry", color: "#0ea5e9" },
  { key: "thermochemistry_researcher", codename: "Carnot", domain: "Thermochemistry", color: "#f97316" },
  { key: "kinetics_researcher", codename: "Arrhenius", domain: "Kinetics", color: "#22c55e" },
  { key: "organic_chemistry_researcher", codename: "Kekulé", domain: "Organic Chemistry", color: "#a855f7" },
  { key: "quantum_chemistry_researcher", codename: "Bohr", domain: "Quantum Chemistry", color: "#ec4899" },
  { key: "stoichiometry_researcher", codename: "Lavoisier", domain: "Stoichiometry", color: "#eab308" },
];

const DOMAIN_FOR_AGENT = {
  electrochemistry_researcher: "electrochemistry",
  thermochemistry_researcher: "thermochemistry",
  kinetics_researcher: "kinetics",
  organic_chemistry_researcher: "organic_chemistry",
  quantum_chemistry_researcher: "quantum_chemistry",
  stoichiometry_researcher: "stoichiometry",
};

function getPhase(elapsedMs, entriesCount) {
  if (entriesCount > 0) return "saving";
  if (elapsedMs > 45000) return "formalizing";
  if (elapsedMs > 5000) return "searching";
  return "starting";
}

const PHASE_META = {
  starting:    { label: "Starting...",   icon: Radio,        spin: false },
  searching:   { label: "Searching",     icon: Search,       spin: false },
  formalizing: { label: "Formalizing",   icon: FlaskConical, spin: false },
  saving:      { label: "Saving",        icon: Save,         spin: false },
  done:        { label: "Done",          icon: CheckCircle2, spin: false },
  idle:        { label: "Idle",          icon: null,         spin: false },
};

function AgentRow({ agent, elapsedMs, entriesCount, isDone }) {
  const phase = isDone ? "done" : getPhase(elapsedMs, entriesCount);
  const meta = PHASE_META[phase];
  const Icon = meta.icon;
  const isActive = phase !== "idle" && phase !== "done";

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/20 last:border-0">
      {/* Agent dot + name */}
      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: agent.color }} />
      <div className="w-20 flex-shrink-0">
        <p className="text-xs font-semibold text-foreground">{agent.codename}</p>
        <p className="text-[10px] text-muted-foreground leading-tight">{agent.domain}</p>
      </div>

      {/* Phase bar */}
      <div className="flex-1 flex gap-1 items-center">
        {["searching", "formalizing", "saving"].map(p => {
          const phases = ["searching", "formalizing", "saving"];
          const currentIdx = phases.indexOf(phase === "starting" ? "searching" : phase === "done" ? "saving" : phase);
          const barIdx = phases.indexOf(p);
          const filled = isDone || barIdx <= currentIdx;
          const active = !isDone && barIdx === currentIdx;
          return (
            <div
              key={p}
              className={cn(
                "h-1 rounded-full flex-1 transition-all duration-700",
                filled ? "opacity-100" : "opacity-20",
                active && "animate-pulse"
              )}
              style={{ backgroundColor: filled ? agent.color : "#334155" }}
            />
          );
        })}
      </div>

      {/* Status badge */}
      <div className="flex items-center gap-1.5 w-24 justify-end">
        {Icon && (
          isActive ? (
            <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" style={{ color: agent.color }} />
          ) : (
            <Icon className="w-3 h-3 flex-shrink-0" style={{ color: isDone ? agent.color : "#64748b" }} />
          )
        )}
        <span className="text-[10px]" style={{ color: isDone ? agent.color : isActive ? agent.color : "#64748b" }}>
          {meta.label}
        </span>
      </div>

      {/* Entry count */}
      <div className="w-8 text-right">
        {entriesCount > 0 && (
          <span className="text-[10px] font-mono" style={{ color: agent.color }}>+{entriesCount}</span>
        )}
      </div>
    </div>
  );
}

export default function AgentMonitor() {
  const [elapsedMs, setElapsedMs] = useState(0);
  const [domainEntries, setDomainEntries] = useState({});
  const [doneDomains, setDoneDomains] = useState(new Set());
  const timerRef = useRef(null);

  const { data: activeMissions = [] } = useQuery({
    queryKey: ["active-missions"],
    queryFn: () => base44.entities.Mission.filter({ status: "active" }, "-created_date", 1),
    refetchInterval: 5000,
  });

  const activeMission = activeMissions[0];

  // Timer
  useEffect(() => {
    if (!activeMission) {
      setElapsedMs(0);
      setDoneDomains(new Set());
      return;
    }
    const start = new Date(activeMission.created_date).getTime();
    timerRef.current = setInterval(() => {
      setElapsedMs(Date.now() - start);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [activeMission?.id]);

  // Subscribe to MathDictionary for live entry counts
  useEffect(() => {
    if (!activeMission) {
      setDomainEntries({});
      return;
    }
    const missionStart = new Date(activeMission.created_date).getTime();

    const unsubscribe = base44.entities.MathDictionary.subscribe((event) => {
      if (event.type === "create" && event.data) {
        const entryTime = new Date(event.data.created_date).getTime();
        if (entryTime >= missionStart) {
          const domain = event.data.domain;
          setDomainEntries(prev => ({ ...prev, [domain]: (prev[domain] || 0) + 1 }));
        }
      }
    });

    return () => unsubscribe();
  }, [activeMission?.id]);

  // Mark agent done when mission completes
  const { data: completedMissions = [] } = useQuery({
    queryKey: ["completed-missions"],
    queryFn: () => base44.entities.Mission.filter({ status: "completed" }, "-updated_date", 1),
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (completedMissions[0] && !activeMission) {
      setDoneDomains(new Set(AGENTS.map(a => DOMAIN_FOR_AGENT[a.key])));
    }
  }, [completedMissions[0]?.id, activeMission]);

  if (!activeMission) return null;

  const doneCount = AGENTS.filter(a => doneDomains.has(DOMAIN_FOR_AGENT[a.key])).length;
  const totalEntries = Object.values(domainEntries).reduce((a, b) => a + b, 0);

  return (
    <div className="rounded-xl border border-border/50 bg-card/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-card/60">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span className="text-xs font-semibold">Agent Monitor</span>
          <span className="text-xs text-muted-foreground font-mono">
            {Math.floor(elapsedMs / 60000)}:{String(Math.floor((elapsedMs % 60000) / 1000)).padStart(2, "0")}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {totalEntries > 0 && <span className="text-primary font-mono">+{totalEntries} entries saved</span>}
          <span>{doneCount}/6 done</span>
        </div>
      </div>

      {/* Mission brief */}
      <div className="px-4 py-2 bg-secondary/10 border-b border-border/20">
        <p className="text-[10px] text-muted-foreground truncate">{activeMission.prompt}</p>
      </div>

      {/* Agents */}
      <div className="px-4">
        {AGENTS.map(agent => (
          <AgentRow
            key={agent.key}
            agent={agent}
            elapsedMs={elapsedMs}
            entriesCount={domainEntries[DOMAIN_FOR_AGENT[agent.key]] || 0}
            isDone={doneDomains.has(DOMAIN_FOR_AGENT[agent.key])}
          />
        ))}
      </div>
    </div>
  );
}