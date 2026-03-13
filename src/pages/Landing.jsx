import React from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FlaskConical, BookOpen, Bot, Zap, ArrowRight, Database,
  Code2, Brain, Users, GitMerge, ChevronRight, Star, Lock, Globe
} from "lucide-react";

const DOMAINS = [
  { label: "Electrochemistry", color: "#0ea5e9", eq: "E = E° − (RT/nF)·ln Q" },
  { label: "Thermochemistry", color: "#f97316", eq: "dG = −SdT + VdP + Σμᵢdnᵢ" },
  { label: "Kinetics", color: "#22c55e", eq: "d[A]/dt = −k[A]ⁿ" },
  { label: "Organic Chemistry", color: "#a855f7", eq: "M = (V, E, λ, β)" },
  { label: "Quantum Chemistry", color: "#ec4899", eq: "Ĥψ = Eψ" },
  { label: "Stoichiometry", color: "#eab308", eq: "Ax = 0 → null(A)" },
];

const PERSONAS = [
  { icon: Brain, title: "Computational Chemists", desc: "Turn your formalism into a shared, queryable, computable knowledge base. Stop reinventing derivations." },
  { icon: FlaskConical, title: "PhD Researchers", desc: "Publish your domain expertise as formal math. Get credited. Accelerate your field." },
  { icon: Code2, title: "Cheminformatics Engineers", desc: "Access a growing library of chemistry-to-code translations. Plug domain knowledge directly into your pipelines." },
  { icon: Users, title: "Pharma R&D Teams", desc: "Build proprietary chemistry AI on top of a curated, mathematically rigorous foundation." },
];

const HOW_IT_WORKS = [
  { step: "01", title: "Ask an AI Agent", desc: "Pose a chemistry research question to one of 6 domain-expert agents (Electrochemistry, Kinetics, Thermochemistry…)." },
  { step: "02", title: "Agent Researches & Formalizes", desc: "The agent searches the web, derives the math, writes the code representation, and saves structured entries to the shared dictionary." },
  { step: "03", title: "Dictionary Grows", desc: "Every interaction enriches the shared MathDictionary — concept names, formalisms, code, variables, axioms, and prediction potential." },
  { step: "04", title: "Run & Validate", desc: "Use the built-in code playground to test and validate formalisms directly in the browser. No setup required." },
];

