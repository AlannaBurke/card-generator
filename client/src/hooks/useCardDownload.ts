/*
 * useCardDownload — Hook for exporting the animal card as a high-res PNG
 * Uses html2canvas with CORS support for CDN-hosted images
 * Downloads at 2x scale for crisp results
 */

import { useState, useCallback } from "react";
import html2canvas from "html2canvas";
import { toast } from "sonner";

export function useCardDownload() {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadCard = useCallback(async (
    cardElement: HTMLElement,
    animalName: string
  ) => {
    if (!animalName.trim()) {
      toast.error("Please enter the animal's name first! 🐾");
      return;
    }

    setIsDownloading(true);

    try {
      // Ensure all images in the card are loaded before capturing
      const images = cardElement.querySelectorAll("img");
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise<void>((resolve) => {
              if (img.complete) {
                resolve();
              } else {
                img.onload = () => resolve();
                img.onerror = () => resolve(); // Don't block on error
              }
            })
        )
      );

      const canvas = await html2canvas(cardElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          // Ensure fonts are loaded in the clone
          const style = clonedDoc.createElement("style");
          style.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;500;600;700;800&display=swap');
          `;
          clonedDoc.head.appendChild(style);
        },
      });

      const safeName = animalName.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-").toLowerCase();
      const fileName = `${safeName}-halt-card.png`;

      const link = document.createElement("a");
      link.download = fileName;
      link.href = canvas.toDataURL("image/png", 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`${animalName}'s card downloaded! 💛`, {
        description: `Saved as ${fileName}`,
      });
    } catch (err) {
      console.error("Card download failed:", err);
      toast.error("Download failed — try right-clicking the card preview to save it.", {
        duration: 5000,
      });
    } finally {
      setIsDownloading(false);
    }
  }, []);

  return { downloadCard, isDownloading };
}
