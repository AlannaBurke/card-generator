/*
 * useCardDownload — Reliable PNG export for the animal card
 *
 * The core problem with html2canvas + CDN images:
 *   html2canvas tries to re-fetch images with CORS headers. If the CDN
 *   doesn't send Access-Control-Allow-Origin, the image is tainted and
 *   canvas.toBlob() throws a SecurityError.
 *
 * Solution: Before calling html2canvas, replace every <img> src in the
 * target element with a blob: URL created from a fetch(). Blob URLs are
 * same-origin so html2canvas can read them freely. After capture, restore
 * the original srcs.
 *
 * Additional fix: The live preview card is inside a scale(0.5) wrapper.
 * We use a separate hidden full-size card (downloadCardRef in Home.tsx)
 * that is rendered at 600×840 off-screen at left:-9999px.
 */

import { useState, useCallback } from "react";
import html2canvas from "html2canvas";
import { toast } from "sonner";

// Fetch a URL and return a blob: URL, or return the original src on failure
async function toBlobUrl(src: string): Promise<string> {
  if (!src || src.startsWith("blob:") || src.startsWith("data:")) return src;
  try {
    const res = await fetch(src, { mode: "cors", cache: "force-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch {
    // Try without CORS mode as fallback
    try {
      const res = await fetch(src, { cache: "force-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    } catch {
      return src; // give up, use original
    }
  }
}

export function useCardDownload() {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadCard = useCallback(async (
    cardElement: HTMLElement,
    animalName: string,
  ) => {
    if (!animalName.trim()) {
      toast.error("Please enter the animal's name first! 🐾");
      return;
    }

    setIsDownloading(true);
    const toastId = toast.loading(`Generating ${animalName}'s card...`);
    const blobUrls: string[] = [];

    try {
      // 1. Collect all img elements in the card
      const imgEls = Array.from(cardElement.querySelectorAll("img")) as HTMLImageElement[];

      // 2. Replace each src with a blob URL (same-origin, CORS-safe)
      const origSrcs = imgEls.map((img) => img.src);
      await Promise.all(
        imgEls.map(async (img, i) => {
          const blobUrl = await toBlobUrl(origSrcs[i]);
          if (blobUrl !== origSrcs[i]) {
            blobUrls.push(blobUrl);
            img.src = blobUrl;
          }
          // Wait for image to load with new src
          if (!img.complete) {
            await new Promise<void>((resolve) => {
              img.onload = () => resolve();
              img.onerror = () => resolve();
              setTimeout(resolve, 3000);
            });
          }
        })
      );

      // Small settle delay
      await new Promise((r) => setTimeout(r, 150));

      // 3. Capture with html2canvas at 2× for retina quality
      const canvas = await html2canvas(cardElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,   // allow tainted canvas since we pre-fetched as blobs
        backgroundColor: null,
        logging: false,
        imageTimeout: 15000,
        width: 600,
        height: 840,
        windowWidth: 600,
        windowHeight: 840,
        onclone: (_clonedDoc, clonedEl) => {
          clonedEl.style.transform = "none";
          clonedEl.style.width = "600px";
          clonedEl.style.height = "840px";
          clonedEl.style.position = "static";
          clonedEl.style.left = "0";
          clonedEl.style.top = "0";
        },
      });

      // 4. Restore original srcs
      imgEls.forEach((img, i) => { img.src = origSrcs[i]; });
      blobUrls.forEach((u) => URL.revokeObjectURL(u));

      // 5. Download as PNG named after the animal
      const safeName = animalName
        .trim()
        .replace(/[^a-zA-Z0-9\s\-_]/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase() || "animal-card";

      canvas.toBlob((blob) => {
        if (!blob) {
          toast.dismiss(toastId);
          toast.error("Could not generate image. Please try again.");
          setIsDownloading(false);
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `${safeName}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);

        toast.dismiss(toastId);
        toast.success(`Downloaded as ${safeName}.png 💛`);
        setIsDownloading(false);
      }, "image/png", 1.0);

    } catch (err) {
      console.error("Card download failed:", err);
      toast.dismiss(toastId);
      toast.error("Download failed — please try again.", { duration: 5000 });
      setIsDownloading(false);
    }
  }, []);

  return { downloadCard, isDownloading };
}
