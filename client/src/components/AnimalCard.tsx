/*
 * AnimalCard — The Pokemon-style trading card component
 * Design: Cottagecore Pokédex — HALT branding
 *
 * Card is rendered at 600×840px
 * Preview scales it to 300×420 via CSS transform: scale(0.5)
 *
 * Layout priorities (top → bottom):
 *   Header (name, species, HP)      ~100px
 *   [Optional] Adoption badge        ~36px
 *   Photo frame                      ~320px  ← TALL — square/portrait friendly
 *   Stats row (sex, age, weight)     ~72px
 *   [Optional] Personality tags      ~30px
 *   [Optional] Fun Fact callout      ~44px
 *   Bio (1–2 lines)                  ~52px
 *   Footer bar (logo | url)          ~52px
 *
 * Fixes applied:
 * - Logo: no white square — use drop-shadow filter, no background/padding
 * - Background: clipped to card via overflow:hidden on root div
 * - Footer: frosted white bar (rgba 0.85) for contrast, logo left + URL right only
 * - Photo: taller (320px base), fills width with objectFit:cover
 * - Personality tags color: use speciesStyle.bg as text but on white pill so contrast is fine
 */

import React from "react";

export interface AnimalCardData {
  name: string;
  species: string;
  sex: string;
  age: string;
  weight?: string;
  personality?: string;
  bio: string;
  photoUrl: string | null;
  hp?: number;
  cardNumber?: string;
  adoptionStatus?: string;
  funFact?: string;
}

const SPECIES_ICONS: Record<string, string> = {
  rabbit:       "https://d2xsxph8kpxj0f.cloudfront.net/310519663404885239/KSAnxKy3iVwgftKj5yQJFJ/icon-rabbit-DjdHtDr2ntE7CyriHdqmLx.webp",
  "guinea pig": "https://d2xsxph8kpxj0f.cloudfront.net/310519663404885239/KSAnxKy3iVwgftKj5yQJFJ/icon-guinea-pig-hEARVnZcw5PiPVayjM2AzG.webp",
  hamster:      "https://d2xsxph8kpxj0f.cloudfront.net/310519663404885239/KSAnxKy3iVwgftKj5yQJFJ/icon-hamster-fdvg2ThspDxNQD7eojKiGb.webp",
  rat:          "https://d2xsxph8kpxj0f.cloudfront.net/310519663404885239/KSAnxKy3iVwgftKj5yQJFJ/icon-rat-GgrHhEQFM5NKdeA5xAZFZX.webp",
  mouse:        "https://d2xsxph8kpxj0f.cloudfront.net/310519663404885239/KSAnxKy3iVwgftKj5yQJFJ/icon-mouse-hR8G9ZHBM5xZ8gCvK497L5.webp",
  chinchilla:   "https://d2xsxph8kpxj0f.cloudfront.net/310519663404885239/KSAnxKy3iVwgftKj5yQJFJ/icon-chinchilla-6FdBkEAcp7gWTmTfZPSjky.webp",
  gerbil:       "https://d2xsxph8kpxj0f.cloudfront.net/310519663404885239/KSAnxKy3iVwgftKj5yQJFJ/icon-gerbil-RkaHJEJQeMKiNb3brFSzXA.webp",
  other:        "https://d2xsxph8kpxj0f.cloudfront.net/310519663404885239/KSAnxKy3iVwgftKj5yQJFJ/icon-other-c52UFoxERLimRyevans5ky.webp",
};

// Footer logo — transparent PNG, use drop-shadow not background
// Single canonical URL used everywhere (header, card footer, card back)
export const HALT_LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663404885239/KSAnxKy3iVwgftKj5yQJFJ/logo-square_ae1b8185.png";

