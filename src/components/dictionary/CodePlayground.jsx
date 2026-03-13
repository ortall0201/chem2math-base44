import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, X, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CodePlayground({ initialCode, onClose }) {
  const [code, setCode] = useState(initialCode || "");
  const [output, setOutput] = useState([]);
  const [running, setRunning] = useState(false);
  const textareaRef = useRef(null);

  const run = () => {
    setRunning(true);
    const logs = [];

    const sandboxConsole = {
      log: (...args) => logs.push({ type: "log", text: args.map(String).join(" ") }),
      error: (...args) => logs.push({ type: "error", text: args.map(String).join(" ") }),
      warn: (...args) => logs.push({ type: "warn", text: args.map(String).join(" ") }),
      info: (...args) => logs.push({ type: "info", text: args.map(String).join(" ") }),
    };

    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function("console", code);
      const result = fn(sandboxConsole);
      if (result !== undefined) {
        logs.push({ type: "return", text: String(result) });
      }
      if (logs.length === 0) {
        logs.push({ type: "info", text: "✓ Ran successfully (no output)" });
      }
    } catch (err) {
      logs.push({ type: "error", text: `RuntimeError: ${err.message}` });
    }

    setOutput(logs);
    setRunning(false);
  };

  const reset = () => {
    setCode(initialCode || "");
    setOutput([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = textareaRef.current;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newCode = code.substring(0, start) + "  " + code.substring(end);
      setCode(newCode);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      run();
    }
  };

  const typeColors = {
    log: "text-foreground",
    error: "text-red-400",
    warn: "text-yellow-400",
    info: "text-primary",
    return: "text-chart-2",
  };

  return (
    <div className="mt-3 rounded-xl border border-primary/20 bg-background overflow-hidden" onClick={e => e.stopPropagation()}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-secondary/30 border-b border-border/30">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-mono text-primary font-medium">Playground</span>
          <span className="text-xs text-muted-foreground ml-1">⌘+Enter to run</span>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={reset} className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground gap-1">
            <RotateCcw className="w-3 h-3" /> Reset
          </Button>
          <Button size="sm" onClick={run} disabled={running} className="h-6 px-2 text-xs gap-1 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20">
            <Play className="w-3 h-3" /> Run
          </Button>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground ml-1">
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      <textarea
        ref={textareaRef}
        value={code}
        onChange={e => setCode(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        className="w-full bg-muted/20 text-foreground font-mono text-xs p-3 resize-none focus:outline-none min-h-32 border-b border-border/30"
        style={{ tabSize: 2 }}
        rows={Math.max(6, code.split("\n").length + 1)}
      />

      {/* Output */}
      {output.length > 0 && (
        <div className="px-3 py-2 bg-background/60 font-mono text-xs space-y-0.5 max-h-40 overflow-y-auto">
          <div className="text-muted-foreground text-[10px] uppercase tracking-wider mb-1">Output</div>
          {output.map((line, i) => (
            <div key={i} className={cn("leading-relaxed", typeColors[line.type] || "text-foreground")}>
              {line.type === "error" ? "✗ " : line.type === "return" ? "→ " : "  "}{line.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}