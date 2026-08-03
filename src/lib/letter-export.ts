import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, ImageRun, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";
import { formatIdDate } from "@/lib/brand";
import type { LetterData } from "@/components/letter-preview";
import type { Organization } from "@/lib/org";

async function urlToUint8(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  } catch { return null; }
}

function inferType(url: string): "png" | "jpg" | "gif" | "bmp" {
  const u = url.toLowerCase();
  if (u.startsWith("data:image/jpeg") || u.endsWith(".jpg") || u.endsWith(".jpeg")) return "jpg";
  if (u.startsWith("data:image/gif") || u.endsWith(".gif")) return "gif";
  if (u.startsWith("data:image/bmp") || u.endsWith(".bmp")) return "bmp";
  return "png";
}

export async function generateLetterDocx(data: LetterData, org: Organization): Promise<Blob> {
  const logoBytes = await urlToUint8(org.logo_url || "/logo.png").catch(() => null);

  const p = (text: string, opts?: { bold?: boolean; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; size?: number }) =>
    new Paragraph({
      alignment: opts?.align,
      children: [new TextRun({ text, bold: opts?.bold, size: opts?.size ?? 24, font: "Times New Roman" })],
    });

  const headerChildren: Paragraph[] = [];
  if (logoBytes) {
    headerChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new ImageRun({ type: "png", data: logoBytes, transformation: { width: 70, height: 70 }, altText: { title: "Logo", description: "Logo", name: "logo" } })],
      }),
    );
  }
  headerChildren.push(
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `YAYASAN ${org.name.toUpperCase()}`, bold: true, size: 32, color: "003B8F", font: "Times New Roman" })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '"Generasi Cerdas Beraksi"', italics: true, size: 20, color: "003B8F", font: "Times New Roman" })] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: [org.address, org.phone && `Telp: ${org.phone}`, org.email, org.website].filter(Boolean).join(" · "), size: 18, font: "Times New Roman" })],
    }),
    new Paragraph({
      border: { bottom: { style: BorderStyle.DOUBLE, size: 12, color: "003B8F", space: 1 } },
      children: [new TextRun("")],
    }),
    p(""),
  );

  const numRow = new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [4680, 4680],
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 4680, type: WidthType.DXA },
            children: [
              p(`Nomor    : ${data.letter_number}`),
              data.lampiran ? p(`Lampiran : ${data.lampiran}`) : p(""),
              p(`Perihal  : ${data.perihal}`, { bold: true }),
            ],
          }),
          new TableCell({
            width: { size: 4680, type: WidthType.DXA },
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: `${(data.tempat_surat || "").trim() ? data.tempat_surat + ", " : ""}${formatIdDate(data.letter_date)}`, size: 24, font: "Times New Roman" })],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const body: (Paragraph | Table)[] = [
    ...headerChildren,
    numRow,
    p(""),
    p("Kepada Yth,"),
    p(data.kepada, { bold: true }),
    ...(data.instansi ? [p(data.instansi)] : []),
    p("di —"),
    ...(data.alamat ? [p(`    ${data.alamat}`, { bold: true })] : []),
    p(""),
    p("Dengan hormat,"),
  ];

  const paragraphs = data.isi_surat.split(/\n\n+/).filter(Boolean);
  for (const par of paragraphs) {
    body.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: par.replace(/\n/g, " "), size: 24, font: "Times New Roman" })] }));
  }

  if (data.hari || data.tanggal_acara || data.jam || data.tempat) {
    body.push(p(""));
    if (data.hari) body.push(p(`     Hari      : ${data.hari}`));
    if (data.tanggal_acara) body.push(p(`     Tanggal   : ${formatIdDate(data.tanggal_acara)}`));
    if (data.jam) body.push(p(`     Waktu     : ${data.jam}`));
    if (data.tempat) body.push(p(`     Tempat    : ${data.tempat}`));
  }

  if (data.penutup) {
    body.push(p(""));
    body.push(new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: data.penutup, size: 24, font: "Times New Roman" })] }));
  }

  body.push(p(""), p(""));

  // Signatures
  const sekBytes = data.ttd_sekretaris_url ? await urlToUint8(data.ttd_sekretaris_url) : null;
  const ketBytes = data.ttd_ketua_url ? await urlToUint8(data.ttd_ketua_url) : null;
  const signCell = (title: string, name: string, img: Uint8Array | null, imgUrl?: string) =>
    new TableCell({
      width: { size: 4680, type: WidthType.DXA },
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: title, size: 24, font: "Times New Roman" })] }),
        img
          ? new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ type: inferType(imgUrl || ""), data: img, transformation: { width: 100, height: 60 }, altText: { title: "TTD", description: "TTD", name: "ttd" } })] })
          : new Paragraph({ children: [new TextRun("")] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: name || "(...)", bold: true, underline: {}, size: 24, font: "Times New Roman" })] }),
      ],
    });

  const sigTable = new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [4680, 4680],
    borders: {
      top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    },
    rows: [
      new TableRow({
        children: [
          signCell("Sekretaris", data.sekretaris_name, sekBytes, data.ttd_sekretaris_url),
          signCell(data.jabatan || "Ketua", data.ketua_name, ketBytes, data.ttd_ketua_url),
        ],
      }),
    ],
  });

  body.push(sigTable);

  const doc = new Document({
    styles: { default: { document: { run: { font: "Times New Roman", size: 24 } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: { top: 1247, right: 1247, bottom: 1020, left: 1247 },
          },
        },
        children: body,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

export function sanitizeClonedDocForCanvas(clonedDoc: Document) {
  const styleElements = clonedDoc.querySelectorAll("style");
  styleElements.forEach((style) => {
    if (style.textContent && style.textContent.includes("oklch")) {
      style.textContent = style.textContent
        .replace(/oklch\(0\.36[^)]+\)/gi, "#003B8F")
        .replace(/oklch\(0\.72[^)]+\)/gi, "#FF7A00")
        .replace(/oklch\(0\.99[^)]+\)/gi, "#FAFBFD")
        .replace(/oklch\(0\.2[^)]+\)/gi, "#1A202C")
        .replace(/oklch\(1 0 0[^)]+\)/gi, "#FFFFFF")
        .replace(/oklch\([^)]+\)/gi, "#003B8F");
    }
  });

  const allElements = clonedDoc.querySelectorAll("*");
  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    if (htmlEl.style && htmlEl.style.cssText && htmlEl.style.cssText.includes("oklch")) {
      htmlEl.style.cssText = htmlEl.style.cssText
        .replace(/oklch\(0\.36[^)]+\)/gi, "#003B8F")
        .replace(/oklch\(0\.72[^)]+\)/gi, "#FF7A00")
        .replace(/oklch\(0\.99[^)]+\)/gi, "#FAFBFD")
        .replace(/oklch\(0\.2[^)]+\)/gi, "#1A202C")
        .replace(/oklch\(1 0 0[^)]+\)/gi, "#FFFFFF")
        .replace(/oklch\([^)]+\)/gi, "#003B8F");
    }
  });
}

export async function generateLetterPdf(el: HTMLElement, fileName: string) {
  const [{ default: html2canvas }, jsPDFmod] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  const jsPDF = jsPDFmod.default;
  const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    onclone: (clonedDoc) => {
      sanitizeClonedDocForCanvas(clonedDoc);
    },
  });
  const imgData = canvas.toDataURL("image/jpeg", 0.95);
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgW = pageW;
  const imgH = (canvas.height * imgW) / canvas.width;
  let heightLeft = imgH;
  let position = 0;
  pdf.addImage(imgData, "JPEG", 0, position, imgW, imgH);
  heightLeft -= pageH;
  while (heightLeft > 0) {
    position = heightLeft - imgH;
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", 0, position, imgW, imgH);
    heightLeft -= pageH;
  }
  pdf.save(fileName);
}

export function downloadBlob(blob: Blob, filename: string) {
  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}