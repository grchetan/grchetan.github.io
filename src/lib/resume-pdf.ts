import type { ResumeData } from "@/data/resume";

const ascii = (s: string) =>
  s
    .replace(/[–—]/g, "-")
    .replace(/·/g, "|")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, "...")
    .replace(/[↗•]/g, "");

/** Builds a clean, typeset A4 resume PDF document in the browser. */
export async function buildResumePdf(data: ResumeData) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "pt", format: "a4" });

  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();
  const M = 48;
  const inner = W - M * 2;
  let y = M;

  const ink = [26, 26, 32] as const;
  const soft = [104, 104, 122] as const;
  const accent = [92, 74, 214] as const;

  const nextPage = (need: number) => {
    if (y + need > H - M) {
      pdf.addPage();
      y = M;
    }
  };

  const text = (
    value: string,
    opts: { size?: number; style?: "normal" | "bold" | "italic"; color?: readonly number[]; indent?: number; gap?: number } = {},
  ) => {
    const { size = 9.5, style = "normal", color = ink, indent = 0, gap = 3 } = opts;
    pdf.setFont("helvetica", style);
    pdf.setFontSize(size);
    pdf.setTextColor(color[0]!, color[1]!, color[2]!);
    const lines = pdf.splitTextToSize(ascii(value), inner - indent) as string[];
    for (const line of lines) {
      nextPage(size + gap);
      pdf.text(line, M + indent, y + size * 0.85);
      y += size + gap;
    }
  };

  /* ---- header band ---- */
  pdf.setFillColor(accent[0], accent[1], accent[2]);
  pdf.rect(0, 0, W, 4, "F");
  y = M + 6;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(26);
  pdf.setTextColor(ink[0], ink[1], ink[2]);
  pdf.text(ascii(data.name), M, y);
  y += 18;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(accent[0], accent[1], accent[2]);
  pdf.text(ascii(data.role), M, y);
  y += 16;

  const contacts = [data.email, data.location, ...data.links].filter(Boolean).join("  |  ");
  text(contacts, { size: 8.6, color: soft, gap: 2 });
  y += 8;

  pdf.setDrawColor(210, 208, 220);
  pdf.setLineWidth(0.7);
  pdf.line(M, y, W - M, y);
  y += 16;

  const heading = (label: string) => {
    nextPage(40);
    y += 6;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(accent[0], accent[1], accent[2]);
    pdf.text(ascii(label.toUpperCase()), M, y + 8);
    y += 14;
    pdf.setDrawColor(226, 224, 236);
    pdf.line(M, y, W - M, y);
    y += 10;
  };

  if (data.summary.trim()) {
    heading("Summary");
    text(data.summary, { size: 9.5, color: soft, gap: 3.5 });
  }

  for (const section of data.sections) {
    const hasItems = section.kind === "items" ? Boolean(section.items?.length) : Boolean(section.groups?.length);
    if (!hasItems) continue;
    heading(section.heading);

    if (section.kind === "groups") {
      for (const g of section.groups ?? []) {
        nextPage(20);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9.2);
        pdf.setTextColor(ink[0], ink[1], ink[2]);
        pdf.text(ascii(g.label), M, y + 8);
        const before = y;
        y = before;
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(soft[0], soft[1], soft[2]);
        const lines = pdf.splitTextToSize(ascii(g.link ? `${g.value}  (${g.link})` : g.value), inner - 96) as string[];
        let ly = y;
        for (const line of lines) {
          pdf.text(line, M + 96, ly + 8);
          ly += 12;
        }
        y = Math.max(y + 14, ly + 2);
      }
      continue;
    }

    for (const item of section.items ?? []) {
      nextPage(34);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10.4);
      pdf.setTextColor(ink[0], ink[1], ink[2]);
      pdf.text(ascii(item.title), M, y + 9);
      if (item.meta) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8.6);
        pdf.setTextColor(soft[0], soft[1], soft[2]);
        pdf.text(ascii(item.meta), W - M, y + 9, { align: "right" });
      }
      y += 16;
      if (item.subtitle) text(item.subtitle, { size: 9, style: "italic", color: accent, gap: 3 });
      for (const b of item.bullets.filter((t) => t.trim())) {
        nextPage(16);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9.2);
        pdf.setTextColor(soft[0], soft[1], soft[2]);
        pdf.text("-", M + 4, y + 8);
        const lines = pdf.splitTextToSize(ascii(b), inner - 18) as string[];
        for (const line of lines) {
          nextPage(13);
          pdf.text(line, M + 16, y + 8);
          y += 12.5;
        }
      }
      y += 8;
    }
  }

  return pdf;
}

/** Builds the resume PDF and triggers a download. */
export async function downloadResumePdf(data: ResumeData) {
  const pdf = await buildResumePdf(data);
  pdf.save(`${data.name.replace(/\s+/g, "-")}-Resume.pdf`);
}

/** Builds the resume PDF and opens it in a new browser tab. */
export async function openResumePdf(data: ResumeData) {
  const url = await resumePdfObjectUrl(data);
  window.open(url, "_blank");
}

/** Builds the resume PDF and returns an object URL for inline preview. */
export async function resumePdfObjectUrl(data: ResumeData) {
  const pdf = await buildResumePdf(data);
  return URL.createObjectURL(pdf.output("blob"));
}
