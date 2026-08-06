import { tierFor, type RankedRow } from "@/lib/arcade";

const ascii = (s: string) => s.replace(/[–—]/g, "-").replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

/**
 * Builds a landscape A4 certificate for a leaderboard placing.
 * Returns a jsPDF instance so callers can save() or preview it.
 */
export async function buildArcadeCertificate(row: RankedRow, customTitle?: string) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });

  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();

  const ink = [24, 24, 34] as const;
  const soft = [110, 110, 130] as const;
  const red = [214, 64, 58] as const;
  const amber = [222, 160, 40] as const;
  const pink = [212, 70, 140] as const;
  const blue = [78, 96, 214] as const;

  // paper
  pdf.setFillColor(250, 249, 246);
  pdf.rect(0, 0, W, H, "F");

  // prism top + bottom bars
  const bands = [red, amber, pink, blue];
  bands.forEach((c, i) => {
    pdf.setFillColor(c[0] ?? 0, c[1] ?? 0, c[2] ?? 0);
    pdf.rect((W / 4) * i, 0, W / 4, 10, "F");
    pdf.rect((W / 4) * i, H - 10, W / 4, 10, "F");
  });

  // frame
  pdf.setDrawColor(ink[0], ink[1], ink[2]);
  pdf.setLineWidth(0.8);
  pdf.rect(34, 28, W - 68, H - 56);
  pdf.setDrawColor(soft[0], soft[1], soft[2]);
  pdf.setLineWidth(0.4);
  pdf.rect(44, 38, W - 88, H - 76);

  const centre = (
    value: string,
    y: number,
    opts: { size?: number; style?: "normal" | "bold" | "italic"; color?: readonly number[] } = {},
  ) => {
    const { size = 12, style = "normal", color = ink } = opts;
    pdf.setFont("helvetica", style);
    pdf.setFontSize(size);
    pdf.setTextColor(color[0] ?? 0, color[1] ?? 0, color[2] ?? 0);
    pdf.text(ascii(value), W / 2, y, { align: "center" });
  };

  const tier = tierFor(row.rank);

  centre("SIGNAL RUSH  ·  ARCADE LEADERBOARD", 92, { size: 9.5, color: soft });
  centre("Certificate of Achievement", 138, { size: 30, style: "bold" });
  centre("presented to", 172, { size: 10, style: "italic", color: soft });
  centre(row.name, 218, { size: 40, style: "bold", color: blue });

  pdf.setDrawColor(soft[0], soft[1], soft[2]);
  pdf.setLineWidth(0.5);
  pdf.line(W / 2 - 150, 236, W / 2 + 150, 236);

  centre(
    `for finishing ${tier?.note ?? `rank #${row.rank}`} on the ${customTitle ?? "Signal Rush leaderboard"}`,
    268,
    { size: 12 },
  );
  centre(tier?.label ?? `Rank #${row.rank}`, 316, { size: 22, style: "bold", color: red });

  const stats = [
    ["Rank", `#${row.rank}`],
    ["Score", row.score.toLocaleString()],
    ["Accuracy", `${row.accuracy}%`],
    ["Best combo", `x${row.combo}`],
  ];
  const cellW = 150;
  const startX = W / 2 - (cellW * stats.length) / 2;
  stats.forEach(([label, value], i) => {
    const x = startX + cellW * i + cellW / 2;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(soft[0], soft[1], soft[2]);
    pdf.text(String(label).toUpperCase(), x, 366, { align: "center" });
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(15);
    pdf.setTextColor(ink[0], ink[1], ink[2]);
    pdf.text(String(value), x, 388, { align: "center" });
  });

  const issued = new Date(row.createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(soft[0], soft[1], soft[2]);
  pdf.text(`Player ID: ${row.handle}`, 72, H - 74);
  pdf.text(`Issued: ${issued}`, 72, H - 58);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.setTextColor(ink[0], ink[1], ink[2]);
  pdf.text("Chetan Prajapat", W - 72, H - 74, { align: "right" });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(soft[0], soft[1], soft[2]);
  pdf.text("Full stack developer · Arcade host", W - 72, H - 58, { align: "right" });

  // verification link back to the portfolio
  const site = "https://grchetan.github.io/";
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9.5);
  pdf.setTextColor(blue[0], blue[1], blue[2]);
  pdf.textWithLink(site, W / 2, H - 62, { align: "center", url: site });
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7.5);
  pdf.setTextColor(soft[0], soft[1], soft[2]);
  pdf.text("Verify this certificate on the portfolio arcade leaderboard", W / 2, H - 50, {
    align: "center",
  });

  // scannable QR that opens the portfolio
  try {
    const QRCode = (await import("qrcode")).default;
    const dataUrl = await QRCode.toDataURL(site, {
      margin: 1,
      width: 320,
      color: { dark: "#181822", light: "#FAF9F6" },
    });
    const size = 76;
    const qrX = W - 72 - size;
    const qrY = 74;
    pdf.addImage(dataUrl, "PNG", qrX, qrY, size, size);
    pdf.link(qrX, qrY, size, size, { url: site });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    pdf.setTextColor(soft[0], soft[1], soft[2]);
    pdf.text("SCAN TO VISIT", qrX + size / 2, qrY + size + 11, { align: "center" });
  } catch {
    // QR is decorative — never block the certificate download.
  }

  return pdf;
}

export async function downloadArcadeCertificate(row: RankedRow, customTitle?: string) {
  const pdf = await buildArcadeCertificate(row, customTitle);
  pdf.save(`signal-rush-${row.handle}-rank-${row.rank}.pdf`);
}
