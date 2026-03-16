/*
 * PhotoEditor — Modal photo editing component
 * Design: Cottagecore Pokédex — matches HALT brand
 *
 * CROP IMPLEMENTATION:
 *   - react-image-crop reports crop coordinates in the DISPLAYED image's pixel space.
 *   - To convert to natural pixels: scaleX = img.naturalWidth / img.getBoundingClientRect().width
 *   - getBoundingClientRect() gives the true rendered size (correct even inside flex containers).
 *
 * CROPPED PREVIEW:
 *   - Whenever the crop or rotation changes, we compute a croppedPreviewSrc (data URL)
 *     so the Adjust and AI Style tabs always show the cropped version, not the full image.
 *
 * STYLE CACHE:
 *   - Generated style images are stored in styleCache: Record<styleId, dataUrl>
 *   - Clicking a previously-generated style shows the cached result instantly.
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface PhotoEditorProps {
  src: string;           // data URL from FileReader or blob→data conversion
  onApply: (result: string) => void;
  onClose: () => void;
}

interface Adjustments {
  brightness: number;   // 0–200 (100 = normal)
  contrast: number;
  saturation: number;
}

const DEFAULT_ADJ: Adjustments = { brightness: 100, contrast: 100, saturation: 100 };

// Card photo area: 520×320px (INNER_W = 560 - 20*2 = 520, photoH = 320)
// Aspect ratio = 520/320 = 1.625 (13:8 landscape)
const CARD_PHOTO_ASPECT = 520 / 320; // 1.625

/** Default crop: centered, locked to the card photo aspect ratio (percentage units) */
function centerCardCrop(displayW: number, displayH: number): Crop {
  // Fit the crop inside the image while maintaining CARD_PHOTO_ASPECT
  // Try 90% width first; if the resulting height exceeds 90%, reduce width
  let w = 90;
  let h = (w / 100) * displayW / CARD_PHOTO_ASPECT / displayH * 100;
  if (h > 90) {
    h = 90;
    w = (h / 100) * displayH * CARD_PHOTO_ASPECT / displayW * 100;
  }
  w = Math.min(w, 100);
  h = Math.min(h, 100);
  return {
    unit: "%",
    x: (100 - w) / 2,
    y: (100 - h) / 2,
    width: w,
    height: h,
  };
}

/** Convert a percentage crop + image element into a PixelCrop */
function percentToPixelCrop(crop: Crop, img: HTMLImageElement): PixelCrop {
  const rect = img.getBoundingClientRect();
  const dw = rect.width;
  const dh = rect.height;
  return {
    unit: "px",
    x: (crop.x / 100) * dw,
    y: (crop.y / 100) * dh,
    width: (crop.width / 100) * dw,
    height: (crop.height / 100) * dh,
  };
}

/** Rotate a loaded HTMLImageElement by degrees and return a data URL */
function rotateToDataUrl(img: HTMLImageElement, degrees: number): string {
  const rad = (degrees * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const newW = Math.round(w * cos + h * sin);
  const newH = Math.round(w * sin + h * cos);

  const canvas = document.createElement("canvas");
  canvas.width = newW;
  canvas.height = newH;
  const ctx = canvas.getContext("2d")!;
  ctx.translate(newW / 2, newH / 2);
  ctx.rotate(rad);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  return canvas.toDataURL("image/jpeg", 0.95);
}

/** Render a cropped data URL from an image element + pixel crop (no filters) */
function computeCroppedDataUrl(img: HTMLImageElement, pixelCrop: PixelCrop): string {
  const rect = img.getBoundingClientRect();
  const scaleX = img.naturalWidth / rect.width;
  const scaleY = img.naturalHeight / rect.height;

  const cropX = Math.max(0, Math.round(pixelCrop.x * scaleX));
  const cropY = Math.max(0, Math.round(pixelCrop.y * scaleY));
  const cropW = Math.max(1, Math.min(Math.round(pixelCrop.width * scaleX), img.naturalWidth - cropX));
  const cropH = Math.max(1, Math.min(Math.round(pixelCrop.height * scaleY), img.naturalHeight - cropY));

  const maxDim = 600; // preview size — not the final output
  const scale = Math.min(1, maxDim / Math.max(cropW, cropH));
  const outW = Math.round(cropW * scale);
  const outH = Math.round(cropH * scale);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, outW, outH);
  return canvas.toDataURL("image/jpeg", 0.92);
}

