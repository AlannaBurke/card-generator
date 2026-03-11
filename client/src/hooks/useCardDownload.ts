/*
 * useCardDownload — Reliable card PNG export via native Canvas 2D API
 *
 * WHY NOT html2canvas:
 * html2canvas repeatedly fails with SecurityError (tainted canvas) when the
 * card contains CDN images, even after blob/data URL pre-fetching. The root
 * cause is that html2canvas internally re-fetches images in ways that bypass
 * our conversion, and the resulting canvas is tainted.
 *
 * SOLUTION:
 * Draw the card directly onto a Canvas 2D context using the same data that
 * drives the React component. Every image is pre-fetched as a data URL first
 * (same-origin), so the canvas is never tainted.
 */

import { useState, useCallback } from "react";
import { toast } from "sonner";
import type { AnimalCardData } from "@/components/AnimalCard";
import { HALT_LOGO_URL } from "@/components/AnimalCard";

// ─── Species icon CDN URLs (must mirror AnimalCard.tsx) ──────────────────────
const SPECIES_ICONS: Record<string, string> = {
  rabbit:       "https://d2xsxph8kpxj0f.cloudfront.net/310519663404885239/KSAnxKy3iVwgftKj5yQJFJ/icon-rabbit_b6677b67.png",
  "guinea pig": "https://d2xsxph8kpxj0f.cloudfront.net/310519663404885239/KSAnxKy3iVwgftKj5yQJFJ/icon-guinea-pig_58f3acd1.png",
  hamster:      "https://d2xsxph8kpxj0f.cloudfront.net/310519663404885239/KSAnxKy3iVwgftKj5yQJFJ/icon-hamster_9adc0dbd.png",
  rat:          "https://d2xsxph8kpxj0f.cloudfront.net/310519663404885239/KSAnxKy3iVwgftKj5yQJFJ/icon-rat_05c56a03.png",
  mouse:        "https://d2xsxph8kpxj0f.cloudfront.net/310519663404885239/KSAnxKy3iVwgftKj5yQJFJ/icon-mouse_98e84e11.png",
  chinchilla:   "https://d2xsxph8kpxj0f.cloudfront.net/310519663404885239/KSAnxKy3iVwgftKj5yQJFJ/icon-chinchilla_eb08eb51.png",
  gerbil:       "https://d2xsxph8kpxj0f.cloudfront.net/310519663404885239/KSAnxKy3iVwgftKj5yQJFJ/icon-gerbil_a994d4a5.png",
  other:        "https://d2xsxph8kpxj0f.cloudfront.net/310519663404885239/KSAnxKy3iVwgftKj5yQJFJ/icon-other_8f053e69.png",
};

function getSpeciesIconUrl(species: string): string {
  return SPECIES_ICONS[species?.toLowerCase()] ?? SPECIES_ICONS.other;
}

// Species colours (must mirror AnimalCard.tsx)
const SPECIES_COLORS: Record<string, { bg: string; text: string; tagText: string; label: string }> = {
  rabbit:        { bg: "#4BBFB8", text: "#fff",     tagText: "#1a6e6a", label: "Rabbit" },
  "guinea pig":  { bg: "#F4A88A", text: "#fff",     tagText: "#7a3a18", label: "Guinea Pig" },
  hamster:       { bg: "#F2C97E", text: "#5a3a00",  tagText: "#5a3a00", label: "Hamster" },
  rat:           { bg: "#A8C4E0", text: "#1a3a5a",  tagText: "#1a3a5a", label: "Rat" },
  mouse:         { bg: "#C8B4D8", text: "#3a1a5a",  tagText: "#3a1a5a", label: "Mouse" },
  chinchilla:    { bg: "#B8D4C8", text: "#1a4a38",  tagText: "#1a4a38", label: "Chinchilla" },
  gerbil:        { bg: "#D4C4A0", text: "#4a3a18",  tagText: "#4a3a18", label: "Gerbil" },
  other:         { bg: "#E8B4C0", text: "#5a1a2a",  tagText: "#5a1a2a", label: "Other" },
};

