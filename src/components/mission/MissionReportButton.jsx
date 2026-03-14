import React, { useState } from "react";
import { entities } from "@/api/entitiesClient";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, FileText, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";

const agents = [
  { key: "electrochemistry_researcher", codename: "Faraday", domain: "Electrochemistry" },
  { key: "thermochemistry_researcher", codename: "Carnot", domain: "Thermochemistry" },
  { key: "kinetics_researcher", codename: "Arrhenius", domain: "Kinetics" },
  { key: "organic_chemistry_researcher", codename: "Kekulé", domain: "Organic Chemistry" },
  { key: "quantum_chemistry_researcher", codename: "Bohr", domain: "Quantum Chemistry" },
  { key: "stoichiometry_researcher", codename: "Lavoisier", domain: "Stoichiometry" },
];

async function fetchReportData(mission, agentResponses) {
  // Fetch dictionary entries created around the time of this mission
  const allEntries = await entities.MathDictionary.list("-created_date", 200);
  const missionDate = new Date(mission.created_date).getTime();
  const windowMs = 2 * 60 * 60 * 1000; // 2 hour window
  const entries = allEntries.filter(e => {
    const t = new Date(e.created_date).getTime();
    return t >= missionDate - 5000 && t <= missionDate + windowMs;
  });
  return { entries };
}

function buildMarkdown(mission, agentResponses, entries) {
  const date = new Date(mission.created_date).toLocaleString();
  let md = `# ChemLang Mission Report\n\n`;
  md += `**Date:** ${date}\n\n`;
  md += `**Status:** ${mission.status}\n\n`;
  md += `---\n\n`;
  md += `## Mission Prompt\n\n> ${mission.prompt}\n\n`;

  const hasResponses = agentResponses && Object.keys(agentResponses).length > 0;
  if (hasResponses) {
    md += `---\n\n## Agent Responses\n\n`;
    agents.forEach(a => {
      const resp = agentResponses[a.key];
      if (resp) {
        md += `### ${a.codename} — ${a.domain}\n\n${resp}\n\n`;
      }
    });
  }

  if (entries.length > 0) {
    md += `---\n\n## Dictionary Entries Created (${entries.length})\n\n`;
    entries.forEach(e => {
      md += `### ${e.concept_name}\n\n`;
      md += `**Domain:** ${e.domain}\n\n`;
      if (e.chemistry_notation) md += `**Chemistry Notation:** \`${e.chemistry_notation}\`\n\n`;
      if (e.math_formalism) md += `**Math Formalism:**\n\`\`\`\n${e.math_formalism}\n\`\`\`\n\n`;
      if (e.natural_language) md += `**Explanation:** ${e.natural_language}\n\n`;
      if (e.code_representation) md += `**Code:**\n\`\`\`\n${e.code_representation}\n\`\`\`\n\n`;
      if (e.variables?.length) {
        md += `**Variables:**\n`;
        e.variables.forEach(v => md += `- \`${v.symbol}\`: ${v.meaning}${v.unit ? ` (${v.unit})` : ""}\n`);
        md += `\n`;
      }
      md += `---\n\n`;
    });
  }

  return md;
}

function downloadMarkdown(mission, agentResponses, entries) {
  const md = buildMarkdown(mission, agentResponses, entries);
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mission-report-${mission.id.slice(0, 8)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadPDF(mission, agentResponses, entries) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  const maxW = pageW - margin * 2;
  let y = 20;

  const addText = (text, size = 10, style = "normal", color = [220, 230, 240]) => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(String(text), maxW);
    doc.text(lines, margin, y);
    y += lines.length * (size * 0.45) + 2;
  };

  const addRule = () => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.setDrawColor(50, 65, 80);
    doc.line(margin, y, pageW - margin, y);
    y += 5;
  };

  // Dark background
  doc.setFillColor(12, 17, 23);
  doc.rect(0, 0, pageW, doc.internal.pageSize.getHeight(), "F");

  addText("ChemLang Mission Report", 20, "bold", [14, 165, 233]);
  y += 2;
  addText(`Date: ${new Date(mission.created_date).toLocaleString()}`, 9, "normal", [100, 120, 140]);
  addText(`Status: ${mission.status}`, 9, "normal", [100, 120, 140]);
  y += 3;
  addRule();

  addText("Mission Prompt", 13, "bold", [14, 165, 233]);
  y += 1;
  addText(mission.prompt, 10, "normal", [200, 215, 230]);
  y += 4;
  addRule();

  const hasResponses = agentResponses && Object.keys(agentResponses).length > 0;
  if (hasResponses) {
    addText("Agent Responses", 13, "bold", [14, 165, 233]);
    y += 2;
    agents.forEach(a => {
      const resp = agentResponses[a.key];
      if (resp) {
        addText(`${a.codename} — ${a.domain}`, 11, "bold", [180, 200, 220]);
        // Strip markdown for PDF
        const clean = resp.replace(/#{1,6}\s/g, "").replace(/\*\*/g, "").replace(/`/g, "");
        addText(clean.slice(0, 1500), 9, "normal", [160, 175, 190]);
        y += 3;
      }
    });
    addRule();
  }

  if (entries.length > 0) {
    addText(`Dictionary Entries (${entries.length})`, 13, "bold", [14, 165, 233]);
    y += 2;
    entries.forEach(e => {
      if (y > 255) { doc.addPage(); y = 20; doc.setFillColor(12, 17, 23); doc.rect(0, 0, pageW, doc.internal.pageSize.getHeight(), "F"); }
      addText(e.concept_name, 11, "bold", [168, 85, 247]);
      addText(`Domain: ${e.domain}`, 9, "italic", [100, 120, 140]);
      if (e.math_formalism) addText(e.math_formalism.slice(0, 300), 9, "normal", [200, 215, 230]);
      if (e.natural_language) addText(e.natural_language.slice(0, 200), 9, "normal", [160, 175, 190]);
      y += 3;
    });
  }

  doc.save(`mission-report-${mission.id.slice(0, 8)}.pdf`);
}

export default function MissionReportButton({ mission, agentResponses = {} }) {
  const [loading, setLoading] = useState(false);

  const handle = async (format) => {
    setLoading(true);
    const { entries } = await fetchReportData(mission, agentResponses);
    if (format === "md") downloadMarkdown(mission, agentResponses, entries);
    else downloadPDF(mission, agentResponses, entries);
    setLoading(false);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" disabled={loading}>
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handle("md")}>
          <FileText className="w-4 h-4 mr-2" /> Download Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handle("pdf")}>
          <FileText className="w-4 h-4 mr-2" /> Download PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}