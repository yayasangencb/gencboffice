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
  const linkElements = clonedDoc.querySelectorAll("link[rel='stylesheet']");
  linkElements.forEach((link) => link.remove());

  const styleElements = clonedDoc.querySelectorAll("style");
  styleElements.forEach((style) => {
    if (style.textContent) {
      style.textContent = style.textContent
        .replace(/oklch\([^)]+\)/gi, (match) => {
          if (match.includes("0.36")) return "#003B8F";
          if (match.includes("0.72")) return "#FF7A00";
          if (match.includes("0.99")) return "#FAFBFD";
          if (match.includes("0.2")) return "#1A202C";
          if (match.includes("1 0 0")) return "#FFFFFF";
          return "#003B8F";
        });
    }
  });

  const allElements = clonedDoc.querySelectorAll("*");
  allElements.forEach((el) => {
    const htmlEl = el as HTMLElement;
    if (htmlEl.style && htmlEl.style.cssText && htmlEl.style.cssText.includes("oklch")) {
      htmlEl.style.cssText = htmlEl.style.cssText.replace(/oklch\([^)]+\)/gi, "#003B8F");
    }
  });
}

export async function renderSvgForeignObjectToCanvas(
  el: HTMLElement,
  opts?: { width?: number; height?: number }
): Promise<HTMLCanvasElement> {
  const width = opts?.width || el.offsetWidth || 1080;
  const height = opts?.height || el.offsetHeight || 1350;

  const clone = el.cloneNode(true) as HTMLElement;
  clone.style.transform = "none";
  clone.style.margin = "0";
  clone.style.position = "static";

  const imgs = clone.querySelectorAll("img");
  for (let i = 0; i < imgs.length; i++) {
    const img = imgs[i];
    if (img.src && !img.src.startsWith("data:")) {
      try {
        const res = await fetch(img.src);
        const blob = await res.blob();
        await new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            img.src = reader.result as string;
            resolve();
          };
          reader.readAsDataURL(blob);
        });
      } catch {
        // Keep original src if fetch fails
      }
    }
  }

  const serialized = new XMLSerializer().serializeToString(clone);
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <foreignObject width="100%" height="100%">
      <div xmlns="http://www.w3.org/1999/xhtml">
        ${serialized}
      </div>
    </foreignObject>
  </svg>`;

  const canvas = document.createElement("canvas");
  canvas.width = width * 2;
  canvas.height = height * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context not available");

  const img = new Image();
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  await new Promise<void>((resolve, reject) => {
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve();
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });

  return canvas;
}

export async function renderElementToCanvas(
  el: HTMLElement,
  opts?: { width?: number; height?: number }
): Promise<HTMLCanvasElement> {
  try {
    const { default: html2canvas } = await import("html2canvas");
    return await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      onclone: (clonedDoc) => {
        sanitizeClonedDocForCanvas(clonedDoc);
        const elementsWithTransform = clonedDoc.querySelectorAll("*");
        elementsWithTransform.forEach((node) => {
          const htmlNode = node as HTMLElement;
          if (htmlNode.style && htmlNode.style.transform && htmlNode.style.transform.includes("scale")) {
            htmlNode.style.transform = "none";
          }
        });
      },
    });
  } catch (err) {
    console.warn("html2canvas error, using SVG foreignObject fallback:", err);
    return await renderSvgForeignObjectToCanvas(el, opts);
  }
}

export async function renderLetterToCanvas(el: HTMLElement): Promise<HTMLCanvasElement> {
  const { default: html2canvas } = await import("html2canvas");

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "210mm";
  container.style.height = "297mm";
  container.style.overflow = "hidden";
  container.style.backgroundColor = "#ffffff";
  container.style.zIndex = "-9999";

  const clone = el.cloneNode(true) as HTMLElement;
  clone.style.transform = "none";
  clone.style.width = "210mm";
  clone.style.height = "297mm";
  clone.style.position = "relative";
  clone.style.margin = "0";

  container.appendChild(clone);
  document.body.appendChild(container);

  const imgs = Array.from(clone.querySelectorAll("img"));
  await Promise.all(
    imgs.map((img) => {
      if (img.complete && img.naturalWidth !== 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    })
  );

  try {
    const canvas = await html2canvas(clone, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      onclone: (clonedDoc) => {
        sanitizeClonedDocForCanvas(clonedDoc);
      },
    });
    return canvas;
  } catch (e) {
    console.warn("html2canvas render failed, fallback to SVG foreignObject:", e);
    return await renderSvgForeignObjectToCanvas(el, { width: 794, height: 1123 });
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

export async function generateLetterPdf(el: HTMLElement, fileName: string) {
  const { default: jsPDF } = await import("jspdf");
  const canvas = await renderLetterToCanvas(el);
  const imgData = canvas.toDataURL("image/jpeg", 0.98);
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  pdf.addImage(imgData, "JPEG", 0, 0, 210, 297);
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