/*
 * AnimalCard — HALT Trading Card Component
 * Design: Cottagecore Pokédex — HALT brand (teal #2AADA8, peach, soft pinks)
 *
 * Card dimensions: 560×780px (standard trading card 2.5"×3.5" at 224dpi)
 * Layout (top→bottom):
 *   Header bar   — 80px  (name, card#, species icon, HP)
 *   Status badge — 32px  (optional, only if set)
 *   PHOTO        — 380px (large, dominant — the star of the card)
 *   Stats row    — 64px  (sex / age / weight)
 *   Tags + fact  — auto  (personality pills + fun fact)
 *   Bio          — 4 lines max
 *   Footer bar   — 52px  (logo left, URL right)
 *
 * Background: botanical texture at 60% opacity + light cream overlay
 */

import React from "react";

// ─── Species icon CDN URLs ────────────────────────────────────────────────────
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

function getSpeciesIcon(species: string): string {
  return SPECIES_ICONS[species?.toLowerCase()] ?? SPECIES_ICONS.other;
}

// Single canonical logo URL — exported so Home/PrintSheet can use the same one
export const HALT_LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663404885239/KSAnxKy3iVwgftKj5yQJFJ/logo-square_ae1b8185.png";

// ─── Species colour palette ───────────────────────────────────────────────────
const SPECIES_COLORS: Record<string, { bg: string; text: string; label: string; tagText: string }> = {
  rabbit:        { bg: "#4BBFB8", text: "#fff",     label: "Rabbit",       tagText: "#1a6e6a" },
  "guinea pig":  { bg: "#F4A88A", text: "#fff",     label: "Guinea Pig",   tagText: "#7a3a18" },
  hamster:       { bg: "#F2C97E", text: "#5a3a00",  label: "Hamster",      tagText: "#5a3a00" },
  rat:           { bg: "#A8C4E0", text: "#1a3a5a",  label: "Rat",          tagText: "#1a3a5a" },
  mouse:         { bg: "#C8B4D8", text: "#3a1a5a",  label: "Mouse",        tagText: "#3a1a5a" },
  chinchilla:    { bg: "#B8D4C8", text: "#1a4a38",  label: "Chinchilla",   tagText: "#1a4a38" },
  gerbil:        { bg: "#D4C4A0", text: "#4a3a18",  label: "Gerbil",       tagText: "#4a3a18" },
  other:         { bg: "#E8B4C0", text: "#5a1a2a",  label: "Other",        tagText: "#5a1a2a" },
};

function getSpeciesStyle(species: string) {
  return SPECIES_COLORS[species?.toLowerCase()] ?? SPECIES_COLORS.other;
}

// ─── Adoption status ──────────────────────────────────────────────────────────
const ADOPTION_STATUS: Record<string, { label: string; icon: string; bg: string; text: string }> = {
  available:  { label: "Available for Adoption", icon: "💚", bg: "rgba(72,199,142,0.9)",  text: "#fff" },
  foster:     { label: "In Foster Care",          icon: "🏠", bg: "rgba(255,159,67,0.9)",  text: "#fff" },
  sanctuary:  { label: "Sanctuary Resident",      icon: "🌟", bg: "rgba(130,100,200,0.9)", text: "#fff" },
};

// ─── Heart HP display ─────────────────────────────────────────────────────────
const HEART_FILL_COLOR = "#e8365d";   // vivid pink-red for all species
const HEART_STROKE_COLOR = "rgba(255,255,255,0.9)"; // white outline for contrast on any header bg

function HeartHP({ value }: { value: number }) {
  const filled = Math.round((value / 100) * 5);
  return (
    <div style={{ display: "flex", gap: "3px" }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="18" height="18" viewBox="0 0 24 24"
          fill={i < filled ? HEART_FILL_COLOR : "none"}
          stroke={i < filled ? HEART_STROKE_COLOR : "rgba(255,255,255,0.5)"}
          strokeWidth="2"
          style={{ opacity: i < filled ? 1 : 0.45 }}
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ))}
    </div>
  );
}

// ─── Card data interface ──────────────────────────────────────────────────────
export interface AnimalCardData {
  name: string;
  species: string;
  sex: string;
  age: string;
  weight: string;
  personality: string;
  bio: string;
  funFact?: string;
  hp: number;
  photoUrl?: string;
  cardNumber?: string;
  adoptionStatus?: string;
}

interface AnimalCardProps {
  data: AnimalCardData;
  cardRef?: React.RefObject<HTMLDivElement | null>;
  logoUrl?: string;   // kept for backward compat — actual logo uses HALT_LOGO_URL constant
  cardBgUrl: string;
}

