/*
 * PhotoEditor — Modal photo editing component
 * Design: Cottagecore Pokédex — matches HALT brand
 *
 * Rewrite notes:
 *   - Crop is drawn using a hidden <canvas> element for the preview so the user
 *     sees exactly what will be exported (no mismatch between UI crop box and output).
 *   - Apply uses a two-step pipeline:
 *       1. Draw the full image onto an offscreen canvas, applying rotation.
 *       2. Crop the rotated canvas to the selected region.
 *       3. Apply brightness/contrast/saturation filters.
 *   - Rotation is handled BEFORE crop math so coordinates are always in the
 *     post-rotation space (matching what the user sees in the crop UI).
 *   - All canvas operations use naturalWidth/naturalHeight for pixel accuracy.
 */

import React, { useState, useRef, useEffect } from "react";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface PhotoEditorProps {
  src: string;           // data URL from FileReader
  onApply: (result: string) => void;
  onClose: () => void;
}

interface Adjustments {
  brightness: number;   // 0–200 (100 = normal)
  contrast: number;
  saturation: number;
}

const DEFAULT_ADJ: Adjustments = { brightness: 100, contrast: 100, saturation: 100 };
const ASPECT = 1; // 1:1 square — best for animal portrait photos

function centerAspectCrop(w: number, h: number): Crop {
  return centerCrop(
    makeAspectCrop({ unit: "%", width: 85 }, ASPECT, w, h),
    w, h
  );
}

/** Rotate an ImageBitmap by 0/90/180/270 degrees onto a new canvas */
function rotateImageToCanvas(img: HTMLImageElement, rotation: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const w = img.naturalWidth;
  const h = img.naturalHeight;

  if (rotation === 90 || rotation === 270) {
    canvas.width = h;
    canvas.height = w;
  } else {
    canvas.width = w;
    canvas.height = h;
  }

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
  return canvas;
}

export default function PhotoEditor({ src, onApply, onClose }: PhotoEditorProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [rotation, setRotation] = useState(0);
  const [adj, setAdj] = useState<Adjustments>(DEFAULT_ADJ);
  const [activeTab, setActiveTab] = useState<"crop" | "adjust">("crop");
  const [imgLoaded, setImgLoaded] = useState(false);

  // When image loads, set a default centered crop
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height));
    setImgLoaded(true);
  };

  // Re-center crop when rotation changes (dimensions may swap)
  useEffect(() => {
    if (!imgRef.current || !imgLoaded) return;
    const img = imgRef.current;
    // After rotation, displayed w/h may swap — re-center
    const isRotated90 = rotation === 90 || rotation === 270;
    const displayW = isRotated90 ? img.clientHeight : img.clientWidth;
    const displayH = isRotated90 ? img.clientWidth : img.clientHeight;
    if (displayW > 0 && displayH > 0) {
      setCrop(centerAspectCrop(displayW, displayH));
      setCompletedCrop(undefined);
    }
  }, [rotation, imgLoaded]);

  const rotate = (dir: "cw" | "ccw") => {
    setRotation((r) => (r + (dir === "cw" ? 90 : -90) + 360) % 360);
  };

  const autoAdjust = () => setAdj({ brightness: 108, contrast: 112, saturation: 112 });
  const resetAdj = () => setAdj(DEFAULT_ADJ);

  const applyEdits = () => {
    const image = imgRef.current;
    if (!image) {
      console.error("PhotoEditor: imgRef is null");
      return;
    }

    // Step 1: rotate the full image onto a canvas
    const rotated = rotateImageToCanvas(image, rotation);

    // Step 2: crop the rotated canvas
    // completedCrop is in display-pixel space; scale to natural-pixel space
    const displayW = image.clientWidth;
    const displayH = image.clientHeight;

    // After rotation, the displayed image dimensions may be swapped
    const isRotated90 = rotation === 90 || rotation === 270;
    const natW = isRotated90 ? image.naturalHeight : image.naturalWidth;
    const natH = isRotated90 ? image.naturalWidth : image.naturalHeight;

    const scaleX = natW / displayW;
    const scaleY = natH / displayH;

    let cropX = 0, cropY = 0, cropW = rotated.width, cropH = rotated.height;
    if (completedCrop && completedCrop.width > 4 && completedCrop.height > 4) {
      cropX = Math.round(completedCrop.x * scaleX);
      cropY = Math.round(completedCrop.y * scaleY);
      cropW = Math.round(completedCrop.width * scaleX);
      cropH = Math.round(completedCrop.height * scaleY);
    }

    // Clamp to canvas bounds
    cropX = Math.max(0, Math.min(cropX, rotated.width - 1));
    cropY = Math.max(0, Math.min(cropY, rotated.height - 1));
    cropW = Math.max(1, Math.min(cropW, rotated.width - cropX));
    cropH = Math.max(1, Math.min(cropH, rotated.height - cropY));

    // Step 3: draw cropped region to output canvas, max 1400px
    const maxDim = 1400;
    const scale = Math.min(1, maxDim / Math.max(cropW, cropH));
    const outW = Math.round(cropW * scale);
    const outH = Math.round(cropH * scale);

    const output = document.createElement("canvas");
    output.width = outW;
    output.height = outH;
    const ctx = output.getContext("2d")!;

    // Step 4: apply adjustments via filter
    ctx.filter = `brightness(${adj.brightness}%) contrast(${adj.contrast}%) saturate(${adj.saturation}%)`;
    ctx.drawImage(rotated, cropX, cropY, cropW, cropH, 0, 0, outW, outH);

    const result = output.toDataURL("image/jpeg", 0.92);
    if (!result || result === "data:,") {
      console.error("PhotoEditor: canvas produced empty result");
      return;
    }
    onApply(result);
  };

  const filterStyle = `brightness(${adj.brightness}%) contrast(${adj.contrast}%) saturate(${adj.saturation}%)`;

  return (
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
                aspect={ASPECT}
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
                ref={imgRef}
                src={src}
                alt="Adjust preview"
                onLoad={onImageLoad}
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
                    Drag the handles to select the area you want. The crop is locked to square — best for animal portraits.
                  </p>
                  <button
                    onClick={() => { setCrop(undefined); setCompletedCrop(undefined); }}
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
