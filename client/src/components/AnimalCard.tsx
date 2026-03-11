/*
 * AnimalCard — The Pokemon-style trading card component
 * Design: Cottagecore Pokédex
 * - Parchment background with botanical corner decorations
 * - Teal/peach color scheme matching HALT branding
 * - Species-type color badge system
 * - Stats grid with heart HP meter — ALL TEXT LARGE & BOLD
 * - Adoption status badge
 * - Card number (#001 style)
 * - HALT logo + website in footer
 *
 * Card is rendered at 600×840px (2:1.4 ratio, standard trading card)
 * Preview scales it to 300×420 via CSS transform: scale(0.5)
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
  adoptionStatus?: string; // "available" | "foster" | "resident" | "none"
  funFact?: string;       // short highlighted callout, e.g. "Loves blueberries!"
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
    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="20" height="20" viewBox="0 0 24 24" fill={i < filled ? "#E8879A" : "none"} stroke="#E8879A" strokeWidth="2">
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

// ─── Card Back (exported so PrintSheet can use it too) ───────────────────────
const HALT_LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663404885239/KSAnxKy3iVwgftKj5yQJFJ/logo-square_34fc5458.png";

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
      // Warm cream-to-teal gradient background
      background: "linear-gradient(160deg, #e8f7f6 0%, #c5ecea 30%, #a8ddd9 60%, #7dcfca 100%)",
      boxShadow: "0 20px 60px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.15)",
      ...style,
    }}>
      {/* Outer border ring */}
      <div style={{
        position: "absolute",
        inset: "8px",
        borderRadius: "18px",
        border: "4px solid rgba(42,173,168,0.7)",
        zIndex: 2,
        pointerEvents: "none",
        boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.6)",
      }} />
      <div style={{
        position: "absolute",
        inset: "14px",
        borderRadius: "14px",
        border: "2px solid rgba(255,255,255,0.8)",
        zIndex: 2,
        pointerEvents: "none",
      }} />

      {/* Subtle paw watermarks */}
      {[
        { top: "40px", left: "30px", size: "90px", opacity: 0.07, rotate: "-20deg" },
        { bottom: "40px", right: "30px", size: "90px", opacity: 0.07, rotate: "15deg" },
        { top: "50%", left: "50%", size: "200px", opacity: 0.05, rotate: "0deg", transform: "translate(-50%,-50%)" },
      ].map((p, i) => (
        <PawPrint key={i} style={{
          position: "absolute",
          top: p.top,
          bottom: p.bottom,
          left: p.left,
          right: p.right,
          width: p.size,
          height: p.size,
          color: "#2AADA8",
          opacity: p.opacity,
          zIndex: 1,
          transform: p.transform ?? `rotate(${p.rotate})`,
        }} />
      ))}

      {/* Main content */}
      <div style={{
        position: "relative",
        zIndex: 3,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "28px",
        padding: "40px",
      }}>
        {/* Logo — large and prominent */}
        <img
          src={HALT_LOGO_URL}
          alt="Helping All Little Things"
          crossOrigin="anonymous"
          style={{
            width: "260px",
            height: "260px",
            objectFit: "contain",
            filter: "drop-shadow(0 4px 16px rgba(42,173,168,0.3))",
          }}
        />

        {/* Org name */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: "34px",
            color: "#1a7a76",
            lineHeight: 1.15,
            textShadow: "0 1px 3px rgba(255,255,255,0.8)",
            letterSpacing: "0.5px",
          }}>
            Helping All Little Things
          </div>
          <div style={{
            fontFamily: "'Nunito', sans-serif",
            fontSize: "18px",
            color: "#2AADA8",
            fontWeight: 700,
            marginTop: "6px",
            letterSpacing: "0.5px",
          }}>
            helpingalllittlethings.org
          </div>
        </div>

        {/* Tagline pill */}
        <div style={{
          background: "rgba(255,255,255,0.75)",
          borderRadius: "40px",
          padding: "10px 28px",
          border: "2px solid rgba(42,173,168,0.4)",
          boxShadow: "0 2px 12px rgba(42,173,168,0.15)",
        }}>
          <div style={{
            fontFamily: "'Fredoka One', cursive",
            fontSize: "18px",
            color: "#2AADA8",
            letterSpacing: "0.5px",
            textAlign: "center",
          }}>
            🐾 Small Animals, Big Hearts 🐾
          </div>
        </div>

        {/* 501c3 note */}
        <div style={{
          fontSize: "14px",
          color: "#3a8a86",
          fontWeight: 700,
          textAlign: "center",
          letterSpacing: "0.3px",
        }}>
          501(c)(3) Nonprofit · New Hampshire
        </div>
      </div>
    </div>
  );
}