const STYLES = [
  {
    id: "pokemon" as const,
    label: "Pokémon",
    emoji: "⚡",
    desc: "Bold outlines, vibrant colors, chibi Pokémon card style with nature background",
    gradient: "linear-gradient(135deg, #FFCB05, #3D7DCA)",
    textColor: "#1a3a6a",
  },
  {
    id: "kawaii" as const,
    label: "Kawaii",
    emoji: "🌸",
    desc: "Soft pastels, big sparkly eyes, dreamy pastel background",
    gradient: "linear-gradient(135deg, #FFB7D5, #C8A4E8)",
    textColor: "#6a1a5a",
  },
  {
    id: "comic" as const,
    label: "Comic Book",
    emoji: "💥",
    desc: "Bold ink outlines, halftone dots, retro pop-art energy",
    gradient: "linear-gradient(135deg, #FF6B35, #F7C59F)",
    textColor: "#5a1a00",
  },
  {
    id: "watercolor" as const,
    label: "Watercolor",
    emoji: "🎨",
    desc: "Soft painted washes, organic edges, nature field guide aesthetic",
    gradient: "linear-gradient(135deg, #7EC8C8, #B5D5A0)",
    textColor: "#1a3a2a",
  },
];

export default function PhotoEditor({ src, onApply, onClose }: PhotoEditorProps) {
  const originalImgRef = useRef<HTMLImageElement | null>(null);
  const [rotatedSrc, setRotatedSrc] = useState<string>(src);
  const [rotation, setRotation] = useState(0);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [adj, setAdj] = useState<Adjustments>(DEFAULT_ADJ);
  const [activeTab, setActiveTab] = useState<"crop" | "adjust" | "style">("crop");
  const cropImgRef = useRef<HTMLImageElement>(null);

  // Cropped preview for Adjust and Style tabs
  const [croppedPreviewSrc, setCroppedPreviewSrc] = useState<string | null>(null);

  // AI style state — cache maps styleId → generated data URL
  const [styleCache, setStyleCache] = useState<Record<string, string>>({});
  const [generatingStyle, setGeneratingStyle] = useState<string | null>(null);
  const [activeStyle, setActiveStyle] = useState<string | null>(null);

  const styleTransfer = trpc.photo.styleTransfer.useMutation();
  type StyleId = "pokemon" | "kawaii" | "comic" | "watercolor";

  /** Called when the crop image loads — set default crop AND completedCrop immediately */
  const onCropImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const { width, height } = img;
    const defaultCrop = centerCardCrop(width, height);
    setCrop(defaultCrop);
    // Convert to pixel crop immediately so completedCrop is set from the start
    const pixelCrop = percentToPixelCrop(defaultCrop, img);
    setCompletedCrop(pixelCrop);
    // Compute the initial cropped preview
    const preview = computeCroppedDataUrl(img, pixelCrop);
    setCroppedPreviewSrc(preview);
  }, []);

  /** Recompute the cropped preview whenever completedCrop changes */
  useEffect(() => {
    const img = cropImgRef.current;
    if (!img || !completedCrop || completedCrop.width < 4 || completedCrop.height < 4) return;
    const preview = computeCroppedDataUrl(img, completedCrop);
    setCroppedPreviewSrc(preview);
    // When crop changes, invalidate the style cache (the source changed)
    setStyleCache({});
    setActiveStyle(null);
  }, [completedCrop]);

  const rotate = useCallback((dir: "cw" | "ccw") => {
    const origImg = originalImgRef.current;
    if (!origImg || !origImg.complete || origImg.naturalWidth === 0) return;
    const newRotation = (rotation + (dir === "cw" ? 90 : -90) + 360) % 360;
    setRotation(newRotation);
    const newSrc = rotateToDataUrl(origImg, newRotation);
    setRotatedSrc(newSrc);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setCroppedPreviewSrc(null);
    setStyleCache({});
    setActiveStyle(null);
  }, [rotation]);

  const autoAdjust = () => setAdj({ brightness: 108, contrast: 112, saturation: 112 });
  const resetAdj = () => setAdj(DEFAULT_ADJ);

  const applyEdits = useCallback(() => {
    // If user has a styled image selected, use that directly
    if (activeTab === "style" && activeStyle && styleCache[activeStyle]) {
      onApply(styleCache[activeStyle]);
      return;
    }

    const img = cropImgRef.current;
    if (!img) return;

    const rect = img.getBoundingClientRect();
    const displayW = rect.width;
    const displayH = rect.height;
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;

    if (displayW === 0 || displayH === 0 || natW === 0 || natH === 0) return;

    const scaleX = natW / displayW;
    const scaleY = natH / displayH;

    let cropX = 0, cropY = 0, cropW = natW, cropH = natH;
    if (completedCrop && completedCrop.width > 4 && completedCrop.height > 4) {
      cropX = Math.round(completedCrop.x * scaleX);
      cropY = Math.round(completedCrop.y * scaleY);
      cropW = Math.round(completedCrop.width * scaleX);
      cropH = Math.round(completedCrop.height * scaleY);
    }

    cropX = Math.max(0, Math.min(cropX, natW - 1));
    cropY = Math.max(0, Math.min(cropY, natH - 1));
    cropW = Math.max(1, Math.min(cropW, natW - cropX));
    cropH = Math.max(1, Math.min(cropH, natH - cropY));

    const maxDim = 1400;
    const scale = Math.min(1, maxDim / Math.max(cropW, cropH));
    const outW = Math.round(cropW * scale);
    const outH = Math.round(cropH * scale);

    const output = document.createElement("canvas");
    output.width = outW;
    output.height = outH;
    const ctx = output.getContext("2d")!;
    ctx.filter = `brightness(${adj.brightness}%) contrast(${adj.contrast}%) saturate(${adj.saturation}%)`;
    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, outW, outH);

    const result = output.toDataURL("image/jpeg", 0.92);
    if (!result || result === "data:,") return;
    onApply(result);
  }, [completedCrop, adj, onApply, activeTab, activeStyle, styleCache]);

  const handleGenerateStyle = async (styleId: StyleId) => {
    // If we already have a cached result for this style, just show it
    if (styleCache[styleId]) {
      setActiveStyle(styleId);
      return;
    }

    // Use the cropped preview as the source for style generation (so the AI sees the cropped image)
    const sourceForStyle = croppedPreviewSrc || rotatedSrc;

    setGeneratingStyle(styleId);
    setActiveStyle(null);
    try {
      const result = await styleTransfer.mutateAsync({
        imageDataUrl: sourceForStyle,
        style: styleId,
      });
      if (result.url) {
        // Fetch the CDN URL and convert to data URL so it can be used on canvas
        const resp = await fetch(result.url);
        const blob = await resp.blob();
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          setStyleCache((prev) => ({ ...prev, [styleId]: dataUrl }));
          setActiveStyle(styleId);
        };
        reader.readAsDataURL(blob);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Style generation failed";
      toast.error(`Style generation failed: ${msg}`);
    } finally {
      setGeneratingStyle(null);
    }
  };

  const filterStyle = `brightness(${adj.brightness}%) contrast(${adj.contrast}%) saturate(${adj.saturation}%)`;

  // What to show in the Adjust tab: cropped preview if available, otherwise full rotated
  const adjustPreviewSrc = croppedPreviewSrc || rotatedSrc;
  // What to show as "original" in the Style tab
  const styleOriginalSrc = croppedPreviewSrc || rotatedSrc;
  // The currently active styled image
  const activeStyledImage = activeStyle ? styleCache[activeStyle] : null;

  return (
    <>
      <img
        ref={originalImgRef}
        src={src}
        alt=""
        style={{ position: "absolute", left: "-99999px", top: 0, width: "1px", height: "1px", opacity: 0 }}
      />

      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          background: "rgba(30,20,10,0.75)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          backdropFilter: "blur(4px)",
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div style={{
          background: "#fdf6ec",
          borderRadius: "20px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
          width: "min(92vw, 900px)",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "2px solid rgba(42,173,168,0.3)",
        }}>

          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #2AADA8, #1d8a86)",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <h3 style={{ fontFamily: "'Fredoka One', cursive", fontSize: "20px", color: "#fff", margin: 0 }}>
              ✂️ Edit Photo
            </h3>
            <button
              onClick={onClose}
              style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "8px", color: "#fff", padding: "4px 10px", cursor: "pointer", fontSize: "18px", lineHeight: 1 }}
            >×</button>
          </div>

          {/* Tab bar */}
          <div style={{ display: "flex", borderBottom: "1.5px solid rgba(42,173,168,0.2)", background: "rgba(255,255,255,0.6)", flexShrink: 0 }}>
            {(["crop", "adjust", "style"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                flex: 1,
                padding: "10px",
                border: "none",
                background: activeTab === tab ? "rgba(42,173,168,0.12)" : "transparent",
                borderBottom: activeTab === tab ? "2.5px solid #2AADA8" : "2.5px solid transparent",
                fontFamily: "'Baloo 2', cursive",
                fontWeight: 700,
                fontSize: "14px",
                color: activeTab === tab ? "#2AADA8" : "#8a7a6a",
                cursor: "pointer",
                transition: "all 0.15s",
              }}>
                {tab === "crop" ? "✂️ Crop & Rotate" : tab === "adjust" ? "🎨 Adjust" : "✨ AI Style"}
              </button>
            ))}
          </div>

          {/* Body */}
          <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>

            {/* Image area */}
            <div style={{
              flex: 1,
              overflow: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
              background: "#2a2018",
              minHeight: "300px",
            }}>
              {activeTab === "style" ? (
                <div style={{ display: "flex", gap: "16px", alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
                  {/* Cropped original */}
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "6px", fontWeight: 700 }}>CROPPED ORIGINAL</div>
                    <img
                      src={styleOriginalSrc}
                      alt="Original"
                      style={{ maxWidth: "280px", maxHeight: "280px", borderRadius: "10px", border: "2px solid rgba(255,255,255,0.2)", display: "block" }}
                    />
                  </div>
                  {/* Styled preview */}
                  {(generatingStyle || activeStyledImage) && (
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "11px", color: "#aaa", marginBottom: "6px", fontWeight: 700 }}>
                        {generatingStyle
                          ? `GENERATING ${STYLES.find(s => s.id === generatingStyle)?.label.toUpperCase()}...`
                          : `${STYLES.find(s => s.id === activeStyle)?.label.toUpperCase()} STYLE`}
                      </div>
                      {generatingStyle ? (
                        <div style={{
                          width: "280px",
                          height: "280px",
                          borderRadius: "10px",
                          background: "rgba(255,255,255,0.08)",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "12px",
                          border: "2px dashed rgba(42,173,168,0.5)",
                        }}>
                          <div style={{ fontSize: "32px", animation: "spin 1s linear infinite" }}>✨</div>
                          <div style={{ fontSize: "12px", color: "#aaa", textAlign: "center", lineHeight: 1.4 }}>
                            AI is painting<br />your photo…<br />
                            <span style={{ fontSize: "10px", opacity: 0.7 }}>(10–20 seconds)</span>
                          </div>
                        </div>
                      ) : activeStyledImage ? (
                        <img
                          src={activeStyledImage}
                          alt="Styled"
                          style={{
                            maxWidth: "280px",
                            maxHeight: "280px",
                            borderRadius: "10px",
                            border: "3px solid #2AADA8",
                            display: "block",
                            boxShadow: "0 0 20px rgba(42,173,168,0.4)",
                          }}
                        />
                      ) : null}
                    </div>
                  )}
                </div>
              ) : activeTab === "crop" ? (
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={CARD_PHOTO_ASPECT}
                  style={{ maxWidth: "100%", maxHeight: "60vh" }}
                >
                  <img
                    ref={cropImgRef}
                    src={rotatedSrc}
                    alt="Edit"
                    onLoad={onCropImageLoad}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "60vh",
                      display: "block",
                      filter: filterStyle,
                    }}
                  />
                </ReactCrop>
              ) : (
                /* Adjust tab — show the cropped preview with live filter applied */
                <img
                  src={adjustPreviewSrc}
                  alt="Adjust preview"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "60vh",
                    filter: filterStyle,
                    borderRadius: "8px",
                    display: "block",
                  }}
                />
              )}
            </div>

            {/* Controls sidebar */}
            <div style={{
              width: "240px",
              flexShrink: 0,
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              overflowY: "auto",
              borderLeft: "1.5px solid rgba(42,173,168,0.15)",
              background: "rgba(253,246,236,0.95)",
            }}>

              {activeTab === "crop" && (
                <>
                  <div>
                    <Label style={{ fontWeight: 700, color: "#4a3c2e", fontSize: "12px", marginBottom: "8px", display: "block" }}>
                      🔄 Rotate
                    </Label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => rotate("ccw")} style={btnStyle} title="Rotate 90° counter-clockwise">↺ CCW</button>
                      <button onClick={() => rotate("cw")} style={btnStyle} title="Rotate 90° clockwise">↻ CW</button>
                    </div>
                    <div style={{ fontSize: "11px", color: "#8a7a6a", marginTop: "6px", textAlign: "center" }}>
                      {rotation}° rotation
                    </div>
                  </div>
                  <div>
                    <Label style={{ fontWeight: 700, color: "#4a3c2e", fontSize: "12px", marginBottom: "6px", display: "block" }}>
                      ✂️ Crop
                    </Label>
                    <p style={{ fontSize: "11px", color: "#8a7a6a", margin: 0, lineHeight: 1.5 }}>
                      Locked to the card photo ratio (13:8). Drag to reposition — what you see here is exactly what appears on the card.
                    </p>
                    <button
                      onClick={() => {
                        const img = cropImgRef.current;
                        if (img) {
                          const defaultCrop = centerCardCrop(img.width, img.height);
                          setCrop(defaultCrop);
                          const pixelCrop = percentToPixelCrop(defaultCrop, img);
                          setCompletedCrop(pixelCrop);
                        }
                      }}
                      style={{ ...btnStyle, marginTop: "8px", width: "100%" }}
                    >
                      Reset Crop
                    </button>
                  </div>
                </>
              )}

              {activeTab === "adjust" && (
                <>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <Label style={{ fontWeight: 700, color: "#4a3c2e", fontSize: "12px" }}>Adjustments</Label>
                      <button onClick={resetAdj} style={{ ...btnStyle, fontSize: "11px", padding: "3px 8px" }}>Reset</button>
                    </div>
                    {([
                      { key: "brightness" as const, label: "☀️ Brightness", min: 50, max: 200 },
                      { key: "contrast" as const, label: "◑ Contrast", min: 50, max: 200 },
                      { key: "saturation" as const, label: "🎨 Saturation", min: 0, max: 200 },
                    ]).map(({ key, label, min, max }) => (
                      <div key={key} style={{ marginBottom: "14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span style={{ fontSize: "12px", color: "#4a3c2e", fontWeight: 600 }}>{label}</span>
                          <span style={{ fontSize: "11px", color: "#8a7a6a" }}>{adj[key]}</span>
                        </div>
                        <Slider
                          value={[adj[key]]}
                          onValueChange={([v]) => setAdj((a) => ({ ...a, [key]: v }))}
                          min={min}
                          max={max}
                          step={1}
                        />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={autoAdjust}
                    style={{
                      ...btnStyle,
                      width: "100%",
                      background: "linear-gradient(135deg, #2AADA8, #1d8a86)",
                      color: "#fff",
                      fontWeight: 700,
                      padding: "8px",
                    }}
                  >
                    ✨ Auto-Adjust
                  </button>
                  <p style={{ fontSize: "11px", color: "#8a7a6a", margin: 0, lineHeight: 1.5 }}>
                    Adjustments are applied on top of your crop. Go back to Crop & Rotate to change the framing.
                  </p>
                </>
              )}

              {activeTab === "style" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div>
                    <Label style={{ fontWeight: 700, color: "#4a3c2e", fontSize: "12px", marginBottom: "4px", display: "block" }}>
                      ✨ AI Art Styles
                    </Label>
                    <p style={{ fontSize: "11px", color: "#8a7a6a", margin: "0 0 10px", lineHeight: 1.5 }}>
                      Transform your cropped photo using AI. Previously generated styles are cached — click again to switch back instantly.
                    </p>
                  </div>
                  {STYLES.map((style) => {
                    const isCached = !!styleCache[style.id];
                    const isActive = activeStyle === style.id;
                    const isGenerating = generatingStyle === style.id;
                    return (
                      <button
                        key={style.id}
                        onClick={() => handleGenerateStyle(style.id)}
                        disabled={!!generatingStyle}
                        style={{
                          background: isActive ? style.gradient : "rgba(255,255,255,0.8)",
                          border: isActive ? "2px solid transparent" : "2px solid rgba(42,173,168,0.2)",
                          borderRadius: "12px",
                          padding: "10px 12px",
                          cursor: generatingStyle ? "wait" : "pointer",
                          textAlign: "left",
                          opacity: generatingStyle && !isGenerating ? 0.5 : 1,
                          transition: "all 0.2s",
                          position: "relative",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                          <span style={{ fontSize: "18px" }}>{style.emoji}</span>
                          <span style={{
                            fontFamily: "'Baloo 2', cursive",
                            fontWeight: 700,
                            fontSize: "13px",
                            color: isActive ? style.textColor : "#2AADA8",
                          }}>
                            {style.label}
                            {isGenerating && " ✨"}
                            {isCached && !isGenerating && !isActive && " ✓"}
                          </span>
                        </div>
                        <div style={{ fontSize: "11px", color: isActive ? style.textColor : "#8a7a6a", lineHeight: 1.4, opacity: 0.85 }}>
                          {isCached && !isActive ? "Cached — click to view" : style.desc}
                        </div>
                      </button>
                    );
                  })}
                  {activeStyledImage && (
                    <div style={{
                      background: "rgba(42,173,168,0.1)",
                      borderRadius: "10px",
                      padding: "8px 10px",
                      fontSize: "11px",
                      color: "#2AADA8",
                      fontWeight: 700,
                      textAlign: "center",
                      border: "1px solid rgba(42,173,168,0.3)",
                    }}>
                      ✅ Style ready! Click "Apply" to use it on your card.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer actions */}
          <div style={{
            padding: "12px 20px",
            display: "flex",
            gap: "10px",
            justifyContent: "flex-end",
            borderTop: "1.5px solid rgba(42,173,168,0.15)",
            background: "rgba(255,255,255,0.8)",
            flexShrink: 0,
          }}>
            <Button variant="outline" onClick={onClose} style={{ borderColor: "#c8dedd", color: "#6a8a88", borderRadius: "10px" }}>
              Cancel
            </Button>
            <Button
              onClick={applyEdits}
              disabled={activeTab === "style" && !activeStyledImage}
              style={{
                background: "linear-gradient(135deg, #2AADA8, #1d8a86)",
                color: "#fff",
                borderRadius: "10px",
                fontFamily: "'Baloo 2', cursive",
                fontWeight: 700,
                border: "none",
                boxShadow: "0 4px 12px rgba(42,173,168,0.3)",
                opacity: activeTab === "style" && !activeStyledImage ? 0.5 : 1,
              }}
            >
              {activeTab === "style" && activeStyledImage ? "✅ Use Styled Photo" : "✅ Apply & Use Photo"}
            </Button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

const btnStyle: React.CSSProperties = {
  background: "rgba(42,173,168,0.1)",
  border: "1.5px solid rgba(42,173,168,0.25)",
  borderRadius: "8px",
  padding: "5px 12px",
  cursor: "pointer",
  fontFamily: "'Baloo 2', cursive",
  fontWeight: 700,
  fontSize: "12px",
  color: "#2AADA8",
  transition: "background 0.15s",
};
