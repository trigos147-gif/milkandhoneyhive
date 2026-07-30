import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const DELIVERABLE_WORDS =
  "reels?|posts?|stories|blog\\s*posts?|videos?|newsletters?|carousels?|shorts?|tiktoks?|graphics?|emails?";

function extractRate(text: string): number | null {
  const isHourly = (endIndex: number) => /^\s*(?:\/|per)?\s*hour/i.test(text.slice(endIndex, endIndex + 15));

  const nearKeywordRe =
    /(?:retainer|monthly fee|rate|price|fee|payment|compensation)[^\n$]{0,40}\$\s?([\d,]+(?:\.\d{2})?)/gi;
  let m: RegExpExecArray | null;
  while ((m = nearKeywordRe.exec(text)) !== null) {
    if (!isHourly(m.index + m[0].length)) {
      const value = Number(m[1].replace(/,/g, ""));
      if (Number.isFinite(value)) return value;
    }
  }

  const anyAmountRe = /\$\s?([\d,]{2,}(?:\.\d{2})?)/g;
  while ((m = anyAmountRe.exec(text)) !== null) {
    if (!isHourly(m.index + m[0].length)) {
      const value = Number(m[1].replace(/,/g, ""));
      if (Number.isFinite(value)) return value;
    }
  }

  return null;
}

function normalizeDate(raw: string): string | null {
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function extractDates(text: string): { start: string | null; end: string | null } {
  const month =
    "(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\\.?";
  const datePattern = `(?:\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}|\\d{4}-\\d{2}-\\d{2}|${month}\\s+\\d{1,2},?\\s+\\d{4})`;

  const startMatch = text.match(
    new RegExp(`(?:effective|start(?:ing)? date|commenc\\w*)[^\\n]{0,30}(${datePattern})`, "i")
  );
  const endMatch = text.match(
    new RegExp(`(?:end date|through|until|expir\\w*|terminat\\w*)[^\\n]{0,30}(${datePattern})`, "i")
  );

  // Fallback: scan every date in the doc, but skip ones that are clearly payment/invoice
  // deadlines rather than actual contract term dates.
  const allMatches = [...text.matchAll(new RegExp(`\\b${datePattern}\\b`, "gi"))];
  const candidateDates = allMatches
    .filter((match) => {
      const before = text.slice(Math.max(0, match.index - 45), match.index).toLowerCase();
      return !/(due|invoice|no later than|late fee|paid within|penalty)/.test(before);
    })
    .map((match) => match[0]);

  const start = startMatch
    ? normalizeDate(startMatch[1])
    : candidateDates[0]
      ? normalizeDate(candidateDates[0])
      : null;
  const end = endMatch
    ? normalizeDate(endMatch[1])
    : candidateDates[1]
      ? normalizeDate(candidateDates[1])
      : null;

  return { start, end };
}

function extractBillingType(
  text: string
): "retainer" | "per_deliverable" | "one_time" | "as_needed" | null {
  const lower = text.toLowerCase();
  if (/\bretainer\b|\bmonthly (fee|rate)\b/.test(lower)) return "retainer";
  if (/\bone[-\s]?time\b|\bsingle project\b/.test(lower)) return "one_time";
  if (/\bper (post|deliverable|reel)\b/.test(lower)) return "per_deliverable";
  if (/\bas[-\s]?needed\b|\bper project basis\b/.test(lower)) return "as_needed";
  return null;
}

function extractDeliverables(text: string) {
  const results: { type: string; quantity: number; frequency: "weekly" | "monthly" | "one_time" }[] = [];
  const pattern = new RegExp(
    `(\\d+)\\s*(?:x|×)?\\s*(${DELIVERABLE_WORDS})\\s*(?:per|\\/|a)?\\s*(week|month)?`,
    "gi"
  );

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const quantity = Number(match[1]);
    if (!quantity || quantity > 500) continue;
    const type = match[2].replace(/\s+/g, " ").trim();
    const label = type.charAt(0).toUpperCase() + type.slice(1);
    const frequency = match[3]?.toLowerCase() === "week" ? "weekly" : match[3]?.toLowerCase() === "month" ? "monthly" : "monthly";
    if (results.some((r) => r.type.toLowerCase() === label.toLowerCase() && r.frequency === frequency)) {
      continue;
    }
    results.push({ type: label, quantity, frequency });
    if (results.length >= 10) break;
  }

  return results;
}

function extractNotes(text: string): string | null {
  const headingMatch = text.match(
    /^[ \t]*\d*\.?[ \t]*(?:Scope of (?:Work|Services)|Description of Services(?: to be [Pp]rovided)?)[ \t]*:?[ \t]*$/im
  );
  if (headingMatch && headingMatch.index !== undefined) {
    const after = text.slice(headingMatch.index + headingMatch[0].length);
    const lines: string[] = [];
    for (const rawLine of after.split("\n")) {
      const line = rawLine.trim();
      if (/^\d+\.\s+[A-Z]/.test(line)) break; // next numbered section heading
      if (line) lines.push(line.replace(/^[•\-\*]\s*/, ""));
      if (lines.length >= 4) break;
    }
    const cleaned = lines.join(" ").slice(0, 220);
    if (cleaned) return cleaned;
  }

  const inline = text.match(/description of services(?: to be provided)?\s*:\s*([^\n]{5,220})/i);
  if (inline) return inline[1].trim();

  return null;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let text = "";
  try {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    text = result.text;
  } catch (err) {
    console.error("PDF parse failed:", err);
    return NextResponse.json(
      { error: "Couldn't read text from that PDF." },
      { status: 400 }
    );
  }

  if (!text.trim()) {
    return NextResponse.json(
      { error: "No readable text found in that PDF (it may be a scanned image)." },
      { status: 400 }
    );
  }

  const { start, end } = extractDates(text);

  return NextResponse.json({
    billingType: extractBillingType(text),
    rateAmount: extractRate(text),
    contractStart: start,
    contractEnd: end,
    notes: extractNotes(text),
    deliverables: extractDeliverables(text),
  });
}