// ─── Card Front ──────────────────────────────────────────────────────────────
export default function AnimalCard({ data, cardRef, logoUrl, cardBgUrl }: AnimalCardProps) {
  const speciesStyle = getSpeciesStyle(data.species);
  const hp = data.hp ?? 75;
  const statusInfo = (data.adoptionStatus && data.adoptionStatus !== "none") ? ADOPTION_STATUS[data.adoptionStatus] : null;

  const CARD_W = 600;
  const CARD_H = 840;

  // Photo area shrinks slightly when status badge is shown
  const photoH = statusInfo ? 248 : 268;

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
        bottom: "90px",
        right: "24px",
        width: "100px",
        height: "100px",
        color: speciesStyle.bg,
        opacity: 0.07,
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
        padding: "22px 22px 14px",
        gap: "10px",
      }}>

        {/* === TOP HEADER: Name + HP + Type badge === */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: `linear-gradient(135deg, ${speciesStyle.bg}ee, ${speciesStyle.bg}cc)`,
          borderRadius: "14px",
          padding: "10px 16px",
          boxShadow: "0 3px 10px rgba(0,0,0,0.15)",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
              <div style={{
                fontFamily: "'Fredoka One', cursive",
                fontSize: "34px",
                color: speciesStyle.text,
                lineHeight: 1.05,
                textShadow: "0 1px 3px rgba(0,0,0,0.2)",
                letterSpacing: "0.5px",
              }}>
                {data.name || "Animal Name"}
              </div>
              {data.cardNumber && (
                <div style={{
                  fontSize: "15px",
                  color: speciesStyle.text,
                  opacity: 0.8,
                  fontWeight: 800,
                  fontFamily: "'Nunito', sans-serif",
                }}>
                  #{String(data.cardNumber).padStart(3, "0")}
                </div>
              )}
            </div>
            <div style={{
              fontSize: "16px",
              color: speciesStyle.text,
              opacity: 0.9,
              fontWeight: 800,
              letterSpacing: "0.5px",
              marginTop: "2px",
            }}>
              {speciesStyle.label}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{
              fontSize: "12px",
              color: speciesStyle.text,
              opacity: 0.85,
              fontWeight: 800,
              marginBottom: "4px",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}>Friendliness</div>
            <HeartHP value={hp} />
            <div style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: "22px",
              color: speciesStyle.text,
              marginTop: "3px",
            }}>{hp} HP</div>
          </div>
        </div>

        {/* === ADOPTION STATUS BADGE === */}
        {statusInfo && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            background: `${statusInfo.bg}ee`,
            borderRadius: "12px",
            padding: "7px 16px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}>
            <span style={{ fontSize: "18px" }}>{statusInfo.icon}</span>
            <span style={{
              fontFamily: "'Fredoka One', cursive",
              fontSize: "17px",
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
          height: `${photoH}px`,
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
              gap: "10px",
            }}>
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <span style={{ fontSize: "16px", fontWeight: 700 }}>Upload a photo</span>
            </div>
          )}
          <div style={{ position: "absolute", top: "8px", right: "10px", fontSize: "18px", opacity: 0.6 }}>✦</div>
          <div style={{ position: "absolute", bottom: "8px", left: "10px", fontSize: "14px", opacity: 0.4 }}>✦</div>
        </div>

        {/* === STATS ROW === */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "10px",
        }}>
          {[
            { label: "Sex",    value: data.sex || "—",    icon: data.sex === "Female" ? "♀" : data.sex === "Male" ? "♂" : "⚥" },
            { label: "Age",    value: data.age || "—",    icon: "🌱" },
            { label: "Weight", value: data.weight || "—", icon: "⚖️" },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: "rgba(255,255,255,0.8)",
              borderRadius: "12px",
              padding: "8px 10px",
              textAlign: "center",
              border: `2px solid ${speciesStyle.bg}55`,
              boxShadow: "0 2px 6px rgba(0,0,0,0.07)",
            }}>
              <div style={{ fontSize: "18px", lineHeight: 1 }}>{stat.icon}</div>
              <div style={{ fontSize: "11px", color: "#8a7a6a", fontWeight: 800, letterSpacing: "0.5px", textTransform: "uppercase", marginTop: "3px" }}>{stat.label}</div>
              <div style={{ fontSize: "16px", fontWeight: 900, color: "#3a2e22", marginTop: "2px", fontFamily: "'Baloo 2', cursive" }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* === PERSONALITY TAGS === */}
        {data.personality && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            flexWrap: "wrap",
          }}>
            {data.personality.split(",").slice(0, 4).map((trait, i) => (
              <span key={i} style={{
                background: `${speciesStyle.bg}22`,
                border: `2px solid ${speciesStyle.bg}66`,
                color: speciesStyle.bg,
                borderRadius: "20px",
                padding: "4px 14px",
                fontSize: "14px",
                fontWeight: 800,
                letterSpacing: "0.3px",
              }}>
                {trait.trim()}
              </span>
            ))}
          </div>
        )}

        {/* === FUN FACT CALLOUT === */}
        {data.funFact && (
          <div style={{
            background: `linear-gradient(135deg, ${speciesStyle.bg}18, ${speciesStyle.bg}10)`,
            borderRadius: "12px",
            padding: "8px 14px",
            border: `2px solid ${speciesStyle.bg}55`,
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
          }}>
            <span style={{ fontSize: "18px", flexShrink: 0, lineHeight: 1.4 }}>⭐</span>
            <p style={{
              fontSize: "15px",
              lineHeight: 1.45,
              color: "#3a2e22",
              margin: 0,
              fontWeight: 700,
              fontFamily: "'Baloo 2', cursive",
            }}>
              {data.funFact}
            </p>
          </div>
        )}

        {/* === BIO === */}
        <div style={{
          background: "rgba(255,255,255,0.72)",
          borderRadius: "12px",
          padding: "10px 14px",
          border: `1.5px solid ${speciesStyle.bg}33`,
          flex: 1,
          overflow: "hidden",
        }}>
          <p style={{
            fontSize: "15px",
            lineHeight: 1.55,
            color: "#4a3c2e",
            margin: 0,
            fontStyle: "italic",
            fontWeight: 600,
            display: "-webkit-box",
            WebkitLineClamp: 3,
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
          paddingTop: "6px",
          borderTop: `2px solid ${speciesStyle.bg}44`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img
              src={logoUrl}
              alt="Helping All Little Things"
              crossOrigin="anonymous"
              style={{ width: "44px", height: "44px", objectFit: "contain" }}
            />
            <div>
              <div style={{
                fontFamily: "'Fredoka One', cursive",
                fontSize: "14px",
                color: speciesStyle.bg,
                lineHeight: 1.2,
              }}>Helping All Little Things</div>
              <div style={{
                fontSize: "11px",
                color: "#8a7a6a",
                fontWeight: 700,
              }}>helpingalllittlethings.org</div>
            </div>
          </div>
          <div style={{
            fontSize: "11px",
            color: "#b0a898",
            fontWeight: 700,
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
