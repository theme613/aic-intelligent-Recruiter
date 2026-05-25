import { NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No PDF file provided." }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Only PDF files are supported on this endpoint." },
        { status: 400 },
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });
    const merged =
      typeof text === "string" ? text : (text as string[]).join("\n\n");

    if (!merged.trim()) {
      return NextResponse.json(
        {
          error:
            "No text could be extracted. The PDF may be scanned images only — try pasting resume text manually.",
        },
        { status: 422 },
      );
    }

    return NextResponse.json({
      text: merged,
      filename: file.name,
    });
  } catch (err) {
    console.error("PDF parse error:", err);
    return NextResponse.json(
      {
        error:
          "Failed to parse PDF. The file may be corrupted, password-protected, or unsupported.",
      },
      { status: 500 },
    );
  }
}
