import React, { useEffect, useRef, useMemo } from "react";

const domainColors = {
  electrochemistry: "#0ea5e9",
  thermochemistry: "#f97316",
  kinetics: "#22c55e",
  organic_chemistry: "#a855f7",
  quantum_chemistry: "#ec4899",
  stoichiometry: "#eab308",
};

function buildGraph(entries) {
  const nodes = entries.map((e, i) => ({
    id: e.id,
    label: e.concept_name,
    domain: e.domain,
    x: Math.random() * 800 - 400,
    y: Math.random() * 600 - 300,
    vx: 0,
    vy: 0,
  }));

  const nodeById = Object.fromEntries(nodes.map(n => [n.id, n]));
  const edges = [];

  entries.forEach(e => {
    if (!e.relationships?.length) return;
    e.relationships.forEach(relName => {
      const target = entries.find(
        t => t.id !== e.id && t.concept_name?.toLowerCase().includes(relName.toLowerCase())
      );
      if (target) {
        edges.push({ source: e.id, target: target.id });
      }
    });
  });

  return { nodes, edges, nodeById };
}

function runSimulation(nodes, edges, steps = 200) {
  const nodeById = Object.fromEntries(nodes.map(n => [n.id, n]));

  for (let step = 0; step < steps; step++) {
    const alpha = 1 - step / steps;

    // Repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = b.x - a.x || 0.01;
        const dy = b.y - a.y || 0.01;
        const dist2 = dx * dx + dy * dy;
        const force = (8000 / dist2) * alpha;
        a.vx -= (dx / Math.sqrt(dist2)) * force;
        a.vy -= (dy / Math.sqrt(dist2)) * force;
        b.vx += (dx / Math.sqrt(dist2)) * force;
        b.vy += (dy / Math.sqrt(dist2)) * force;
      }
    }

    // Attraction along edges
    edges.forEach(({ source, target }) => {
      const a = nodeById[source], b = nodeById[target];
      if (!a || !b) return;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const force = ((dist - 100) * 0.05) * alpha;
      a.vx += (dx / dist) * force;
      a.vy += (dy / dist) * force;
      b.vx -= (dx / dist) * force;
      b.vy -= (dy / dist) * force;
    });

    // Center gravity
    nodes.forEach(n => {
      n.vx -= n.x * 0.01 * alpha;
      n.vy -= n.y * 0.01 * alpha;
    });

    // Apply velocity
    nodes.forEach(n => {
      n.x += n.vx * 0.5;
      n.y += n.vy * 0.5;
      n.vx *= 0.8;
      n.vy *= 0.8;
    });
  }
}

export default function GraphView({ entries }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);

  const graph = useMemo(() => {
    const g = buildGraph(entries);
    runSimulation(g.nodes, g.edges);
    return g;
  }, [entries]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let transform = { x: 0, y: 0, scale: 1 };
    let isDragging = false;
    let lastMouse = { x: 0, y: 0 };
    let hoveredNode = null;

    stateRef.current = { transform, isDragging, lastMouse, hoveredNode };

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      draw();
    };

    const draw = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      const dpr = window.devicePixelRatio;
      const cx = width / 2, cy = height / 2;
      ctx.translate(cx + transform.x * dpr, cy + transform.y * dpr);
      ctx.scale(transform.scale * dpr, transform.scale * dpr);

      // Edges
      graph.edges.forEach(({ source, target }) => {
        const a = graph.nodeById[source], b = graph.nodeById[target];
        if (!a || !b) return;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Nodes
      graph.nodes.forEach(node => {
        const color = domainColors[node.domain] || "#0ea5e9";
        const isHovered = hoveredNode?.id === node.id;
        const r = isHovered ? 9 : 6;

        // Glow
        if (isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 6, 0, Math.PI * 2);
          ctx.fillStyle = color + "30";
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Label
        if (isHovered || transform.scale > 1.4) {
          ctx.font = `${isHovered ? 600 : 400} ${12 / transform.scale}px Inter, sans-serif`;
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.textAlign = "center";
          ctx.fillText(node.label, node.x, node.y - r - 4);
        }
      });

      ctx.restore();
    };

    const toGraphCoords = (mx, my) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio;
      const cx = canvas.width / 2, cy = canvas.height / 2;
      return {
        x: ((mx - rect.left) * dpr - cx - transform.x * dpr) / (transform.scale * dpr),
        y: ((my - rect.top) * dpr - cy - transform.y * dpr) / (transform.scale * dpr),
      };
    };

    canvas.addEventListener("mousedown", e => {
      isDragging = true;
      lastMouse = { x: e.clientX, y: e.clientY };
    });
    canvas.addEventListener("mouseup", () => { isDragging = false; });
    canvas.addEventListener("mousemove", e => {
      if (isDragging) {
        transform.x += (e.clientX - lastMouse.x);
        transform.y += (e.clientY - lastMouse.y);
        lastMouse = { x: e.clientX, y: e.clientY };
        draw();
        return;
      }
      const { x, y } = toGraphCoords(e.clientX, e.clientY);
      hoveredNode = graph.nodes.find(n => {
        const dx = n.x - x, dy = n.y - y;
        return Math.sqrt(dx * dx + dy * dy) < 10;
      }) || null;
      canvas.style.cursor = hoveredNode ? "pointer" : "grab";
      draw();
    });
    canvas.addEventListener("wheel", e => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      transform.scale = Math.min(4, Math.max(0.2, transform.scale * factor));
      draw();
    }, { passive: false });

    window.addEventListener("resize", resize);
    resize();

    return () => window.removeEventListener("resize", resize);
  }, [graph]);

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 border border-dashed border-border/30 rounded-xl text-muted-foreground text-sm">
        No dictionary entries yet. Run a mission to populate the graph.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {Object.entries(domainColors).map(([k, c]) => (
          <span key={k} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
            {k.replace(/_/g, ' ')}
          </span>
        ))}
      </div>
      <div className="relative rounded-xl border border-border/40 overflow-hidden bg-card/20" style={{ height: 520 }}>
        <canvas ref={canvasRef} className="w-full h-full" style={{ cursor: "grab" }} />
        <div className="absolute bottom-3 right-3 text-xs text-muted-foreground bg-card/80 px-2 py-1 rounded-md border border-border/30">
          Scroll to zoom · Drag to pan · Hover for labels
        </div>
        <div className="absolute top-3 left-3 text-xs text-muted-foreground bg-card/80 px-2 py-1 rounded-md border border-border/30">
          {graph.nodes.length} nodes · {graph.edges.length} edges
        </div>
      </div>
    </div>
  );
}