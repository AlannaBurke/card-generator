/*
 * useCardDownload — Reliable PNG export for the animal card
 *
 * Strategy: Use html2canvas on a HIDDEN clone of the card rendered at
 * full 600×840 size (not scaled). The card preview uses CSS transform:scale()
 * for display, but the download clone is rendered at actual pixel size.
 *
 * Key fixes vs previous version:
 * - Renders at actual 600×840 (not scaled-down preview)
 * - All images pre-loaded with crossOrigin="anonymous" before capture
 * - Clone is appended off-screen (left: -9999px) so layout is correct
 * - Filename is always the animal's name
 * - Falls back gracefully with a clear error message
 */

import { useState, useCallback } from "react";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import type { AnimalCardData } from "@/components/AnimalCard";

// Pre-load an image and return it (with CORS)
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Try without crossOrigin as fallback
      const img2 = new Image();
      img2.onload = () => resolve(img2);
      img2.onerror = reject;
      img2.src = src;
    };
    img.src = src;
  });
}

export function useCardDownload() {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadCard = useCallback(async (
    cardElement: HTMLElement,
    animalName: string,
    _data?: AnimalCardData
  ) => {
    if (!animalName.trim()) {
      toast.error("Please enter the animal's name first! 🐾");
      return;
    }

    setIsDownloading(true);
    const toastId = toast.loading(`Generating ${animalName}'s card...`);

    try {
      // 1. Pre-load all images in the card with CORS headers
      const imgEls = Array.from(cardElement.querySelectorAll("img"));
      await Promise.allSettled(
        imgEls.map((img) => {
          if (img.complete && img.naturalWidth > 0) return Promise.resolve();
          return loadImage(img.src).then((loaded) => {
            img.src = loaded.src;
          });
        })
      );

      // 2. Create a full-size clone rendered off-screen at 600×840
      //    The live preview uses CSS scale(0.5), so we need the real-size version
      const clone = cardElement.cloneNode(true) as HTMLElement;
      clone.style.transform = "none";
      clone.style.position = "fixed";
      clone.style.left = "-9999px";
      clone.style.top = "0";
      clone.style.width = "600px";
      clone.style.height = "840px";
      clone.style.zIndex = "-1";
      clone.style.pointerEvents = "none";
      document.body.appendChild(clone);

      // Small delay to allow images in clone to settle
      await new Promise((r) => setTimeout(r, 200));

      // 3. Capture with html2canvas at 2× for retina quality
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        logging: false,
        imageTimeout: 20000,
        width: 600,
        height: 840,
        windowWidth: 600,
        windowHeight: 840,
        onclone: (clonedDoc, clonedEl) => {
          // Ensure the cloned element is at correct size
          clonedEl.style.transform = "none";
          clonedEl.style.width = "600px";
          clonedEl.style.height = "840px";

          // Inject Google Fonts into the cloned document
          const link = clonedDoc.createElement("link");
          link.rel = "stylesheet";
          link.href = "https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&family=Baloo+2:wght@600;700;800&display=swap";
          clonedDoc.head.appendChild(link);
        },
      });

      document.body.removeChild(clone);

      // 4. Download as PNG named after the animal
      const safeName = animalName
        .trim()
        .replace(/[^a-zA-Z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase();
      const fileName = `${safeName}.png`;

      canvas.toBlob((blob) => {
        if (!blob) {
          toast.dismiss(toastId);
          toast.error("Could not generate image. Please try again.");
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = fileName;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.dismiss(toastId);
        toast.success(`Downloaded as ${fileName} 💛`);
      }, "image/png", 1.0);

    } catch (err) {
      console.error("Card download failed:", err);
      document.querySelectorAll("[data-download-clone]").forEach((el) => el.remove());
      toast.dismiss(toastId);
      toast.error("Download failed — please try again or use your browser's screenshot tool.", {
        duration: 6000,
      });
    } finally {
      setIsDownloading(false);
    }
  }, []);

  return { downloadCard, isDownloading };
}
