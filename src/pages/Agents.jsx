import React, { useState, useEffect, useRef } from "react";
import { localAgents } from "@/api/localAgentsClient";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, Plus, MessageSquare, Loader2 } from "lucide-react";
import MessageBubble from "../components/agents/MessageBubble";
import { cn } from "@/lib/utils";

const agents = [
  { key: "electrochemistry_researcher", name: "Faraday", domain: "Electrochemistry", color: "#0ea5e9" },
  { key: "thermochemistry_researcher", name: "Carnot", domain: "Thermochemistry", color: "#f97316" },
  { key: "kinetics_researcher", name: "Arrhenius", domain: "Kinetics", color: "#22c55e" },
  { key: "organic_chemistry_researcher", name: "Kekulé", domain: "Organic Chemistry", color: "#a855f7" },
  { key: "quantum_chemistry_researcher", name: "Bohr", domain: "Quantum Chemistry", color: "#ec4899" },
  { key: "stoichiometry_researcher", name: "Lavoisier", domain: "Stoichiometry", color: "#eab308" },
  { key: "synthesis_agent", name: "Maxwell", domain: "Multi-Domain Synthesis", color: "#e2e8f0", isSynthesizer: true },
];

export default function Agents() {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConvo, setActiveConvo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const queryClient = useQueryClient();

  // Load conversations when agent changes
  useEffect(() => {
    if (!selectedAgent) return;
    localAgents.listConversations({ agent_name: selectedAgent.key })
      .then(setConversations)
      .catch(() => setConversations([]));
  }, [selectedAgent]);

  // Load messages when conversation changes
  useEffect(() => {
    if (!activeConvo) return;
    localAgents.getConversation(activeConvo.id)
      .then(conv => setMessages(conv.messages || []))
      .catch(() => setMessages([]));
  }, [activeConvo?.id]);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const createConversation = async () => {
    setError(null);
    try {
      const conv = await localAgents.createConversation({
        agent_name: selectedAgent.key,
        metadata: { name: `${selectedAgent.domain} Research Session` }
      });
      setConversations(prev => [conv, ...prev]);
      setActiveConvo(conv);
      setMessages([]);
    } catch (e) {
      setError("Cannot reach backend at http://localhost:8000 — is the server running?\n\ncd backend && uvicorn main:app --reload");
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || sending || !activeConvo) return;
    const content = inputValue.trim();
    setInputValue("");
    setSending(true);

    // Show user message immediately
    setMessages(prev => [...prev, { role: "user", content }]);

    let assistantText = "";

    await localAgents.chat(activeConvo, content, {
      onChunk: (chunk) => {
        assistantText += chunk;
        setMessages(prev => {
          const msgs = [...prev];
          const last = msgs[msgs.length - 1];
          if (last?.role === "assistant") {
            return [...msgs.slice(0, -1), { ...last, content: assistantText }];
          }
          return [...msgs, { role: "assistant", content: assistantText }];
        });
      },
      onEntry: () => {
        queryClient.invalidateQueries({ queryKey: ["dictionary"] });
      },
      onDone: (finalMessages) => {
        setMessages(finalMessages.map(m => ({ role: m.role, content: m.content })));
      },
      onError: (err) => {
        console.error("Agent error:", err);
        setMessages(prev => [...prev, { role: "assistant", content: `Error: ${err}` }]);
      },
    });

    setSending(false);
  };

  // ── Agent selection view ───────────────────────────────────────────────────

  if (!selectedAgent) {
    return (
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Bot className="w-6 h-6 text-primary" /> Domain Agents
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Each agent is a world-class researcher specialized in their domain's chemistry-to-math translation.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.filter(a => !a.isSynthesizer).map(a => (
            <Card
              key={a.key}
              className="p-5 cursor-pointer hover:border-primary/30 transition-all bg-card/50"
              onClick={() => setSelectedAgent(a)}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold" style={{ backgroundColor: `${a.color}15`, color: a.color }}>
                  {a.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.domain}</p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs" style={{ borderColor: `${a.color}40`, color: a.color }}>
                {a.domain} Specialist
              </Badge>
            </Card>
          ))}
        </div>

        {/* Maxwell — Synthesizer */}
        {(() => {
          const maxwell = agents.find(a => a.isSynthesizer);
          return (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">Master Synthesizer</p>
              <Card
                className="p-5 cursor-pointer transition-all bg-card/50 border-slate-500/30 hover:border-slate-400/50"
                style={{ background: "linear-gradient(135deg, hsl(220 18% 8%), hsl(220 18% 10%))" }}
                onClick={() => setSelectedAgent(maxwell)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-bold bg-gradient-to-br from-slate-400/20 to-slate-200/10 border border-slate-500/30 text-slate-200">
                    M
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-100">Maxwell</p>
                    <p className="text-xs text-muted-foreground">Multi-Domain Synthesis · Reads all 6 domain dictionaries</p>
                  </div>
                  <Badge variant="outline" className="text-xs border-slate-500/40 text-slate-300">Synthesizer</Badge>
                </div>
              </Card>
            </div>
          );
        })()}
      </div>
    );
  }

  // ── Chat view ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col md:flex-row h-screen md:h-auto">
      {/* Sidebar - conversations */}
      <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-border bg-card/30 p-4 space-y-3">
        <Button variant="ghost" size="sm" onClick={() => { setSelectedAgent(null); setActiveConvo(null); }} className="text-muted-foreground text-xs">
          ← Back to Agents
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: `${selectedAgent.color}15`, color: selectedAgent.color }}>
            {selectedAgent.name.split(' ').pop()?.[0]}
          </div>
          <div>
            <p className="text-xs font-semibold">{selectedAgent.name}</p>
            <p className="text-xs text-muted-foreground">{selectedAgent.domain}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={createConversation}>
          <Plus className="w-3 h-3 mr-2" /> New Session
        </Button>
        {error && (
          <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-2 whitespace-pre-wrap">{error}</div>
        )}
        <div className="space-y-1">
          {conversations.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveConvo(c)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-xs transition-colors",
                activeConvo?.id === c.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary/50"
              )}
            >
              <MessageSquare className="w-3 h-3 inline mr-1.5" />
              {c.metadata?.name || "Session"}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-h-0" style={{ height: "calc(100vh - 64px)" }}>
        {!activeConvo ? (
          <div className="flex-1 flex items-center justify-center text-center p-6">
            <div>
              <Bot className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Create a new research session to start collaborating with {selectedAgent.name}.</p>
            </div>
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-10 text-muted-foreground text-xs">
                  Start the conversation. Ask the agent to define concepts, build formulas, or explore connections.
                </div>
              )}
              {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} />
              ))}
            </div>
            <div className="border-t border-border p-4">
              <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  placeholder={`Ask ${selectedAgent.name.split(' ')[0]}...`}
                  className="bg-card/50"
                  disabled={sending}
                />
                <Button type="submit" disabled={sending || !inputValue.trim()} size="icon">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
