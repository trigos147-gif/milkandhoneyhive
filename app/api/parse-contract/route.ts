import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You extract structured contract data from social media management / content creation service contracts. Respond with ONLY valid JSON, no markdown code fences, no preamble or explanation — just the JSON object, matching this exact shape:

{
  "billingType": "retainer" | "per_deliverable" | "one_time" | "as_needed",
  "rateAmount": number | null,
  "contractStart": "YYYY-MM-DD" | null,
  "contractEnd": "YYYY-MM-DD" | null,
  "notes": string | null,
  "deliverables": [{ "type": string, "quantity": number, "frequency": "weekly" | "monthly" | "one_time" }]
}

Rules:
- If a field can't be determined from the text, use null (or an empty array for deliverables). Never guess a specific dollar amount or date that isn't actually stated.
- Keep "notes" to a short 1-2 sentence scope summary, in your own words.
- Infer deliverable "type" from context using short labels like "Reels", "Posts", "Stories", "Blog posts", "Newsletters".
- "quantity" and "frequency" together should describe the recurring cadence (e.g. 4 Reels / weekly), or for a one-time deliverable use frequency "one_time".`;

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
    text = result.text.slice(0, 15000);
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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Auto-fill isn't configured yet — ANTHROPIC_API_KEY is missing." },
      { status: 500 }
    );
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `Contract text:\n\n${text}` }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    return NextResponse.json(
      { error: `AI parsing failed: ${errText.slice(0, 300)}` },
      { status: 502 }
    );
  }

  const data = await response.json();
  const textBlock = (data.content ?? []).find(
    (b: { type: string }) => b.type === "text"
  );

  if (!textBlock) {
    return NextResponse.json({ error: "No response from AI." }, { status: 502 });
  }

  try {
    const cleaned = textBlock.text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(
      { error: "Couldn't parse the AI's response." },
      { status: 502 }
    );
  }
}
