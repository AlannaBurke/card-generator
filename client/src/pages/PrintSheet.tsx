/*
 * PrintSheet — Print 6 cards per page (2 columns × 3 rows)
 * Design: Cottagecore Pokédex — matches HALT brand
 * - Receives card data via sessionStorage (set by Home page)
 * - Uses @media print CSS to hide UI chrome and show only cards
 * - Cards are rendered at actual size (2.5" × 3.5")
 */

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import AnimalCard, { AnimalCardData } from "@/components/AnimalCard";
import { Button } from "@/components/ui/button";

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663404885239/KSAnxKy3iVwgftKj5yQJFJ/logo-square_17e2654f.png";
const CARD_BG_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663404885239/KSAnxKy3iVwgftKj5yQJFJ/card-bg-texture-NUuh8tVs2vLnJ3cEafbiB8.webp";

const CARDS_PER_SHEET = 6;

export default function PrintSheet() {
  const [, navigate] = useLocation();
  const [cardData, setCardData] = useState<AnimalCardData | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("halt-card-data");
    if (stored) {
      try {
        setCardData(JSON.parse(stored));
      } catch {
        navigate("/");
      }
    } else {
      navigate("/");
    }
  }, [navigate]);

  if (!cardData) return null;

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; background: white; }
          .print-sheet { padding: 0.25in !important; }
        }
        @page {
          size: letter;
          margin: 0.25in;
        }
      `}</style>

      {/* Screen UI chrome */}
      <div className="no-print" style={{
        background: "linear-gradient(135deg, #2AADA8, #1d8a86)",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img src={LOGO_URL} alt="HALT" style={{ width: "40px", height: "40px", objectFit: "contain" }} />
          <div>
            <h1 style={{ fontFamily: "'Fredoka One', cursive", fontSize: "20px", color: "#fff", margin: 0 }}>
              🖨️ Print Sheet
            </h1>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.85)", margin: 0 }}>
              {CARDS_PER_SHEET} copies of {cardData.name || "this card"} — ready to cut
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            style={{ borderColor: "rgba(255,255,255,0.5)", color: "#fff", borderRadius: "10px", fontFamily: "'Baloo 2', cursive", fontWeight: 700, background: "rgba(255,255,255,0.15)" }}
          >
            ← Back to Editor
          </Button>
          <Button
            onClick={() => window.print()}
            style={{ background: "#fff", color: "#2AADA8", borderRadius: "10px", fontFamily: "'Baloo 2', cursive", fontWeight: 700, border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
          >
            🖨️ Print Now
          </Button>
        </div>
      </div>

      {/* Instructions */}
      <div className="no-print" style={{
        background: "rgba(42,173,168,0.08)",
        borderBottom: "1.5px solid rgba(42,173,168,0.2)",
        padding: "10px 24px",
        fontSize: "13px",
        color: "#4a3c2e",
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 600,
      }}>
        💡 Tip: Use <strong>cardstock paper</strong> for best results. Set your printer to <strong>Actual Size</strong> (not "Fit to page"). Each card prints at standard 2.5" × 3.5" trading card size.
      </div>

      {/* The print sheet itself */}
      <div className="print-sheet" style={{
        maxWidth: "8.5in",
        margin: "0 auto",
        padding: "0.5in 0.25in",
        background: "white",
        minHeight: "11in",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 2.5in)",
          gridTemplateRows: "repeat(3, 3.5in)",
          gap: "0.25in",
          justifyContent: "center",
        }}>
          {Array.from({ length: CARDS_PER_SHEET }).map((_, i) => (
            <div key={i} style={{
              width: "2.5in",
              height: "3.5in",
              overflow: "hidden",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
            }}>
              {/* Scale the 600×840 card down to 2.5"×3.5" at 96dpi = 240×336px */}
              <div style={{
                transform: "scale(0.4)",
                transformOrigin: "top left",
                width: "600px",
                height: "840px",
              }}>
                <AnimalCard
                  data={cardData}
                  logoUrl={LOGO_URL}
                  cardBgUrl={CARD_BG_URL}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Cut guides hint */}
        <p className="no-print" style={{
          textAlign: "center",
          marginTop: "24px",
          fontSize: "12px",
          color: "#8a7a6a",
          fontStyle: "italic",
          fontFamily: "'Nunito', sans-serif",
        }}>
          Cut along the card edges after printing. Standard trading card sleeves fit perfectly!
        </p>
      </div>
    </>
  );
}
