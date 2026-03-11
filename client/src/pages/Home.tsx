/*
 * Home — Card Generator Main Page
 * Design: Cottagecore Pokédex
 * Layout: Left panel (form) + Right panel (live card preview)
 * Features:
 *   - Photo upload with built-in editor (crop, rotate, brightness, contrast, saturation, auto-adjust)
 *   - Animal details: name, species, sex, age, weight, personality, bio, HP
 *   - Card number (#001 style)
 *   - Adoption status badge (Available / In Foster / Sanctuary Resident)
 *   - Live card preview with 3D flip to show back
 *   - Download as PNG
 *   - Print Sheet (6 cards per page)
 */

import { useRef, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import AnimalCard, { AnimalCardBack, AnimalCardData, HALT_LOGO_URL } from "@/components/AnimalCard";
import PhotoEditor from "@/components/PhotoEditor";
import { useCardDownload } from "@/hooks/useCardDownload";

// Logo URL is now exported from AnimalCard.tsx as HALT_LOGO_URL — single source of truth
const CARD_BG_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663404885239/KSAnxKy3iVwgftKj5yQJFJ/card-bg-texture-NUuh8tVs2vLnJ3cEafbiB8.webp";
const HERO_BG_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663404885239/KSAnxKy3iVwgftKj5yQJFJ/app-hero-bg-CWeUKfCSYNAGPYj2aoU9jQ.webp";
// Card back is now rendered as a React component using the real HALT logo

const SPECIES_OPTIONS = ["Rabbit", "Guinea Pig", "Hamster", "Rat", "Mouse", "Chinchilla", "Gerbil", "Other"];

const ADOPTION_STATUS_OPTIONS = [
  { value: "none", label: "— None —" },
  { value: "available", label: "💚 Available for Adoption" },
  { value: "foster", label: "🏠 In Foster Care" },
  { value: "resident", label: "🌟 Sanctuary Resident" },
];

const DEMO_PHOTO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663404885239/KSAnxKy3iVwgftKj5yQJFJ/demo-rabbit-biscuit-eA5imemhvgwxmWPSVtkUXb.webp";

const DEMO_DATA: AnimalCardData = {
  name: "Biscuit",
  species: "Rabbit",
  sex: "Female",
  age: "2 years",
  weight: "3.4 lbs",
  personality: "Curious, Gentle, Sassy, Loves cuddles",
  bio: "Biscuit came to us after being found alone in a park. She took a little time to warm up, but now she binkies every morning and demands head scratches on her own terms.",
  photoUrl: DEMO_PHOTO_URL,
  hp: 82,
  cardNumber: "001",
  adoptionStatus: "available",
  funFact: "Binkies every morning when she hears the veggie bag!",
};

const DEFAULT_DATA: AnimalCardData = {
  name: "",
  species: "Rabbit",
  sex: "Unknown",
  age: "",
  weight: "",
  personality: "",
  bio: "",
  photoUrl: undefined,
  hp: 75,
  cardNumber: "",
  adoptionStatus: "none",
  funFact: "",
};

export default function Home() {
  const [formData, setFormData] = useState<AnimalCardData>(DEFAULT_DATA);
  const [showBack, setShowBack] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [editorSrc, setEditorSrc] = useState<string | null>(null); // raw uploaded image for editor
  const [showEditor, setShowEditor] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const downloadCardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { downloadCard, isDownloading } = useCardDownload(CARD_BG_URL);
  const [, navigate] = useLocation();

  const updateField = <K extends keyof AnimalCardData>(key: K, value: AnimalCardData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handlePhotoUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setEditorSrc(dataUrl);
      setShowEditor(true);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handlePhotoUpload(file);
    // reset so same file can be re-selected
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handlePhotoUpload(file);
  };

  const handleEditorApply = (result: string) => {
    updateField("photoUrl", result);
    setShowEditor(false);
    setEditorSrc(null);
    toast.success("Photo applied! 🐾");
  };

  const handleEditorClose = () => {
    setShowEditor(false);
    // If no photo was previously set, keep it null; otherwise keep existing
  };

  // Convert any URL (CDN or data:) to a data URL so the canvas is never tainted
  const openEditorWithSrc = async (src: string) => {
    if (src.startsWith("data:")) {
      setEditorSrc(src);
      setShowEditor(true);
      return;
    }
    try {
      const resp = await fetch(src);
      const blob = await resp.blob();
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setEditorSrc(dataUrl);
        setShowEditor(true);
      };
      reader.readAsDataURL(blob);
    } catch {
      // Fallback: open with original src (will taint canvas but at least opens)
      setEditorSrc(src);
      setShowEditor(true);
    }
  };
  const handleEditExistingPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (formData.photoUrl) {
      openEditorWithSrc(formData.photoUrl);
    }
  };

  const handleDownload = () => {
    downloadCard(formData);
  };

  const handlePrintSheet = () => {
    sessionStorage.setItem("halt-card-data", JSON.stringify(formData));
    navigate("/print");
  };

  const handleLoadDemo = () => {
    setFormData(DEMO_DATA);
    setEditorSrc(null);
    toast.success("Demo loaded — meet Biscuit! 🐰");
  };

  const handleReset = () => {
    setFormData(DEFAULT_DATA);
    setEditorSrc(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.info("Form cleared!");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fdf6ec", fontFamily: "'Nunito', sans-serif" }}>

      {/* Photo Editor Modal */}
      {showEditor && editorSrc && (
        <PhotoEditor
          src={editorSrc}
          onApply={handleEditorApply}
          onClose={handleEditorClose}
        />
      )}

      {/* === HERO HEADER === */}
      <header style={{
        position: "relative",
        backgroundImage: `url(${HERO_BG_URL})`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
        padding: "32px 24px 40px",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(42,173,168,0.55) 0%, rgba(42,173,168,0.3) 60%, rgba(253,246,236,0.9) 100%)",
        }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginBottom: "12px" }}>
            <img src={HALT_LOGO_URL} alt="HALT Logo" style={{ width: "72px", height: "72px", objectFit: "contain", filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.2))" }} />
            <div style={{ textAlign: "left" }}>
              <h1 style={{
                fontFamily: "'Fredoka One', cursive",
                fontSize: "clamp(28px, 5vw, 42px)",
                color: "#fff",
                margin: 0,
                textShadow: "0 2px 8px rgba(0,0,0,0.25)",
                lineHeight: 1.1,
              }}>Animal Card Generator</h1>
              <p style={{
                fontFamily: "'Nunito', sans-serif",
                fontSize: "14px",
                color: "rgba(255,255,255,0.9)",
                margin: "4px 0 0",
                fontWeight: 700,
                textShadow: "0 1px 4px rgba(0,0,0,0.2)",
              }}>Helping All Little Things · helpingalllittlethings.org</p>
            </div>
          </div>
          <p style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "16px",
            color: "#3a2e22",
            fontWeight: 600,
            margin: 0,
            background: "rgba(255,255,255,0.7)",
            borderRadius: "20px",
            display: "inline-block",
            padding: "6px 20px",
          }}>
            🐾 Create adorable trading cards for your sanctuary members!
          </p>
        </div>
      </header>

      {/* === MAIN CONTENT === */}
      <main style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "32px 16px 48px",
        display: "grid",
        gridTemplateColumns: "minmax(300px, 420px) 1fr",
        gap: "32px",
        alignItems: "start",
      }}>

        {/* === LEFT: FORM PANEL === */}
        <div style={{
          background: "rgba(255,255,255,0.85)",
          borderRadius: "20px",
          padding: "28px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          border: "1.5px solid rgba(42,173,168,0.2)",
          backdropFilter: "blur(4px)",
        }}>
          <h2 style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: "22px",
            color: "#2AADA8",
            margin: "0 0 20px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <span>✏️</span> Animal Details
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* ── Photo Upload ── */}
            <div>
              <Label style={{ fontWeight: 700, color: "#4a3c2e", fontSize: "13px", marginBottom: "6px", display: "block" }}>
                📸 Photo
              </Label>
              <div
                onClick={() => !formData.photoUrl && fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                style={{
                  border: `2px dashed ${dragOver ? "#2AADA8" : "#b0c8c6"}`,
                  borderRadius: "12px",
                  padding: "16px",
                  textAlign: "center",
                  cursor: formData.photoUrl ? "default" : "pointer",
                  background: dragOver ? "rgba(42,173,168,0.08)" : "rgba(42,173,168,0.03)",
                  transition: "all 0.2s",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {formData.photoUrl ? (
                  <div style={{ position: "relative" }}>
                    <img
                      src={formData.photoUrl}
                      alt="Preview"
                      style={{ width: "100%", height: "120px", objectFit: "cover", borderRadius: "8px" }}
                    />
                    {/* Action buttons over photo */}
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      background: "rgba(0,0,0,0.45)",
                    }}>
                      <button
                        onClick={handleEditExistingPhoto}
                        style={{
                          background: "rgba(255,255,255,0.9)",
                          border: "none",
                          borderRadius: "8px",
                          padding: "6px 14px",
                          cursor: "pointer",
                          fontFamily: "'Baloo 2', cursive",
                          fontWeight: 700,
                          fontSize: "12px",
                          color: "#2AADA8",
                        }}
                      >
                        ✂️ Edit Photo
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        style={{
                          background: "rgba(255,255,255,0.9)",
                          border: "none",
                          borderRadius: "8px",
                          padding: "6px 14px",
                          cursor: "pointer",
                          fontFamily: "'Baloo 2', cursive",
                          fontWeight: 700,
                          fontSize: "12px",
                          color: "#6a8a88",
                        }}
                      >
                        🔄 Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: "#8a9e9c", padding: "8px 0" }}>
                    <div style={{ fontSize: "32px", marginBottom: "6px" }}>🖼️</div>
                    <div style={{ fontWeight: 700, fontSize: "13px" }}>Click or drag & drop</div>
                    <div style={{ fontSize: "11px", marginTop: "2px" }}>JPG, PNG, WEBP · Max 10MB</div>
                    <div style={{ fontSize: "11px", marginTop: "4px", color: "#2AADA8", fontWeight: 600 }}>
                      Photo editor opens automatically ✂️
                    </div>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
            </div>

            {/* ── Name ── */}
            <div>
              <Label style={{ fontWeight: 700, color: "#4a3c2e", fontSize: "13px", marginBottom: "6px", display: "flex", justifyContent: "space-between" }}>
                <span>🏷️ Name *</span>
                <span style={{ fontWeight: 400, color: "#8a7a6a" }}>{formData.name.length}/24</span>
              </Label>
              <Input
                placeholder="e.g. Biscuit, Peanut, Clover..."
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                maxLength={24}
                style={{ borderColor: "#c8dedd", borderRadius: "10px" }}
              />
            </div>

            {/* ── Card Number + Adoption Status row ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
              <div>
                <Label style={{ fontWeight: 700, color: "#4a3c2e", fontSize: "13px", marginBottom: "6px", display: "block" }}>
                  🔢 Card #
                </Label>
                <Input
                  placeholder="e.g. 042"
                  value={formData.cardNumber ?? ""}
                  onChange={(e) => updateField("cardNumber", e.target.value)}
                  style={{ borderColor: "#c8dedd", borderRadius: "10px" }}
                  maxLength={6}
                />
              </div>
              <div>
                <Label style={{ fontWeight: 700, color: "#4a3c2e", fontSize: "13px", marginBottom: "6px", display: "block" }}>
                  🏷️ Adoption Status
                </Label>
                <Select value={formData.adoptionStatus ?? "none"} onValueChange={(v) => updateField("adoptionStatus", v)}>
                  <SelectTrigger style={{ borderColor: "#c8dedd", borderRadius: "10px" }}>
                    <SelectValue placeholder="— None —" />
                  </SelectTrigger>
                  <SelectContent>
                    {ADOPTION_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ── Species + Sex row ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <Label style={{ fontWeight: 700, color: "#4a3c2e", fontSize: "13px", marginBottom: "6px", display: "block" }}>
                  🐾 Species
                </Label>
                <Select value={formData.species} onValueChange={(v) => updateField("species", v)}>
                  <SelectTrigger style={{ borderColor: "#c8dedd", borderRadius: "10px" }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIES_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label style={{ fontWeight: 700, color: "#4a3c2e", fontSize: "13px", marginBottom: "6px", display: "block" }}>
                  ⚥ Sex
                </Label>
                <Select value={formData.sex} onValueChange={(v) => updateField("sex", v)}>
                  <SelectTrigger style={{ borderColor: "#c8dedd", borderRadius: "10px" }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Female">Female ♀</SelectItem>
                    <SelectItem value="Male">Male ♂</SelectItem>
                    <SelectItem value="Unknown">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ── Age + Weight row ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <Label style={{ fontWeight: 700, color: "#4a3c2e", fontSize: "13px", marginBottom: "6px", display: "block" }}>
                  🌱 Age
                </Label>
                <Input
                  placeholder="e.g. 2 years"
                  value={formData.age}
                  onChange={(e) => updateField("age", e.target.value)}
                  maxLength={12}
                  style={{ borderColor: "#c8dedd", borderRadius: "10px" }}
                />
              </div>
              <div>
                <Label style={{ fontWeight: 700, color: "#4a3c2e", fontSize: "13px", marginBottom: "6px", display: "block" }}>
                  ⚖️ Weight
                </Label>
                <Input
                  placeholder="e.g. 1.2 lbs"
                  value={formData.weight}
                  onChange={(e) => updateField("weight", e.target.value)}
                  maxLength={12}
                  style={{ borderColor: "#c8dedd", borderRadius: "10px" }}
                />
              </div>
            </div>

            {/* ── Personality ── */}
            <div>
              <Label style={{ fontWeight: 700, color: "#4a3c2e", fontSize: "13px", marginBottom: "6px", display: "flex", justifyContent: "space-between" }}>
                <span>✨ Personality Traits <span style={{ fontWeight: 400, color: "#8a7a6a" }}>up to 4, comma-separated</span></span>
              </Label>
              <Input
                placeholder="e.g. Curious, Gentle, Loves cuddles"
                value={formData.personality}
                onChange={(e) => updateField("personality", e.target.value)}
                maxLength={60}
                style={{ borderColor: "#c8dedd", borderRadius: "10px" }}
              />
              <p style={{ fontSize: "11px", color: "#8a7a6a", margin: "3px 0 0", lineHeight: 1.4 }}>Only the first 4 traits show on the card</p>
            </div>

            {/* ── Fun Fact ── */}
            <div>
              <Label style={{ fontWeight: 700, color: "#4a3c2e", fontSize: "13px", marginBottom: "6px", display: "flex", justifyContent: "space-between" }}>
                <span>⭐ Fun Fact</span>
                <span style={{ fontWeight: 400, color: "#8a7a6a" }}>{(formData.funFact ?? "").length}/80</span>
              </Label>
              <Input
                placeholder="e.g. Loves blueberries! Can jump 3 feet!"
                value={formData.funFact ?? ""}
                onChange={(e) => updateField("funFact", e.target.value)}
                maxLength={80}
                style={{ borderColor: "#c8dedd", borderRadius: "10px" }}
              />
            </div>

            {/* ── Bio ── */}
            <div>
              <Label style={{ fontWeight: 700, color: "#4a3c2e", fontSize: "13px", marginBottom: "6px", display: "flex", justifyContent: "space-between" }}>
                <span>📖 Bio / Story</span>
                <span style={{ fontWeight: 400, color: formData.bio.length > 220 ? "#E8879A" : "#8a7a6a" }}>{formData.bio.length}/240</span>
              </Label>
              <Textarea
                placeholder="Tell their story! How did they come to the sanctuary? What makes them special?"
                value={formData.bio}
                onChange={(e) => updateField("bio", e.target.value)}
                maxLength={240}
                rows={3}
                style={{ borderColor: "#c8dedd", borderRadius: "10px", resize: "none" }}
              />
              <p style={{ fontSize: "11px", color: "#8a7a6a", margin: "3px 0 0", lineHeight: 1.4 }}>4 lines max on the card</p>
            </div>

            {/* ── Friendliness HP ── */}
            <div>
              <Label style={{ fontWeight: 700, color: "#4a3c2e", fontSize: "13px", marginBottom: "8px", display: "flex", justifyContent: "space-between" }}>
                <span>💖 Friendliness Score</span>
                <span style={{ color: "#E8879A", fontFamily: "'Fredoka One', cursive" }}>{formData.hp} HP</span>
              </Label>
              <Slider
                value={[formData.hp ?? 75]}
                onValueChange={([v]) => updateField("hp", v)}
                min={1}
                max={100}
                step={1}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#8a7a6a", marginTop: "4px" }}>
                <span>Shy</span>
                <span>Social butterfly!</span>
              </div>
            </div>

            {/* ── Action Buttons ── */}
            {/* ── Demo loader ── */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "2px" }}>
              <Button
                onClick={handleLoadDemo}
                variant="outline"
                style={{
                  borderRadius: "12px",
                  borderColor: "#F4A88A",
                  color: "#b05a2a",
                  fontFamily: "'Baloo 2', cursive",
                  fontWeight: 700,
                  fontSize: "13px",
                  background: "rgba(244,168,138,0.10)",
                  width: "100%",
                }}
              >
                🐰 Load Demo Animal
              </Button>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "4px", flexWrap: "wrap" }}>
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                style={{
                  flex: 1,
                  minWidth: "140px",
                  background: "linear-gradient(135deg, #2AADA8, #1d8a86)",
                  color: "white",
                  borderRadius: "12px",
                  fontFamily: "'Baloo 2', cursive",
                  fontWeight: 700,
                  fontSize: "15px",
                  padding: "10px",
                  boxShadow: "0 4px 12px rgba(42,173,168,0.35)",
                  border: "none",
                }}
              >
                {isDownloading ? "⏳ Generating..." : "⬇️ Download Card"}
              </Button>
              <Button
                onClick={handlePrintSheet}
                variant="outline"
                style={{
                  borderRadius: "12px",
                  borderColor: "#2AADA8",
                  color: "#2AADA8",
                  fontFamily: "'Baloo 2', cursive",
                  fontWeight: 700,
                  fontSize: "13px",
                  background: "rgba(42,173,168,0.06)",
                }}
              >
                🖨️ Print Sheet
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                style={{
                  borderRadius: "12px",
                  borderColor: "#c8dedd",
                  color: "#6a8a88",
                  fontFamily: "'Baloo 2', cursive",
                  fontWeight: 700,
                }}
              >
                🔄 Reset
              </Button>
            </div>

          </div>
        </div>

        {/* === RIGHT: PREVIEW PANEL === */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
        }}>
          <div style={{
            background: "rgba(255,255,255,0.7)",
            borderRadius: "20px",
            padding: "24px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            border: "1.5px solid rgba(42,173,168,0.15)",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", justifyContent: "space-between" }}>
              <h2 style={{
                fontFamily: "'Fredoka One', cursive",
                fontSize: "22px",
                color: "#2AADA8",
                margin: 0,
              }}>
                👁️ Live Preview
              </h2>
              <Button
                onClick={() => setShowBack(!showBack)}
                variant="outline"
                style={{
                  borderRadius: "10px",
                  borderColor: "#c8dedd",
                  color: "#6a8a88",
                  fontFamily: "'Baloo 2', cursive",
                  fontWeight: 700,
                  fontSize: "13px",
                }}
              >
                {showBack ? "🃏 Show Front" : "🔄 Show Back"}
              </Button>
            </div>

            {/* Card flip container */}
            <div style={{
              perspective: "1200px",
              width: "280px",
              height: "390px",
              flexShrink: 0,
              position: "relative",
            }}>
              <div style={{
                width: "280px",
                height: "390px",
                transition: "transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
                transformStyle: "preserve-3d",
                transform: showBack ? "rotateY(180deg)" : "rotateY(0deg)",
                position: "relative",
              }}>
                {/* Front — scaled 560×780 → 280×390 */}
                <div style={{
                  position: "absolute",
                  width: "280px",
                  height: "390px",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  overflow: "hidden",
                  borderRadius: "12px",
                }}>
                  <div style={{
                    transform: "scale(0.5)",
                    transformOrigin: "top left",
                    width: "560px",
                    height: "780px",
                  }}>
                    <AnimalCard
                      data={formData}
                      cardRef={cardRef}
                      logoUrl={HALT_LOGO_URL}
                      cardBgUrl={CARD_BG_URL}
                    />
                  </div>
                </div>
                {/* Back — rendered with real HALT logo */}
                <div style={{
                  position: "absolute",
                  width: "280px",
                  height: "390px",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  overflow: "hidden",
                  borderRadius: "12px",
                }}>
                  <div style={{
                    transform: "scale(0.5)",
                    transformOrigin: "top left",
                    width: "560px",
                    height: "780px",
                  }}>
                    <AnimalCardBack />
                  </div>
                </div>
              </div>
            </div>

            <p style={{
              fontSize: "12px",
              color: "#8a7a6a",
              textAlign: "center",
              margin: 0,
              fontStyle: "italic",
            }}>
              Fill in the form to see your card update live! The downloaded card will be full resolution.
            </p>
          </div>

          {/* Tips card */}
          <div style={{
            background: "rgba(42,173,168,0.08)",
            borderRadius: "16px",
            padding: "16px 20px",
            border: "1.5px solid rgba(42,173,168,0.2)",
            width: "100%",
          }}>
            <h3 style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: "16px",
              color: "#2AADA8",
              margin: "0 0 10px",
            }}>💡 Tips for Great Cards</h3>
            <ul style={{ margin: 0, padding: "0 0 0 16px", fontSize: "13px", color: "#4a3c2e", lineHeight: 1.7 }}>
              <li>Use a <strong>clear, well-lit photo</strong> — the editor can brighten dark shots</li>
              <li>Use <strong>✂️ Edit Photo</strong> to crop, rotate, and adjust after uploading</li>
              <li>Square or portrait photos work best for the card frame</li>
              <li>Keep the bio to <strong>2–3 sentences</strong> — it's a card, not a novel! 🐾</li>
              <li>Use <strong>🖨️ Print Sheet</strong> to print 6 cards per page on cardstock</li>
            </ul>
          </div>
        </div>

      </main>

      {/* === HIDDEN FULL-SIZE CARD FOR DOWNLOAD ===
           This renders the card at actual 600×840 off-screen so html2canvas
           captures it at full resolution without the scale(0.5) preview wrapper.
      */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          left: "-9999px",
          top: 0,
          width: "560px",
          height: "780px",
          pointerEvents: "none",
          zIndex: -1,
          overflow: "hidden",
        }}
      >
        <AnimalCard
          data={formData}
          cardRef={downloadCardRef}
          logoUrl={HALT_LOGO_URL}
          cardBgUrl={CARD_BG_URL}
        />
      </div>

      {/* === FOOTER === */}
      <footer style={{
        textAlign: "center",
        padding: "20px",
        borderTop: "1.5px solid rgba(42,173,168,0.15)",
        background: "rgba(255,255,255,0.6)",
        fontSize: "12px",
        color: "#8a7a6a",
      }}>
        <span>Made with 💛 for </span>
        <a href="https://helpingalllittlethings.org" target="_blank" rel="noopener noreferrer"
          style={{ color: "#2AADA8", fontWeight: 700, textDecoration: "none" }}>
          Helping All Little Things
        </a>
        <span> · 501(c)(3) Small Animal Rescue · New Hampshire</span>
      </footer>

    </div>
  );
}