const SPECIES_COLORS: Record<string, { bg: string; text: string; label: string; tagText: string }> = {
  rabbit:        { bg: "#4BBFB8", text: "#fff",     label: "Rabbit",       tagText: "#1a6e6a" },
  "guinea pig":  { bg: "#F4A88A", text: "#fff",     label: "Guinea Pig",   tagText: "#7a3a18" },
  hamster:       { bg: "#E8879A", text: "#fff",      label: "Hamster",      tagText: "#7a2035" },
  rat:           { bg: "#7CB87C", text: "#fff",      label: "Rat",          tagText: "#2a5a2a" },
  mouse:         { bg: "#A89BD4", text: "#fff",      label: "Mouse",        tagText: "#3a2a7a" },
  chinchilla:    { bg: "#8BAED4", text: "#fff",      label: "Chinchilla",   tagText: "#1a3a6a" },
  gerbil:        { bg: "#D4A85A", text: "#fff",      label: "Gerbil",       tagText: "#6a4010" },
  other:         { bg: "#2AADA8", text: "#fff",      label: "Small Animal", tagText: "#0a5a58" },
};

const ADOPTION_STATUS: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  available: { label: "Available for Adoption", bg: "#2e7d32", text: "#fff", icon: "💚" },
  foster:    { label: "In Foster Care",          bg: "#e65100", text: "#fff", icon: "🏠" },
  resident:  { label: "Sanctuary Resident",      bg: "#6a1b9a", text: "#fff", icon: "🌟" },
};

function getSpeciesStyle(species: string) {
  const key = species.toLowerCase();
  return SPECIES_COLORS[key] || SPECIES_COLORS["other"];
}

function getSpeciesIcon(species: string): string {
  const key = species.toLowerCase();
  return SPECIES_ICONS[key] || SPECIES_ICONS["other"];
}

function HeartHP({ value, textColor }: { value: number; textColor: string }) {
  const filled = Math.round((value / 100) * 5);
  return (
    <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="18" height="18" viewBox="0 0 24 24"
          fill={i < filled ? "#ffb3c1" : "none"}
          stroke={textColor}
          strokeWidth="2.5"
          style={{ opacity: i < filled ? 1 : 0.5 }}
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ))}
    </div>
  );
}

function PawPrint({ style }: { style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 100 100" style={style} fill="currentColor">
      <ellipse cx="30" cy="20" rx="10" ry="13" />
      <ellipse cx="70" cy="20" rx="10" ry="13" />
      <ellipse cx="15" cy="45" rx="9" ry="12" />
      <ellipse cx="85" cy="45" rx="9" ry="12" />
      <ellipse cx="50" cy="68" rx="22" ry="26" />
    </svg>
  );
}

interface AnimalCardProps {
  data: AnimalCardData;
  cardRef?: React.RefObject<HTMLDivElement | null>;
  logoUrl?: string; // kept for backward compat but unused — logo is HALT_LOGO_URL constant
  cardBgUrl: string;
}