// ─── Card Back ───────────────────────────────────────────────────────────────
export function AnimalCardBack({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{
      width: "560px",
      height: "780px",
      borderRadius: "24px",
      overflow: "hidden",
      position: "relative",
      background: "linear-gradient(145deg, #2AADA8 0%, #1d8a86 40%, #f4a88a 100%)",
      boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "20px",
      ...style,
    }}>
      {/* Decorative rings */}
      <div style={{ position: "absolute", width: "500px", height: "500px", borderRadius: "50%", border: "3px solid rgba(255,255,255,0.12)", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
      <div style={{ position: "absolute", width: "380px", height: "380px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.1)", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
      {/* Paw prints */}
      {[{ top: "10%", left: "8%", r: "25deg" }, { bottom: "12%", right: "8%", r: "-20deg" }, { top: "15%", right: "12%", r: "40deg" }, { bottom: "18%", left: "10%", r: "-35deg" }].map((p, i) => (
        <div key={i} style={{ position: "absolute", top: p.top, bottom: (p as any).bottom, left: p.left, right: (p as any).right, fontSize: "28px", opacity: 0.15, transform: `rotate(${p.r})` }}>🐾</div>
      ))}
      {/* Logo */}
      <img
        src={HALT_LOGO_URL}
        alt="Helping All Little Things"
        style={{ width: "220px", height: "220px", objectFit: "contain", filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.3))", position: "relative", zIndex: 1 }}
      />
      <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
        <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: "26px", color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.3)", letterSpacing: "0.5px" }}>
          Helping All Little Things
        </div>
        <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.85)", fontWeight: 700, marginTop: "6px", letterSpacing: "0.5px" }}>
          helpingalllittlethings.org
        </div>
        <div style={{ marginTop: "12px", background: "rgba(255,255,255,0.2)", borderRadius: "20px", padding: "6px 20px", display: "inline-block" }}>
          <span style={{ fontSize: "13px", color: "#fff", fontWeight: 800 }}>Finding loving homes for small animals.</span>
        </div>
        <div style={{ marginTop: "10px", fontSize: "11px", color: "rgba(255,255,255,0.6)", letterSpacing: "0.5px" }}>
          © {new Date().getFullYear()} Helping All Little Things
        </div>
      </div>
    </div>
  );
}

// ─── Card Front ──────────────────────────────────────────────────────────────
export default function AnimalCard({ data, cardRef, cardBgUrl }: AnimalCardProps) {
  const speciesStyle = getSpeciesStyle(data.species);
  const hp = data.hp ?? 75;
  const statusInfo = (data.adoptionStatus && data.adoptionStatus !== "none") ? ADOPTION_STATUS[data.adoptionStatus] : null;

  return (
    <div
      ref={cardRef}
      id="animal-card"
      style={{
        width: "560px",
        height: "780px",
        borderRadius: "24px",
        overflow: "hidden",
        position: "relative",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.15)",
        fontFamily: "'Nunito', sans-serif",
        flexShrink: 0,
        background: "#fdf6ec",
      }}
    >
      {/* ── Botanical background texture ── */}
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
          opacity: 0.5,
        }}
      />
      {/* Cream overlay for text contrast */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(253,246,236,0.5)", zIndex: 0, pointerEvents: "none" }} />

      {/* Outer decorative border rings */}
      <div style={{ position: "absolute", inset: "7px", borderRadius: "19px", border: `4px solid ${speciesStyle.bg}`, zIndex: 10, pointerEvents: "none", boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.6)" }} />
      <div style={{ position: "absolute", inset: "13px", borderRadius: "14px", border: "2px solid rgba(255,255,255,0.7)", zIndex: 10, pointerEvents: "none" }} />

      {/* ── Content ── */}
      <div style={{
        position: "relative",
        zIndex: 3,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "20px 20px 0 20px",
        gap: "7px",
      }}>

        {/* HEADER: name + card# | species icon + label | HP */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: `linear-gradient(135deg, ${speciesStyle.bg}f0, ${speciesStyle.bg}cc)`,
          borderRadius: "14px",
          padding: "8px 14px",
          boxShadow: "0 3px 10px rgba(0,0,0,0.18)",
          flexShrink: 0,
          minHeight: "72px",
        }}>
          {/* Left: name + species */}
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: "30px", color: speciesStyle.text, lineHeight: 1.05, textShadow: "0 1px 4px rgba(0,0,0,0.25)" }}>
                {data.name || "Animal Name"}
              </div>
              {data.cardNumber && (
                <div style={{ fontSize: "14px", color: speciesStyle.text, opacity: 0.85, fontWeight: 800 }}>
                  #{String(data.cardNumber).padStart(3, "0")}
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "2px" }}>
              <img
                src={getSpeciesIcon(data.species)}
                alt={speciesStyle.label}
                style={{ width: "24px", height: "24px", objectFit: "contain", borderRadius: "50%", background: "rgba(255,255,255,0.3)", padding: "2px", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.15))" }}
              />
              <span style={{ fontSize: "15px", color: speciesStyle.text, fontWeight: 800, letterSpacing: "0.3px" }}>
                {speciesStyle.label}
              </span>
            </div>
          </div>
          {/* Right: HP */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "10px", color: speciesStyle.text, opacity: 0.9, fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "3px" }}>Friendliness</div>
            <HeartHP value={hp} />
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: "20px", color: speciesStyle.text, marginTop: "2px", textShadow: "0 1px 3px rgba(0,0,0,0.2)" }}>{hp} HP</div>
          </div>
        </div>

        {/* ADOPTION STATUS BADGE (optional) */}
        {statusInfo && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", background: statusInfo.bg, borderRadius: "10px", padding: "5px 14px", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", flexShrink: 0 }}>
            <span style={{ fontSize: "14px" }}>{statusInfo.icon}</span>
            <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: "14px", color: statusInfo.text, letterSpacing: "0.3px" }}>{statusInfo.label}</span>
          </div>
        )}

        {/* PHOTO — dominant, large */}
        <div style={{
          flex: "0 0 auto",
          height: "320px",
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
          <div style={{ position: "absolute", top: "8px", right: "10px", fontSize: "14px", opacity: 0.4 }}>✦</div>
        </div>

        {/* STATS ROW — compact */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "7px", flexShrink: 0 }}>
          {[
            { label: "Sex",    value: data.sex || "—",    icon: data.sex === "Female" ? "♀" : data.sex === "Male" ? "♂" : "⚥" },
            { label: "Age",    value: data.age || "—",    icon: "🌱" },
            { label: "Weight", value: data.weight || "—", icon: "⚖️" },
          ].map((stat) => (
            <div key={stat.label} style={{ background: "rgba(255,255,255,0.85)", borderRadius: "10px", padding: "6px 8px", textAlign: "center", border: `2px solid ${speciesStyle.bg}55` }}>
              <div style={{ fontSize: "14px", lineHeight: 1 }}>{stat.icon}</div>
              <div style={{ fontSize: "9px", color: "#7a6a5a", fontWeight: 800, letterSpacing: "0.5px", textTransform: "uppercase", marginTop: "2px" }}>{stat.label}</div>
              <div style={{ fontSize: "14px", fontWeight: 900, color: "#3a2e22", marginTop: "1px", fontFamily: "'Baloo 2', cursive" }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* PERSONALITY TAGS + FUN FACT — combined compact row */}
        {(data.personality || data.funFact) && (
          <div style={{ display: "flex", flexDirection: "column", gap: "5px", flexShrink: 0 }}>
            {data.personality && (
              <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                {data.personality.split(",").slice(0, 4).map((trait, i) => (
                  <span key={i} style={{
                    background: "rgba(255,255,255,0.88)",
                    border: `2px solid ${speciesStyle.bg}88`,
                    color: speciesStyle.tagText,
                    borderRadius: "20px",
                    padding: "2px 10px",
                    fontSize: "12px",
                    fontWeight: 800,
                  }}>
                    {trait.trim()}
                  </span>
                ))}
              </div>
            )}
            {data.funFact && (
              <div style={{ background: "rgba(255,255,255,0.82)", borderRadius: "10px", padding: "5px 10px", border: `2px solid ${speciesStyle.bg}66`, display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "14px", flexShrink: 0 }}>⭐</span>
                <span style={{ fontSize: "12px", color: "#3a2e22", fontWeight: 700, fontFamily: "'Baloo 2', cursive" }}>{data.funFact}</span>
              </div>
            )}
          </div>
        )}

        {/* BIO — 2 lines max, only if no fun fact OR if bio is set */}
        {data.bio && (
          <div style={{ background: "rgba(255,255,255,0.75)", borderRadius: "10px", padding: "6px 12px", border: `1.5px solid ${speciesStyle.bg}33`, flexShrink: 0 }}>
            <p style={{ fontSize: "12px", lineHeight: 1.45, color: "#4a3c2e", margin: 0, fontStyle: "italic", fontWeight: 600, display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {data.bio}
            </p>
          </div>
        )}

        {/* FOOTER — blends into card with gradient fade, no hard line */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: `linear-gradient(to bottom, rgba(253,246,236,0) 0%, rgba(253,246,236,0.82) 35%, rgba(253,246,236,0.95) 100%)`,
          marginLeft: "-20px",
          marginRight: "-20px",
          marginBottom: "-0px",
          padding: "18px 20px 12px 20px",
          flexShrink: 0,
          marginTop: "auto",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <img
              src={HALT_LOGO_URL}
              alt="Helping All Little Things"
              style={{ width: "30px", height: "30px", objectFit: "contain", flexShrink: 0, filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.18))" }}
            />
            <div style={{ fontFamily: "'Fredoka One', cursive", fontSize: "12px", color: "#1a5a56", lineHeight: 1.2 }}>
              Helping All Little Things
            </div>
          </div>
          <div style={{ fontSize: "10px", color: "#2a6a66", fontWeight: 800, letterSpacing: "0.3px" }}>
            helpingalllittlethings.org
          </div>
        </div>

      </div>
    </div>
  );
}
