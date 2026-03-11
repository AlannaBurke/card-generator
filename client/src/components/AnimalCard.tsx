/*
 * AnimalCard — The Pokemon-style trading card component
 * Design: Cottagecore Pokédex
 * - Parchment background with botanical corner decorations
 * - Teal/peach color scheme matching HALT branding
 * - Species-type color badge system
 * - Stats grid with heart HP meter
 * - Adoption status badge
 * - Card number (#001 style)
 * - HALT logo + website in footer
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
  hp?: number;            // 1–100 friendliness score
  cardNumber?: string;    // e.g. "042"
  adoptionStatus?: string; // "available" | "foster" | "resident" | ""
}

const SPECIES_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  rabbit:        { bg: "#4BBFB8", text: "#fff",     label: "Rabbit" },
  "guinea pig":  { bg: "#F4A88A", text: "#4a2e1a",  label: "Guinea Pig" },
  hamster:       { bg: "#E8879A", text: "#fff",      label: "Hamster" },
  rat:           { bg: "#7CB87C", text: "#fff",      label: "Rat" },
  mouse:         { bg: "#A89BD4", text: "#fff",      label: "Mouse" },
  chinchilla:    { bg: "#8BAED4", text: "#fff",      label: "Chinchilla" },
  gerbil:        { bg: "#D4A85A", text: "#fff",      label: "Gerbil" },
  other:         { bg: "#2AADA8", text: "#fff",      label: "Small Animal" },
};

const ADOPTION_STATUS: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  available: { label: "Available for Adoption", bg: "#4CAF50", text: "#fff", icon: "💚" },
  foster:    { label: "In Foster Care",          bg: "#FF9800", text: "#fff", icon: "🏠" },
  resident:  { label: "Sanctuary Resident",      bg: "#9C27B0", text: "#fff", icon: "🌟" },
};

function getSpeciesStyle(species: string) {
  const key = species.toLowerCase();
  return SPECIES_COLORS[key] || SPECIES_COLORS["other"];
}

function HeartHP({ value }: { value: number }) {
  const filled = Math.round((value / 100) * 5);
  return (
    <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i < filled ? "#E8879A" : "none"} stroke="#E8879A" strokeWidth="2">
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
  logoUrl: string;
  cardBgUrl: string;
}

export default function AnimalCard({ data, cardRef, logoUrl, cardBgUrl }: AnimalCardProps) {
  const speciesStyle = getSpeciesStyle(data.species);
  const hp = data.hp ?? 75;
  const statusInfo = (data.adoptionStatus && data.adoptionStatus !== "none") ? ADOPTION_STATUS[data.adoptionStatus] : null;

  const CARD_W = 600;
  const CARD_H = 840;

  return (
    <div
      ref={cardRef}
      id="animal-card"
      style={{
        width: `${CARD_W}px`,
        height: `${CARD_H}px`,
        borderRadius: "24px",
        overflow: "hidden",
        position: "relative",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.15)",
        fontFamily: "'Nunito', sans-serif",
        flexShrink: 0,
        background: "#fdf6ec",
      }}
    >
      {/* Card background texture */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `url(${cardBgUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        zIndex: 0,
      }} />

      {/* Paw watermark */}
      <PawPrint style={{
        position: "absolute",
        bottom: "80px",
        right: "20px",
        width: "80px",
        height: "80px",
        color: speciesStyle.bg,
        opacity: 0.08,
        zIndex: 1,
      }} />

      {/* Outer border ring */}
      <div style={{
        position: "absolute",
        inset: "8px",
        borderRadius: "18px",
        border: `4px solid ${speciesStyle.bg}`,
        zIndex: 2,
        pointerEvents: "none",
        boxShadow: `inset 0 0 0 2px rgba(255,255,255,0.6)`,
      }} />
      <div style={{
        position: "absolute",
        inset: "14px",
        borderRadius: "14px",
        border: `2px solid rgba(255,255,255,0.7)`,
        zIndex: 2,
        pointerEvents: "none",
      }} />

      {/* Content container */}
      <div style={{
        position: "relative",
        zIndex: 3,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "22px 22px 16px",
        gap: "8px",
      }}>

        {/* === TOP HEADER: Name + HP + Type badge === */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: `linear-gradient(135deg, ${speciesStyle.bg}ee, ${speciesStyle.bg}cc)`,
          borderRadius: "12px",
          padding: "8px 14px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <div style={{
                fontFamily: "'Fredoka One', cursive",
                fontSize: "26px",
                color: speciesStyle.text,
                lineHeight: 1.1,
                textShadow: "0 1px 2px rgba(0,0,0,0.15)",
                letterSpacing: "0.5px",
              }}>
                {data.name || "Animal Name"}
              </div>
              {data.cardNumber && (
                <div style={{
                  fontSize: "11px",
                  color: speciesStyle.text,
                  opacity: 0.75,
                  fontWeight: 700,
                  fontFamily: "'Nunito', sans-serif",
                }}>
                  #{String(data.cardNumber).padStart(3, "0")}
                </div>
              )}
            </div>
            <div style={{
              fontSize: "12px",
              color: speciesStyle.text,
              opacity: 0.85,
              fontWeight: 700,
              letterSpacing: "0.5px",
            }}>
              {speciesStyle.label}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{
              fontSize: "10px",
              color: speciesStyle.text,
              opacity: 0.8,
              fontWeight: 700,
              marginBottom: "3px",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}>Friendliness</div>
            <HeartHP value={hp} />
            <div style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: "18px",
              color: speciesStyle.text,
              marginTop: "2px",
            }}>{hp} HP</div>
          </div>
        </div>

        {/* === ADOPTION STATUS BADGE === */}
        {statusInfo && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            background: `${statusInfo.bg}ee`,
            borderRadius: "10px",
            padding: "5px 12px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          }}>
            <span style={{ fontSize: "14px" }}>{statusInfo.icon}</span>
            <span style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: "13px",
              color: statusInfo.text,
              letterSpacing: "0.3px",
              textShadow: "0 1px 2px rgba(0,0,0,0.2)",
            }}>
              {statusInfo.label}
            </span>
          </div>
        )}

        {/* === PHOTO FRAME === */}
        <div style={{
          flex: "0 0 auto",
          height: statusInfo ? "278px" : "296px",
          borderRadius: "14px",
          overflow: "hidden",
          border: `3px solid ${speciesStyle.bg}88`,
          boxShadow: "0 4px 16px rgba(0,0,0,0.15), inset 0 0 0 2px rgba(255,255,255,0.5)",
          background: "#f0ebe0",
          position: "relative",
        }}>
          {data.photoUrl ? (
            <img
              src={data.photoUrl}
              alt={data.name}
              crossOrigin="anonymous"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : (
            <div style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #f0ebe0, #e8e0d0)",
              color: "#b0a898",
              gap: "8px",
            }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <span style={{ fontSize: "14px", fontWeight: 600 }}>Upload a photo</span>
            </div>
          )}
          <div style={{ position: "absolute", top: "6px", right: "8px", fontSize: "16px", opacity: 0.7 }}>✦</div>
          <div style={{ position: "absolute", bottom: "6px", left: "8px", fontSize: "12px", opacity: 0.5 }}>✦</div>
        </div>

        {/* === STATS ROW === */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "8px",
        }}>
          {[
            { label: "Sex", value: data.sex || "—", icon: data.sex === "Female" ? "♀" : data.sex === "Male" ? "♂" : "⚥" },
            { label: "Age", value: data.age || "—", icon: "🌱" },
            { label: "Weight", value: data.weight || "—", icon: "⚖️" },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: "rgba(255,255,255,0.75)",
              borderRadius: "10px",
              padding: "6px 8px",
              textAlign: "center",
              border: `1.5px solid ${speciesStyle.bg}44`,
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}>
              <div style={{ fontSize: "16px", lineHeight: 1 }}>{stat.icon}</div>
              <div style={{ fontSize: "9px", color: "#8a7a6a", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", marginTop: "2px" }}>{stat.label}</div>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#3a2e22", marginTop: "1px" }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* === PERSONALITY TAGS === */}
        {data.personality && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexWrap: "wrap",
          }}>
            {data.personality.split(",").slice(0, 4).map((trait, i) => (
              <span key={i} style={{
                background: `${speciesStyle.bg}22`,
                border: `1.5px solid ${speciesStyle.bg}55`,
                color: speciesStyle.bg,
                borderRadius: "20px",
                padding: "2px 10px",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.3px",
              }}>
                {trait.trim()}
              </span>
            ))}
          </div>
        )}

        {/* === BIO === */}
        <div style={{
          background: "rgba(255,255,255,0.7)",
          borderRadius: "10px",
          padding: "8px 12px",
          border: `1.5px solid ${speciesStyle.bg}33`,
          flex: 1,
          overflow: "hidden",
        }}>
          <p style={{
            fontSize: "12px",
            lineHeight: 1.5,
            color: "#4a3c2e",
            margin: 0,
            fontStyle: "italic",
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {data.bio || "A wonderful little creature waiting to find their forever home."}
          </p>
        </div>

        {/* === FOOTER === */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: "4px",
          borderTop: `1.5px solid ${speciesStyle.bg}33`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <img
              src={logoUrl}
              alt="Helping All Little Things"
              crossOrigin="anonymous"
              style={{ width: "36px", height: "36px", objectFit: "contain" }}
            />
            <div>
              <div style={{
                fontFamily: "'Fredoka One', cursive",
                fontSize: "11px",
                color: speciesStyle.bg,
                lineHeight: 1.2,
              }}>Helping All Little Things</div>
              <div style={{
                fontSize: "9px",
                color: "#8a7a6a",
                fontWeight: 600,
              }}>helpingalllittlethings.org</div>
            </div>
          </div>
          <div style={{
            fontSize: "9px",
            color: "#b0a898",
            fontWeight: 600,
            textAlign: "right",
          }}>
            <div>501(c)(3) Nonprofit</div>
            <div>New Hampshire</div>
          </div>
        </div>

      </div>
    </div>
  );
}