// ─── Card Back ───────────────────────────────────────────────────────────────
export function AnimalCardBack({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{
      width: "600px",
      height: "840px",
      borderRadius: "24px",
      overflow: "hidden",
      position: "relative",
      fontFamily: "'Nunito', sans-serif",
      flexShrink: 0,
      background: "linear-gradient(160deg, #e8f7f6 0%, #c5ecea 30%, #a8ddd9 60%, #7dcfca 100%)",
      boxShadow: "0 20px 60px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.15)",
      ...style,
    }}>
      <div style={{ position: "absolute", inset: "8px", borderRadius: "18px", border: "4px solid rgba(42,173,168,0.7)", zIndex: 2, pointerEvents: "none", boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.6)" }} />
      <div style={{ position: "absolute", inset: "14px", borderRadius: "14px", border: "2px solid rgba(255,255,255,0.8)", zIndex: 2, pointerEvents: "none" }} />
      {[
        { top: "40px", left: "30px", size: "90px", opacity: 0.07, rotate: "-20deg" },
        { bottom: "40px", right: "30px", size: "90px", opacity: 0.07, rotate: "15deg" },
        { top: "50%", left: "50%", size: "200px", opacity: 0.05, rotate: "0deg", transform: "translate(-50%,-50%)" },
      ].map((p, i) => (
        <PawPrint key={i} style={{ position: "absolute", top: p.top, bottom: p.bottom, left: p.left, right: p.right, width: p.size, height: p.size, color: "#2AADA8", opacity: p.opacity, zIndex: 1, transform: p.transform ?? `rotate(${p.rotate})` }} />
      ))}
      <div style={{ position: "relative", zIndex: 3, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "28px", padding: "40px" }}>
        <img src={HALT_LOGO_URL} alt="Helping All Little Things" crossOrigin="anonymous" style={{ width: "260px", height: "260px", objectFit: "contain", filter: "drop-shadow(0 4px 16px rgba(42,173,168,0.3))" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: "34px", color: "#1a7a76", lineHeight: 1.15, textShadow: "0 1px 3px rgba(255,255,255,0.8)", letterSpacing: "0.5px" }}>Helping All Little Things</div>
          <div style={{ fontFamily: "'Nunito', sans-serif", fontSize: "18px", color: "#2AADA8", fontWeight: 700, marginTop: "6px", letterSpacing: "0.5px" }}>helpingalllittlethings.org</div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.75)", borderRadius: "40px", padding: "10px 28px", border: "2px solid rgba(42,173,168,0.4)", boxShadow: "0 2px 12px rgba(42,173,168,0.15)" }}>
          <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: "18px", color: "#2AADA8", letterSpacing: "0.5px", textAlign: "center" }}>🐾 Small Animals, Big Hearts 🐾</div>
        </div>
        <div style={{ fontSize: "14px", color: "#3a8a86", fontWeight: 700, textAlign: "center", letterSpacing: "0.3px" }}>501(c)(3) Nonprofit · New Hampshire</div>
      </div>
    </div>
  );
}