const ADOPTION_STATUS: Record<string, { label: string; icon: string; bg: string }> = {
  available:  { label: "Available for Adoption", icon: "💚", bg: "rgba(72,199,142,0.9)" },
  foster:     { label: "In Foster Care",          icon: "🏠", bg: "rgba(255,159,67,0.9)" },
  sanctuary:  { label: "Sanctuary Resident",      icon: "🌟", bg: "rgba(130,100,200,0.9)" },
};

function getSpeciesStyle(species: string) {
  return SPECIES_COLORS[species?.toLowerCase()] ?? SPECIES_COLORS.other;
}

/** Fetch any URL as a data URL (bypasses CORS taint) */
async function toDataUrl(url: string): Promise<string> {
  if (!url) return "";
  if (url.startsWith("data:")) return url;
  try {
    const res = await fetch(url, { mode: "cors" });
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return url;
  }
}

/** Load a src string into an HTMLImageElement */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Draw a rounded rectangle path */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/** Wrap text and return lines */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function drawCard(data: AnimalCardData, cardBgUrl: string): Promise<Blob> {
  const SCALE = 2;
  const CW = 560 * SCALE;
  const CH = 780 * SCALE;
  const s = SCALE;

  const canvas = document.createElement("canvas");
  canvas.width = CW;
  canvas.height = CH;
  const ctx = canvas.getContext("2d")!;

  // Pre-load all images as data URLs
  const [bgDataUrl, logoDataUrl, speciesIconDataUrl] = await Promise.all([
    toDataUrl(cardBgUrl),
    toDataUrl(HALT_LOGO_URL),
    toDataUrl(getSpeciesIconUrl(data.species)),
  ]);

  let photoImg: HTMLImageElement | null = null;
  if (data.photoUrl) {
    try {
      const photoData = data.photoUrl.startsWith("data:")
        ? data.photoUrl
        : await toDataUrl(data.photoUrl);
      photoImg = await loadImage(photoData);
    } catch { /* no photo */ }
  }

  const bgImg = await loadImage(bgDataUrl);
  const logoImg = await loadImage(logoDataUrl);
  let speciesIconImg: HTMLImageElement | null = null;
  try { speciesIconImg = await loadImage(speciesIconDataUrl); } catch { /* no icon */ }
  const sp = getSpeciesStyle(data.species);

  // ── 1. Card background ────────────────────────────────────────────────────
  ctx.fillStyle = "#fdf6ec";
  roundRect(ctx, 0, 0, CW, CH, 24 * s);
  ctx.fill();

  ctx.save();
  roundRect(ctx, 0, 0, CW, CH, 24 * s);
  ctx.clip();
  ctx.globalAlpha = 0.5;
  ctx.drawImage(bgImg, 0, 0, CW, CH);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(253,246,236,0.5)";
  ctx.fillRect(0, 0, CW, CH);
  ctx.restore();

  // ── 2. Header bar ──────────────────────────────────────────────────────────
  const PAD = 20 * s;
  const INNER_W = CW - PAD * 2;
  const headerY = PAD;
  const headerH = 82 * s;

  ctx.save();
  roundRect(ctx, PAD, headerY, INNER_W, headerH, 14 * s);
  const hGrad = ctx.createLinearGradient(PAD, headerY, PAD + INNER_W, headerY + headerH);
  hGrad.addColorStop(0, sp.bg + "f0");
  hGrad.addColorStop(1, sp.bg + "cc");
  ctx.fillStyle = hGrad;
  ctx.fill();
  ctx.restore();

  // Name
  ctx.fillStyle = sp.text;
  ctx.font = `bold ${30 * s}px Arial, sans-serif`;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillText(data.name || "Animal Name", PAD + 14 * s, headerY + 10 * s);

  // Card number
  if (data.cardNumber) {
    const nameW = ctx.measureText(data.name || "Animal Name").width;
    ctx.font = `bold ${14 * s}px Arial, sans-serif`;
    ctx.globalAlpha = 0.85;
    ctx.fillText(`#${String(data.cardNumber).padStart(3, "0")}`, PAD + 14 * s + nameW + 8 * s, headerY + 16 * s);
    ctx.globalAlpha = 1;
  }

  // Species icon + label
  const iconSize = 24 * s;
  const iconX = PAD + 14 * s;
  const iconY = headerY + 46 * s;
  if (speciesIconImg) {
    ctx.save();
    // Draw circular clip for the icon
    ctx.beginPath();
    ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fill();
    ctx.drawImage(speciesIconImg, iconX, iconY, iconSize, iconSize);
    ctx.restore();
  }
  ctx.font = `bold ${15 * s}px Arial, sans-serif`;
  ctx.fillStyle = sp.text;
  ctx.fillText(sp.label, iconX + iconSize + 5 * s, headerY + 52 * s);

  // HP text
  ctx.font = `bold ${20 * s}px Arial, sans-serif`;
  ctx.textAlign = "right";
  ctx.fillStyle = sp.text;
  ctx.fillText(`${data.hp ?? 75} HP`, PAD + INNER_W - 14 * s, headerY + 12 * s);

  // Hearts — always pink/red fill with white outline
  const HEART_FILL = "#e8365d";
  const HEART_STROKE = "rgba(255,255,255,0.9)";
  const filled = Math.round(((data.hp ?? 75) / 100) * 5);
  const hSize = 16 * s;
  const heartsRight = PAD + INNER_W - 14 * s;
  const heartsY = headerY + 48 * s;
  for (let i = 4; i >= 0; i--) {
    const hx = heartsRight - (4 - i) * (hSize + 3 * s) - hSize;
    ctx.save();
    ctx.globalAlpha = i < filled ? 1 : 0.4;
    ctx.strokeStyle = i < filled ? HEART_STROKE : "rgba(255,255,255,0.5)";
    ctx.fillStyle = HEART_FILL;
    ctx.lineWidth = 1.5 * s;
    const cx = hx + hSize / 2;
    const cy = heartsY + hSize / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy + hSize * 0.28);
    ctx.bezierCurveTo(cx - hSize * 0.5, cy, cx - hSize * 0.5, cy - hSize * 0.3, cx - hSize * 0.25, cy - hSize * 0.2);
    ctx.bezierCurveTo(cx - hSize * 0.05, cy - hSize * 0.38, cx, cy - hSize * 0.15, cx, cy - hSize * 0.02);
    ctx.bezierCurveTo(cx, cy - hSize * 0.15, cx + hSize * 0.05, cy - hSize * 0.38, cx + hSize * 0.25, cy - hSize * 0.2);
    ctx.bezierCurveTo(cx + hSize * 0.5, cy - hSize * 0.3, cx + hSize * 0.5, cy, cx, cy + hSize * 0.28);
    ctx.closePath();
    if (i < filled) ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  // ── 3. Adoption status badge ───────────────────────────────────────────────
  let curY = headerY + headerH + 8 * s;
  const statusInfo = (data.adoptionStatus && data.adoptionStatus !== "none") ? ADOPTION_STATUS[data.adoptionStatus] : null;
  if (statusInfo) {
    const bH = 32 * s;
    ctx.save();
    roundRect(ctx, PAD, curY, INNER_W, bH, 10 * s);
    ctx.fillStyle = statusInfo.bg;
    ctx.fill();
    ctx.restore();
    ctx.font = `bold ${14 * s}px Arial, sans-serif`;
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${statusInfo.icon} ${statusInfo.label}`, CW / 2, curY + bH / 2);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    curY += bH + 8 * s;
  }

  // ── 4. Photo ───────────────────────────────────────────────────────────────
  const photoH = 320 * s;
  ctx.save();
  roundRect(ctx, PAD, curY, INNER_W, photoH, 14 * s);
  ctx.clip();
  if (photoImg) {
    const iA = photoImg.naturalWidth / photoImg.naturalHeight;
    const bA = INNER_W / photoH;
    let sx = 0, sy = 0, sw = photoImg.naturalWidth, sh = photoImg.naturalHeight;
    if (iA > bA) { sw = sh * bA; sx = (photoImg.naturalWidth - sw) / 2; }
    else { sh = sw / bA; sy = 0; }
    ctx.drawImage(photoImg, sx, sy, sw, sh, PAD, curY, INNER_W, photoH);
  } else {
    ctx.fillStyle = "#f0ebe0";
    ctx.fillRect(PAD, curY, INNER_W, photoH);
  }
  ctx.restore();
  ctx.save();
  roundRect(ctx, PAD, curY, INNER_W, photoH, 14 * s);
  ctx.strokeStyle = sp.bg + "99";
  ctx.lineWidth = 3 * s;
  ctx.stroke();
  ctx.restore();
  curY += photoH + 8 * s;

  // ── 5. Stats row ───────────────────────────────────────────────────────────
  const stats = [
    { label: "Sex",    value: data.sex || "—",    icon: data.sex === "Female" ? "♀" : data.sex === "Male" ? "♂" : "⚥" },
    { label: "Age",    value: data.age || "—",    icon: "🌱" },
    { label: "Weight", value: data.weight || "—", icon: "⚖️" },
  ];
  const sW = (INNER_W - 14 * s) / 3;
  const sH = 64 * s;
  stats.forEach((stat, i) => {
    const sx2 = PAD + i * (sW + 7 * s);
    ctx.save();
    roundRect(ctx, sx2, curY, sW, sH, 10 * s);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fill();
    ctx.strokeStyle = sp.bg + "55";
    ctx.lineWidth = 2 * s;
    ctx.stroke();
    ctx.restore();
    ctx.textAlign = "center";
    ctx.font = `${14 * s}px Arial, sans-serif`;
    ctx.textBaseline = "top";
    ctx.fillStyle = "#3a2e22";
    ctx.fillText(stat.icon, sx2 + sW / 2, curY + 6 * s);
    ctx.font = `bold ${9 * s}px Arial, sans-serif`;
    ctx.fillStyle = "#7a6a5a";
    ctx.fillText(stat.label.toUpperCase(), sx2 + sW / 2, curY + 24 * s);
    ctx.font = `bold ${14 * s}px Arial, sans-serif`;
    ctx.fillStyle = "#3a2e22";
    ctx.fillText(stat.value, sx2 + sW / 2, curY + 38 * s);
  });
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  curY += sH + 7 * s;

  // ── 6. Personality tags ────────────────────────────────────────────────────
  if (data.personality) {
    const traits = data.personality.split(",").slice(0, 4).map((t) => t.trim()).filter(Boolean);
    let tagX = PAD;
    const tagH = 24 * s;
    ctx.font = `bold ${12 * s}px Arial, sans-serif`;
    for (const trait of traits) {
      const tw = ctx.measureText(trait).width + 20 * s;
      if (tagX + tw > PAD + INNER_W) break;
      ctx.save();
      roundRect(ctx, tagX, curY, tw, tagH, 12 * s);
      ctx.fillStyle = "rgba(255,255,255,0.88)";
      ctx.fill();
      ctx.strokeStyle = sp.bg + "88";
      ctx.lineWidth = 2 * s;
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = sp.tagText;
      ctx.textBaseline = "middle";
      ctx.fillText(trait, tagX + 10 * s, curY + tagH / 2);
      tagX += tw + 5 * s;
    }
    ctx.textBaseline = "top";
    curY += tagH + 5 * s;
  }

  // ── 7. Fun fact ────────────────────────────────────────────────────────────
  if (data.funFact) {
    const ffH = 32 * s;
    ctx.save();
    roundRect(ctx, PAD, curY, INNER_W, ffH, 10 * s);
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.fill();
    ctx.strokeStyle = sp.bg + "66";
    ctx.lineWidth = 2 * s;
    ctx.stroke();
    ctx.restore();
    ctx.font = `${14 * s}px Arial, sans-serif`;
    ctx.textBaseline = "middle";
    ctx.fillText("⭐", PAD + 10 * s, curY + ffH / 2);
    ctx.font = `bold ${12 * s}px Arial, sans-serif`;
    ctx.fillStyle = "#3a2e22";
    ctx.fillText(data.funFact, PAD + 30 * s, curY + ffH / 2);
    ctx.textBaseline = "top";
    curY += ffH + 5 * s;
  }

  // ── 8. Bio ─────────────────────────────────────────────────────────────────
  if (data.bio) {
    const lineH = 17 * s;
    const padV = 6 * s;
    const padH = 12 * s;
    ctx.font = `italic bold ${12 * s}px Arial, sans-serif`;
    const lines = wrapText(ctx, data.bio, INNER_W - padH * 2).slice(0, 4);
    const bioH = lines.length * lineH + padV * 2;
    ctx.save();
    roundRect(ctx, PAD, curY, INNER_W, bioH, 10 * s);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fill();
    ctx.strokeStyle = sp.bg + "33";
    ctx.lineWidth = 1.5 * s;
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = "#4a3c2e";
    lines.forEach((line, i) => {
      ctx.fillText(line, PAD + padH, curY + padV + i * lineH);
    });
  }

  // ── 9. Footer ──────────────────────────────────────────────────────────────
  const footerH = 60 * s;
  const footerY = CH - footerH;
  const fGrad = ctx.createLinearGradient(0, footerY - 20 * s, 0, CH);
  fGrad.addColorStop(0, "rgba(253,246,236,0)");
  fGrad.addColorStop(0.35, "rgba(253,246,236,0.82)");
  fGrad.addColorStop(1, "rgba(253,246,236,0.95)");
  ctx.fillStyle = fGrad;
  ctx.fillRect(0, footerY - 20 * s, CW, footerH + 20 * s);

  const logoSize = 30 * s;
  ctx.drawImage(logoImg, PAD, footerY + (footerH - logoSize) / 2, logoSize, logoSize);
  ctx.font = `bold ${12 * s}px Arial, sans-serif`;
  ctx.fillStyle = "#1a5a56";
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText("Helping All Little Things", PAD + logoSize + 7 * s, footerY + footerH / 2);
  ctx.font = `bold ${10 * s}px Arial, sans-serif`;
  ctx.fillStyle = "#2a6a66";
  ctx.textAlign = "right";
  ctx.fillText("helpingalllittlethings.org", PAD + INNER_W, footerY + footerH / 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  // ── 10. Border rings ───────────────────────────────────────────────────────
  ctx.save();
  roundRect(ctx, 7 * s, 7 * s, CW - 14 * s, CH - 14 * s, 19 * s);
  ctx.strokeStyle = sp.bg;
  ctx.lineWidth = 4 * s;
  ctx.stroke();
  roundRect(ctx, 13 * s, 13 * s, CW - 26 * s, CH - 26 * s, 14 * s);
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 2 * s;
  ctx.stroke();
  ctx.restore();

  // ── Export ─────────────────────────────────────────────────────────────────
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("canvas.toBlob returned null"));
    }, "image/png");
  });
}

export function useCardDownload(cardBgUrl: string) {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadCard = useCallback(async (data: AnimalCardData) => {
    if (!data.name?.trim()) {
      toast.error("Please enter the animal's name first! 🐾");
      return;
    }
    setIsDownloading(true);
    const toastId = toast.loading(`Generating ${data.name}'s card...`);
    try {
      const blob = await drawCard(data, cardBgUrl);
      const safeName = data.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "animal-card";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast.dismiss(toastId);
      toast.success(`Downloaded as ${safeName}.png 💛`);
    } catch (err) {
      console.error("Card download failed:", err);
      toast.dismiss(toastId);
      toast.error("Download failed — please try again.");
    } finally {
      setIsDownloading(false);
    }
  }, [cardBgUrl]);

  return { downloadCard, isDownloading };
}
