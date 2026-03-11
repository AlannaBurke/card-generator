/*
 * PhotoEditor — Modal photo editing component
 * Design: Cottagecore Pokédex — matches HALT brand
 * Features:
 *   - Crop (react-image-crop, locked to 4:3 — square/portrait friendly)
 *   - Rotate (90° CW/CCW)
 *   - Brightness, Contrast, Saturation sliders
 *   - Auto-adjust (normalises brightness/contrast)
 *   - Reset to original
 *   - Apply → returns edited data URL
 *
 * Fix: applyEdits no longer uses useCallback (avoids stale closure on onApply).
 *      Uses naturalWidth/naturalHeight for correct pixel math regardless of display size.
 */

import React, { useState, useRef } from "react";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface PhotoEditorProps {
  src: string;           // original data URL or blob URL
  onApply: (result: string) => void;
  onClose: () => void;
}

interface Adjustments {
  brightness: number;   // 0–200 (100 = normal)
  contrast: number;     // 0–200
  saturation: number;   // 0–200
}

const DEFAULT_ADJ: Adjustments = { brightness: 100, contrast: 100, saturation: 100 };

// 1:1 square crop — works best for animal portrait photos in the card
const CARD_PHOTO_ASPECT = 1;

function centerAspectCrop(w: number, h: number) {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 90 }, CARD_PHOTO_ASPECT, w, h),
    w, h
  );
}

export default function PhotoEditor({ src, onApply, onClose }: PhotoEditorProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [rotation, setRotation] = useState(0);
  const [adj, setAdj] = useState<Adjustments>(DEFAULT_ADJ);
  const [activeTab, setActiveTab] = useState<"crop" | "adjust">("crop");

  // When image loads, set a default centered crop
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setCrop(centerAspectCrop(naturalWidth, naturalHeight));
  };

  const rotate = (dir: "cw" | "ccw") => {
    setRotation((r) => (r + (dir === "cw" ? 90 : -90) + 360) % 360);
  };

  const autoAdjust = () => {
    setAdj({ brightness: 110, contrast: 115, saturation: 115 });
  };

  const resetAdj = () => setAdj(DEFAULT_ADJ);

  // NOT useCallback — direct function so it always has fresh closure over onApply, completedCrop, rotation, adj
  const applyEdits = () => {
    const image = imgRef.current;
    if (!image) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use natural dimensions for pixel-accurate math
    const natW = image.naturalWidth;
    const natH = image.naturalHeight;

    // Scale from display pixels → natural pixels
    const scaleX = natW / image.width;
    const scaleY = natH / image.height;

    let srcX = 0, srcY = 0, srcW = natW, srcH = natH;
    if (completedCrop && completedCrop.width > 0 && completedCrop.height > 0) {
      srcX = completedCrop.x * scaleX;
      srcY = completedCrop.y * scaleY;
      srcW = completedCrop.width * scaleX;
      srcH = completedCrop.height * scaleY;
    }

    // Output size: keep crop dimensions, max 1400px on longest side
    const maxDim = 1400;
    let outW = srcW, outH = srcH;
    if (rotation === 90 || rotation === 270) { [outW, outH] = [outH, outW]; }
    const scale = Math.min(1, maxDim / Math.max(outW, outH));
    const finalW = Math.round(outW * scale);
    const finalH = Math.round(outH * scale);

    canvas.width = finalW;
    canvas.height = finalH;

    ctx.save();
    ctx.translate(finalW / 2, finalH / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    if (rotation === 0 || rotation === 180) {
      ctx.drawImage(image, srcX, srcY, srcW, srcH, -finalW / 2, -finalH / 2, finalW, finalH);
    } else {
      ctx.drawImage(image, srcX, srcY, srcW, srcH, -finalH / 2, -finalW / 2, finalH, finalW);
    }
    ctx.restore();

    // Apply CSS filters on a second canvas
    const filtered = document.createElement("canvas");
    filtered.width = finalW;
    filtered.height = finalH;
    const fctx = filtered.getContext("2d");
    if (!fctx) return;
    fctx.filter = `brightness(${adj.brightness}%) contrast(${adj.contrast}%) saturate(${adj.saturation}%)`;
    fctx.drawImage(canvas, 0, 0);

    const result = filtered.toDataURL("image/jpeg", 0.92);
    onApply(result);
  };

  const filterStyle = `brightness(${adj.brightness}%) contrast(${adj.contrast}%) saturate(${adj.saturation}%)`;

  return (
    <div style={{
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
        width: "min(92vw, 860px)",
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
        <div style={{ display: "flex", borderBottom: "1.5px solid rgba(42,173,168,0.2)", background: "rgba(255,255,255,0.6)" }}>
          {(["crop", "adjust"] as const).map((tab) => (
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
              {tab === "crop" ? "✂️ Crop & Rotate" : "🎨 Adjust"}
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
            {activeTab === "crop" ? (
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={CARD_PHOTO_ASPECT}
                style={{ maxWidth: "100%", maxHeight: "60vh" }}
              >
                <img
                  ref={imgRef}
                  src={src}
                  alt="Edit"
                  onLoad={onImageLoad}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "60vh",
                    transform: `rotate(${rotation}deg)`,
                    transition: "transform 0.25s",
                    filter: filterStyle,
                    display: "block",
                  }}
                />
              </ReactCrop>
            ) : (
              <img
                src={src}
                alt="Adjust preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: "60vh",
                  transform: `rotate(${rotation}deg)`,
                  transition: "transform 0.25s, filter 0.15s",
                  filter: filterStyle,
                  borderRadius: "8px",
                  display: "block",
                }}
              />
            )}
          </div>

          {/* Controls sidebar */}
          <div style={{
            width: "220px",
            flexShrink: 0,
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            overflowY: "auto",
            borderLeft: "1.5px solid rgba(42,173,168,0.15)",
            background: "rgba(255,255,255,0.7)",
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
                    Crop is locked to 1:1 square — works best for animal portraits in the card.
                  </p>
                  <button
                    onClick={() => { setCrop(undefined); setCompletedCrop(undefined); }}
                    style={{ ...btnStyle, marginTop: "8px", width: "100%" }}
                  >
                    Clear Crop
                  </button>
                </div>
              </>
            )}

            {activeTab === "adjust" && (
              <>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <Label style={{ fontWeight: 700, color: "#4a3c2e", fontSize: "12px" }}>Adjustments</Label>
                    <button onClick={resetAdj} style={{ ...btnStyle, fontSize: "10px", padding: "2px 8px" }}>Reset</button>
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
              </>
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
        }}>
          <Button variant="outline" onClick={onClose} style={{ borderColor: "#c8dedd", color: "#6a8a88", borderRadius: "10px" }}>
            Cancel
          </Button>
          <Button
            onClick={applyEdits}
            style={{
              background: "linear-gradient(135deg, #2AADA8, #1d8a86)",
              color: "#fff",
              borderRadius: "10px",
              fontFamily: "'Baloo 2', cursive",
              fontWeight: 700,
              border: "none",
              boxShadow: "0 4px 12px rgba(42,173,168,0.3)",
            }}
          >
            ✅ Apply & Use Photo
          </Button>
        </div>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: "rgba(42,173,168,0.1)",
  border: "1.5px solid rgba(42,173,168,0.3)",
  borderRadius: "8px",
  color: "#2AADA8",
  padding: "5px 12px",
  cursor: "pointer",
  fontSize: "12px",
  fontFamily: "'Baloo 2', cursive",
  fontWeight: 700,
  transition: "all 0.15s",
};