// ─── Card Front ──────────────────────────────────────────────────────────────
export default function AnimalCard({ data, cardRef, cardBgUrl }: AnimalCardProps) {
  const speciesStyle = getSpeciesStyle(data.species);
  const hp = data.hp ?? 75;
  const statusInfo = (data.adoptionStatus && data.adoptionStatus !== "none") ? ADOPTION_STATUS[data.adoptionStatus] : null;

  // Compute photo height: start at 320px base, shrink if optional sections present
  // Header ~100, status ~40, stats ~72, tags ~34, funFact ~48, bio ~52, footer ~52 = ~398
  // Remaining for photo: 840 - 22(top pad) - 14(bottom pad) - 10*6(gaps) - 398 = ~346
  // With status: 840 - 22 - 14 - 60 - 438 = ~306
  const photoH = statusInfo ? 290 : 320;

  return (
    <div
      ref={cardRef}
      id="animal-card"
      style={{
        width: "600px",
        height: "840px",
        borderRadius: "24px",
        overflow: "hidden",          // ← clips background to card boundary
        position: "relative",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.15)",
        fontFamily: "'Nunito', sans-serif",
        flexShrink: 0,
        background: "#fdf6ec",
      }}
    >
      {/* Card background texture — botanical illustration, clipped by overflow:hidden */}
      <img
        src={cardBgUrl}
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          zIndex: 0,
          pointerEvents: "none",
          opacity: 0.55,
        }}
      />
      {/* Semi-transparent overlay for text contrast over botanical background */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "rgba(253,246,236,0.55)",
        zIndex: 0,
        pointerEvents: "none",
      }} />

      {/* Paw watermark */}
      <PawPrint style={{
        position: "absolute",
        bottom: "80px",
        right: "20px",
        width: "90px",
        height: "90px",
        color: speciesStyle.bg,
        opacity: 0.06,
        zIndex: 1,
        pointerEvents: "none",
      }} />

      {/* Outer border ring */}
      <div style={{ position: "absolute", inset: "8px", borderRadius: "18px", border: `4px solid ${speciesStyle.bg}`, zIndex: 2, pointerEvents: "none", boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.6)" }} />
      <div style={{ position: "absolute", inset: "14px", borderRadius: "14px", border: "2px solid rgba(255,255,255,0.7)", zIndex: 2, pointerEvents: "none" }} />

      {/* Content container */}
      <div style={{
        position: "relative",
        zIndex: 3,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "22px 22px 0 22px",
        gap: "9px",
      }}>

        {/* === HEADER: Name + HP + Species === */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: `linear-gradient(135deg, ${speciesStyle.bg}f0, ${speciesStyle.bg}cc)`,
          borderRadius: "14px",
          padding: "10px 16px",
          boxShadow: "0 3px 10px rgba(0,0,0,0.18)",
          flexShrink: 0,
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
              <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: "34px", color: speciesStyle.text, lineHeight: 1.05, textShadow: "0 1px 4px rgba(0,0,0,0.25)", letterSpacing: "0.5px" }}>
                {data.name || "Animal Name"}
              </div>
              {data.cardNumber && (
                <div style={{ fontSize: "15px", color: speciesStyle.text, opacity: 0.85, fontWeight: 800, fontFamily: "'Nunito', sans-serif" }}>
                  #{String(data.cardNumber).padStart(3, "0")}
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "16px", color: speciesStyle.text, opacity: 0.95, fontWeight: 800, letterSpacing: "0.5px", marginTop: "2px" }}>
              <img
                src={getSpeciesIcon(data.species)}
                alt={speciesStyle.label}
                crossOrigin="anonymous"
                style={{
                  width: "26px",
                  height: "26px",
                  objectFit: "contain",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.3)",
                  padding: "2px",
                  flexShrink: 0,
                  // No white square — transparent bg + drop-shadow
                  filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.15))",
                }}
              />
              {speciesStyle.label}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "11px", color: speciesStyle.text, opacity: 0.9, fontWeight: 800, marginBottom: "4px", letterSpacing: "1px", textTransform: "uppercase" }}>Friendliness</div>
            <HeartHP value={hp} textColor={speciesStyle.text} />
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: "22px", color: speciesStyle.text, marginTop: "3px", textShadow: "0 1px 3px rgba(0,0,0,0.2)" }}>{hp} HP</div>
          </div>
        </div>

        {/* === ADOPTION STATUS BADGE === */}
        {statusInfo && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: `${statusInfo.bg}`, borderRadius: "10px", padding: "6px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", flexShrink: 0 }}>
            <span style={{ fontSize: "16px" }}>{statusInfo.icon}</span>
            <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: "16px", color: statusInfo.text, letterSpacing: "0.3px", textShadow: "0 1px 2px rgba(0,0,0,0.2)" }}>{statusInfo.label}</span>
          </div>
        )}

        {/* === PHOTO FRAME — tall, square/portrait friendly === */}
        <div style={{
          flex: "0 0 auto",
          height: `${photoH}px`,
          borderRadius: "14px",
          overflow: "hidden",
          border: `3px solid ${speciesStyle.bg}99`,
          boxShadow: "0 4px 16px rgba(0,0,0,0.18), inset 0 0 0 2px rgba(255,255,255,0.5)",
          background: "#f0ebe0",
          position: "relative",
          flexShrink: 0,
        }}>
          {data.photoUrl ? (
            <img
              src={data.photoUrl}
              alt={data.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #f0ebe0, #e8e0d0)", color: "#b0a898", gap: "10px" }}>
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <span style={{ fontSize: "16px", fontWeight: 700 }}>Upload a photo</span>
            </div>
          )}
          <div style={{ position: "absolute", top: "8px", right: "10px", fontSize: "16px", opacity: 0.5 }}>✦</div>
          <div style={{ position: "absolute", bottom: "8px", left: "10px", fontSize: "12px", opacity: 0.35 }}>✦</div>
        </div>

        {/* === STATS ROW === */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "9px", flexShrink: 0 }}>
          {[
            { label: "Sex",    value: data.sex || "—",    icon: data.sex === "Female" ? "♀" : data.sex === "Male" ? "♂" : "⚥" },
            { label: "Age",    value: data.age || "—",    icon: "🌱" },
            { label: "Weight", value: data.weight || "—", icon: "⚖️" },
          ].map((stat) => (
            <div key={stat.label} style={{ background: "rgba(255,255,255,0.82)", borderRadius: "11px", padding: "7px 10px", textAlign: "center", border: `2px solid ${speciesStyle.bg}55`, boxShadow: "0 2px 6px rgba(0,0,0,0.07)" }}>
              <div style={{ fontSize: "16px", lineHeight: 1 }}>{stat.icon}</div>
              <div style={{ fontSize: "10px", color: "#7a6a5a", fontWeight: 800, letterSpacing: "0.5px", textTransform: "uppercase", marginTop: "2px" }}>{stat.label}</div>
              <div style={{ fontSize: "15px", fontWeight: 900, color: "#3a2e22", marginTop: "2px", fontFamily: "'Baloo 2', cursive" }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* === PERSONALITY TAGS — white pill with colored text for contrast === */}
        {data.personality && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", flexShrink: 0 }}>
            {data.personality.split(",").slice(0, 4).map((trait, i) => (
              <span key={i} style={{
                background: "rgba(255,255,255,0.88)",
                border: `2px solid ${speciesStyle.bg}88`,
                color: speciesStyle.tagText,
                borderRadius: "20px",
                padding: "3px 12px",
                fontSize: "13px",
                fontWeight: 800,
                letterSpacing: "0.2px",
              }}>
                {trait.trim()}
              </span>
            ))}
          </div>
        )}

        {/* === FUN FACT CALLOUT === */}
        {data.funFact && (
          <div style={{ background: "rgba(255,255,255,0.82)", borderRadius: "11px", padding: "7px 12px", border: `2px solid ${speciesStyle.bg}66`, display: "flex", alignItems: "flex-start", gap: "7px", flexShrink: 0 }}>
            <span style={{ fontSize: "16px", flexShrink: 0, lineHeight: 1.4 }}>⭐</span>
            <p style={{ fontSize: "14px", lineHeight: 1.4, color: "#3a2e22", margin: 0, fontWeight: 700, fontFamily: "'Baloo 2', cursive" }}>
              {data.funFact}
            </p>
          </div>
        )}

        {/* === BIO === */}
        <div style={{ background: "rgba(255,255,255,0.78)", borderRadius: "11px", padding: "8px 14px", border: `1.5px solid ${speciesStyle.bg}33`, flex: 1, overflow: "hidden", minHeight: 0 }}>
          <p style={{ fontSize: "14px", lineHeight: 1.5, color: "#4a3c2e", margin: 0, fontStyle: "italic", fontWeight: 600, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {data.bio || "A wonderful little creature waiting to find their forever home."}
          </p>
        </div>

        {/* === FOOTER BAR — frosted white, logo left + URL right === */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          // Frosted white bar — extends to card edges
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(4px)",
          borderTop: `2px solid ${speciesStyle.bg}55`,
          marginLeft: "-22px",
          marginRight: "-22px",
          padding: "10px 22px",
          flexShrink: 0,
          height: "56px",
        }}>
          {/* Left: logo (transparent, no white box) + org name */}
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <img
              src={HALT_LOGO_URL}
              alt="Helping All Little Things"
              crossOrigin="anonymous"
              style={{
                width: "38px",
                height: "38px",
                objectFit: "contain",
                flexShrink: 0,
                // drop-shadow instead of background — no white square
                filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.15))",
              }}
            />
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: "15px", color: "#1a5a56", lineHeight: 1.15, letterSpacing: "0.2px" }}>
              Helping All Little Things
            </div>
          </div>
          {/* Right: URL only */}
          <div style={{ fontSize: "12px", color: "#2a6a66", fontWeight: 800, letterSpacing: "0.3px", textAlign: "right" }}>
            helpingalllittlethings.org
          </div>
        </div>

      </div>
    </div>
  );
}
