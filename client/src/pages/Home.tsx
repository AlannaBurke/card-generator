/*
 * Home — Card Generator Main Page
 * Design: Cottagecore Pokédex
 * Layout: Left panel (form) + Right panel (live card preview)
 * - Teal hero header with HALT branding
 * - Form fields: photo upload, name, species, sex, age, weight, personality, bio, HP
 * - Live preview updates in real time
 * - Download button exports card as PNG
 */

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import AnimalCard, { AnimalCardData } from "@/components/AnimalCard";
import { useCardDownload } from "@/hooks/useCardDownload";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663404885239/KSAnxKy3iVwgftKj5yQJFJ/logo-square_17e2654f.png";
const CARD_BG_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663404885239/KSAnxKy3iVwgftKj5yQJFJ/card-bg-texture-NUuh8tVs2vLnJ3cEafbiB8.webp";
const HERO_BG_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663404885239/KSAnxKy3iVwgftKj5yQJFJ/app-hero-bg-CWeUKfCSYNAGPYj2aoU9jQ.webp";
const CARD_BACK_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663404885239/KSAnxKy3iVwgftKj5yQJFJ/card-back-design-9EfXenfGhBLKc4MrnhnWvn.webp";

const SPECIES_OPTIONS = [
  "Rabbit",
  "Guinea Pig",
  "Hamster",
  "Rat",
  "Mouse",
  "Chinchilla",
  "Gerbil",
  "Other",
];

const DEFAULT_DATA: AnimalCardData = {
  name: "",
  species: "Rabbit",
  sex: "Unknown",
  age: "",
  weight: "",
  personality: "",
  bio: "",
  photoUrl: null,
  hp: 75,
};

