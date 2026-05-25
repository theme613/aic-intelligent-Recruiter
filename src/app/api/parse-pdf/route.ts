import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";

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

    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    await parser.destroy();

    return NextResponse.json({
      text: textResult.text,
      filename: file.name,
    });
  } catch (err) {
    console.error("PDF parse error:", err);
    return NextResponse.json(
      { error: "Failed to parse PDF. The file may be corrupted or password-protected." },
      { status: 500 },
    );
  }
}
