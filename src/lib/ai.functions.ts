import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

const Input = z.object({
  letterType: z.string().min(1),
  prompt: z.string().min(3).max(2000),
  context: z
    .object({
      kepada: z.string().optional(),
      instansi: z.string().optional(),
      hari: z.string().optional(),
      tanggal_acara: z.string().optional(),
      jam: z.string().optional(),
      tempat: z.string().optional(),
    })
    .optional(),
});

export const generateLetterContent = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY tidak tersedia");
    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const ctx = data.context ?? {};
    const ctxParts = [
      ctx.kepada && `Kepada: ${ctx.kepada}`,
      ctx.instansi && `Instansi: ${ctx.instansi}`,
      ctx.hari && `Hari: ${ctx.hari}`,
      ctx.tanggal_acara && `Tanggal acara: ${ctx.tanggal_acara}`,
      ctx.jam && `Jam: ${ctx.jam}`,
      ctx.tempat && `Tempat: ${ctx.tempat}`,
    ].filter(Boolean).join("\n");

    const system =
      "Anda adalah asisten penulis surat resmi Bahasa Indonesia untuk Yayasan Generasi Cerdas Beraksi (GEN-CB). " +
      "Tulis isi surat yang formal, sopan, singkat, jelas, dan langsung pakai — tanpa placeholder seperti [Nama]. " +
      "Jangan sertakan kop surat, salam pembuka (Assalamu'alaikum), salam penutup, atau tanda tangan — hanya paragraf isi. " +
      "Gunakan gaya bahasa surat resmi organisasi Indonesia. Balas HANYA teks isi surat, tanpa penjelasan atau markdown.";

    const userPrompt = `Jenis surat: ${data.letterType}\nPermintaan: ${data.prompt}${ctxParts ? `\n\nDetail:\n${ctxParts}` : ""}\n\nTuliskan isi surat (2-4 paragraf).`;

    const { text } = await generateText({
      model,
      system,
      prompt: userPrompt,
    });

    return { text: text.trim() };
  });