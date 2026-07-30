import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const DELIVERABLE_WORDS =
  "reels?|posts?|stories|blog\\s*posts?|videos?|newsletters?|carousels?|shorts?|tiktoks?|graphics?|emails?";

function extractRate(text: string): number | null {
  // Prefer amounts near billing-ish words, else the first plausible dollar figure.
  const nearKeyword = text.match(
    /(?:retainer|monthly fee|rate|price|fee|payment)[^\n$]{0,40}\$\s?([\d,]+(?:\.\d{2})?)/i
  );
  const anyAmount = text.match(/\$\s?([\d,]{2,}(?:\.\d{2})?)/);
  const raw = nearKeyword?.[1] ?? anyAmount?.[1];
  if (!raw) return null;
  const value = Number(raw.replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}

function normalizeDate(raw: string): string | null {
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function extractDates(text: string): { start: string | null; end: string | null } {
  const datePattern =
    /\b(?:\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})\b/gi;

  const startMatch = text.match(
    new RegExp(`(?:effective|start(?:ing)? date|commenc\\w*)[^\\n]{0,30}(${datePattern.source})`, "i")
  );
  const endMatch = text.match(
    new RegExp(`(?:end date|through|until|expir\\w*|terminat\\w*)[^\\n]{0,30}(${datePattern.source})`, "i")
  );

  const allDates = [...text.matchAll(datePattern)].map((m) => m[0]);

  const start = startMatch ? normalizeDate(startMatch[1]) : allDates[0] ? normalizeDate(allDates[0]) : null;
  const end = endMatch ? normalizeDate(endMatch[1]) : allDates[1] ? normalizeDate(allDates[1]) : null;

  return { start, end };
}

function extractBillingType(
  text: string
): "retainer" | "per_deliverable" | "one_time" | "as_needed" {
  const lower = text.toLowerCase();
  if (/\bone[-\s]?time\b|\bsingle project\b/.test(lower)) return "one_time";
  if (/\bas[-\s]?needed\b|\bper project basis\b/.test(lower)) return "as_needed";
  if (/\bper (post|deliverable|reel|piece)\b/.test(lower)) return "per_deliverable";
  if (/\bretainer\b|\bmonthly (fee|rate)\b/.test(lower)) return "retainer";
  return "retainer";
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
  const scopeMatch = text.match(/scope of (?:work|services)[:\s]+([^\n]{20,220})/i);
  if (scopeMatch) return scopeMatch[1].trim();
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
  } catch {
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