export default function Landing() {
  const login = () => base44.auth.redirectToLogin("/Dashboard");

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <FlaskConical className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-sm tracking-tight">ChemLang</span>
            <Badge variant="outline" className="text-xs font-mono text-primary border-primary/30 ml-1">ALPHA</Badge>
          </div>
          <Button onClick={login} size="sm" className="gap-1.5">
            Sign In <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 text-center max-w-4xl mx-auto">
        <Badge variant="outline" className="mb-6 text-xs font-mono text-primary border-primary/30 px-3 py-1">
          Chemistry → Mathematics → Code
        </Badge>
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight mb-6">
          The{" "}
          <span className="text-primary">Living Dictionary</span>
          {" "}of<br className="hidden md:block" />
          Computable Chemistry
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          ChemLang uses AI domain agents to translate every chemistry concept into formal mathematics and runnable code — and stores it in a shared, growing dictionary. Built by researchers, for researchers.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={login} size="lg" className="gap-2 text-base px-8">
            Start Researching <ArrowRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="lg" className="gap-2 text-base px-8" onClick={login}>
            <BookOpen className="w-4 h-4" /> Explore Dictionary
          </Button>
        </div>

        {/* Domain pills */}
        <div className="mt-16 flex flex-wrap justify-center gap-2">
          {DOMAINS.map(d => (
            <div
              key={d.label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono"
              style={{ borderColor: `${d.color}30`, backgroundColor: `${d.color}08`, color: d.color }}
            >
              <span className="font-semibold">{d.label}:</span>
              <span className="opacity-80">{d.eq}</span>
            </div>
          ))}
        </div>
      </section>

      {/* The Problem */}
      <section className="py-20 px-6 bg-card/30 border-y border-border/30">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-medium">The Problem</p>
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            Chemistry knowledge lives in papers.<br />It should live in code.
          </h2>
          <p className="text-muted-foreground leading-relaxed text-base">
            Every year, millions of chemistry papers are published — full of equations, derivations, and formalisms. But this knowledge is locked in PDFs, in human intuition, and in lab notebooks. It's not queryable, not computable, and not connected. <strong className="text-foreground">ChemLang is changing that.</strong>
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-medium text-center">How It Works</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-16">
            Like Wikipedia, but your AI does the writing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {HOW_IT_WORKS.map(step => (
              <div key={step.step} className="flex gap-5">
                <div className="text-4xl font-black text-primary/15 font-mono leading-none flex-shrink-0 w-10">{step.step}</div>
                <div>
                  <h3 className="font-semibold mb-1.5">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GPT-data analogy */}
      <section className="py-20 px-6 bg-primary/5 border-y border-primary/10">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs uppercase tracking-widest text-primary mb-3 font-medium">The Crowdsourcing Model</p>
              <h2 className="text-2xl md:text-3xl font-bold mb-5">
                Every mission enriches<br />the shared dictionary
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                GPT learned from the collective writing of humanity. ChemLang learns from the collective research of chemists. Every time you run a mission — asking all 6 domain agents a research question — new formalized entries are saved to the shared MathDictionary.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Over time, the dictionary becomes a <strong className="text-foreground">universal, computable knowledge graph</strong> of chemistry mathematics — built by domain experts, validated by the community, and accessible to everyone.
              </p>
            </div>
            <div className="space-y-3">
              {[
                { icon: Bot, label: "6 domain AI agents", desc: "Each specializing in one chemistry subdomain" },
                { icon: Database, label: "Shared MathDictionary", desc: "Grows with every mission — formalism, code, axioms" },
                { icon: GitMerge, label: "Cross-domain synthesis", desc: "Maxwell agent unifies knowledge across all domains" },
                { icon: Globe, label: "Open knowledge base", desc: "Queryable, filterable, exportable as PDF reports" },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-3 p-3 rounded-xl border border-border/30 bg-card/40">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-medium text-center">Who It's For</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Built for people who speak both chemistry and math</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {PERSONAS.map(p => (
              <div key={p.title} className="p-6 rounded-2xl border border-border/40 bg-card/30 hover:border-primary/20 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  <p.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Code playground teaser */}
      <section className="py-20 px-6 bg-card/20 border-y border-border/30">
        <div className="max-w-4xl mx-auto text-center">
          <Code2 className="w-10 h-10 text-primary mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Test formalisms in the browser</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-3 leading-relaxed">
            Every dictionary entry comes with a built-in code playground. Run simulations and unit tests on saved formalisms — no setup, no environment, directly in the browser.
          </p>
          <div className="mt-8 rounded-2xl border border-border/40 bg-background/60 overflow-hidden max-w-xl mx-auto text-left">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-secondary/30 border-b border-border/30">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              <span className="text-xs font-mono text-muted-foreground ml-2">Nernst Equation — Playground</span>
            </div>
            <pre className="p-4 text-xs font-mono text-foreground/80 leading-relaxed overflow-x-auto">{`// Nernst Equation: E = E° - (RT/nF)·ln(Q)
const R = 8.314;      // J/(mol·K)
const F = 96485;      // C/mol

function nernst(E0, T, n, Q) {
  return E0 - (R * T) / (n * F) * Math.log(Q);
}

const E = nernst(0.34, 298, 2, 0.001);
console.log("Cell potential:", E.toFixed(4), "V");`}</pre>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <Star className="w-8 h-8 text-primary mx-auto mb-6 opacity-60" />
          <h2 className="text-3xl md:text-4xl font-extrabold mb-5 tracking-tight">
            Help build the world's first<br />computable chemistry dictionary
          </h2>
          <p className="text-muted-foreground mb-10 leading-relaxed">
            Every research session you run contributes formalized knowledge to a shared, growing resource. The more domain experts participate, the smarter and more complete the dictionary becomes.
          </p>
          <Button onClick={login} size="lg" className="gap-2 text-base px-10">
            Get Access <ChevronRight className="w-4 h-4" />
          </Button>
          <p className="text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3" /> Invite-only alpha — for researchers only
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">ChemLang</span>
            <span className="text-xs text-muted-foreground">Chemistry → Mathematics → Code</span>
          </div>
          <p className="text-xs text-muted-foreground">Built for computational chemists and research scientists</p>
        </div>
      </footer>

    </div>
  );
}