export default function Home() {
  const [formData, setFormData] = useState<AnimalCardData>(DEFAULT_DATA);
  const [showBack, setShowBack] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { downloadCard, isDownloading } = useCardDownload();

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
      updateField("photoUrl", e.target?.result as string);
      toast.success("Photo uploaded! 🐾");
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handlePhotoUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handlePhotoUpload(file);
  };

  const handleDownload = () => {
    if (!cardRef.current) return;
    downloadCard(cardRef.current, formData.name);
  };

  const handleReset = () => {
    setFormData(DEFAULT_DATA);
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.info("Form cleared!");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fdf6ec", fontFamily: "'Nunito', sans-serif" }}>

      {/* === HERO HEADER === */}
      <header style={{
        position: "relative",
        backgroundImage: `url(${HERO_BG_URL})`,
        backgroundSize: "cover",
        backgroundPosition: "center top",
        padding: "32px 24px 40px",
        overflow: "hidden",
      }}>
        {/* Overlay for text readability */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(42,173,168,0.55) 0%, rgba(42,173,168,0.3) 60%, rgba(253,246,236,0.9) 100%)",
        }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: "900px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginBottom: "12px" }}>
            <img src={LOGO_URL} alt="HALT Logo" style={{ width: "72px", height: "72px", objectFit: "contain", filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.2))" }} />
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

      {/* === MAIN CONTENT: Form + Preview === */}
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

            {/* Photo Upload */}
            <div>
              <Label style={{ fontWeight: 700, color: "#4a3c2e", fontSize: "13px", marginBottom: "6px", display: "block" }}>
                📸 Photo
              </Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                style={{
                  border: `2px dashed ${dragOver ? "#2AADA8" : "#b0c8c6"}`,
                  borderRadius: "12px",
                  padding: "16px",
                  textAlign: "center",
                  cursor: "pointer",
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
                    <div style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.4)",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0,
                      transition: "opacity 0.2s",
                    }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                    >
                      <span style={{ color: "white", fontWeight: 700, fontSize: "13px" }}>Click to change</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: "#8a9e9c", padding: "8px 0" }}>
                    <div style={{ fontSize: "32px", marginBottom: "6px" }}>🖼️</div>
                    <div style={{ fontWeight: 700, fontSize: "13px" }}>Click or drag & drop</div>
                    <div style={{ fontSize: "11px", marginTop: "2px" }}>JPG, PNG, WEBP · Max 10MB</div>
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

            {/* Name */}
            <div>
              <Label style={{ fontWeight: 700, color: "#4a3c2e", fontSize: "13px", marginBottom: "6px", display: "block" }}>
                🏷️ Name *
              </Label>
              <Input
                placeholder="e.g. Biscuit, Peanut, Clover..."
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                style={{ borderColor: "#c8dedd", borderRadius: "10px" }}
              />
            </div>

            {/* Species + Sex row */}
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

            {/* Age + Weight row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <Label style={{ fontWeight: 700, color: "#4a3c2e", fontSize: "13px", marginBottom: "6px", display: "block" }}>
                  🌱 Age
                </Label>
                <Input
                  placeholder="e.g. 2 years"
                  value={formData.age}
                  onChange={(e) => updateField("age", e.target.value)}
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
                  style={{ borderColor: "#c8dedd", borderRadius: "10px" }}
                />
              </div>
            </div>

            {/* Personality */}
            <div>
              <Label style={{ fontWeight: 700, color: "#4a3c2e", fontSize: "13px", marginBottom: "6px", display: "block" }}>
                ✨ Personality Traits
                <span style={{ fontWeight: 400, color: "#8a7a6a", marginLeft: "6px" }}>comma-separated</span>
              </Label>
              <Input
                placeholder="e.g. Curious, Gentle, Loves cuddles"
                value={formData.personality}
                onChange={(e) => updateField("personality", e.target.value)}
                style={{ borderColor: "#c8dedd", borderRadius: "10px" }}
              />
            </div>

            {/* Bio */}
            <div>
              <Label style={{ fontWeight: 700, color: "#4a3c2e", fontSize: "13px", marginBottom: "6px", display: "block" }}>
                📖 Bio / Story
              </Label>
              <Textarea
                placeholder="Tell their story! How did they come to the sanctuary? What makes them special?"
                value={formData.bio}
                onChange={(e) => updateField("bio", e.target.value)}
                rows={3}
                style={{ borderColor: "#c8dedd", borderRadius: "10px", resize: "vertical" }}
              />
            </div>

            {/* Friendliness HP */}
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
                style={{ accentColor: "#E8879A" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#8a7a6a", marginTop: "4px" }}>
                <span>Shy</span>
                <span>Social butterfly!</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                style={{
                  flex: 1,
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

          {/* Card flip container — uses CSS 3D flip */}
          <div style={{
            perspective: "1200px",
            width: "300px",
            height: "420px",
            flexShrink: 0,
            position: "relative",
          }}>
            <div style={{
              width: "300px",
              height: "420px",
              transition: "transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
              transformStyle: "preserve-3d",
              transform: showBack ? "rotateY(180deg)" : "rotateY(0deg)",
              position: "relative",
            }}>
              {/* Front — scaled down from 600×840 to 300×420 */}
              <div style={{
                position: "absolute",
                width: "300px",
                height: "420px",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                overflow: "hidden",
                borderRadius: "12px",
              }}>
                <div style={{
                  transform: "scale(0.5)",
                  transformOrigin: "top left",
                  width: "600px",
                  height: "840px",
                }}>
                  <AnimalCard
                    data={formData}
                    cardRef={cardRef}
                    logoUrl={LOGO_URL}
                    cardBgUrl={CARD_BG_URL}
                  />
                </div>
              </div>
              {/* Back */}
              <div style={{
                position: "absolute",
                width: "300px",
                height: "420px",
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}>
                <img
                  src={CARD_BACK_URL}
                  alt="Card Back"
                  style={{
                    width: "300px",
                    height: "420px",
                    objectFit: "cover",
                    borderRadius: "12px",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
                    display: "block",
                  }}
                />
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
              <li>Use a <strong>clear, well-lit photo</strong> with the animal as the main subject</li>
              <li>Square or portrait photos work best for the card frame</li>
              <li>Keep the bio to <strong>2–3 sentences</strong> — it's a card, not a novel! 🐾</li>
              <li>Personality traits like "Curious, Gentle, Loves veggies" add charm</li>
              <li>The card downloads at <strong>high resolution</strong> — perfect for sharing!</li>
            </ul>
          </div>
        </div>

      </main>

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
