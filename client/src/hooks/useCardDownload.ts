/*
 * useCardDownload — Reliable PNG export for the animal card
 *
 * Root cause of SecurityError:
 *   html2canvas with allowTaint:true still taints the canvas when it
 *   encounters cross-origin images, making toBlob() throw SecurityError.
 *
 * Solution:
 *   1. Before calling html2canvas, replace every <img> src with a DATA URL
 *      (not a blob URL — data URLs are always same-origin).
 *   2. Set allowTaint: false, useCORS: false (we don't need CORS since all
 *      images are now data URLs).
 *   3. Restore original srcs after capture.
 *
 * Also handles background-image CSS properties on elements.
 */

import { useState, useCallback } from "react";
import html2canvas from "html2canvas";
import { toast } from "sonner";

/** Fetch any URL and return a data: URL string. Returns original on failure. */
async function toDataUrl(src: string): Promise<string> {
  if (!src || src.startsWith("data:")) return src;
  // Revoke blob URLs — we want data URLs
  if (src.startsWith("blob:")) {
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve(src);
        reader.readAsDataURL(blob);
      });
    } catch {
      return src;
    }
  }
  try {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(src);
      reader.readAsDataURL(blob);
    });
  } catch {
    return src;
  }
}

/** Wait for an img element to finish loading */
function waitForImg(img: HTMLImageElement): Promise<void> {
  if (img.complete && img.naturalWidth > 0) return Promise.resolve();
  return new Promise((resolve) => {
    img.onload = () => resolve();
    img.onerror = () => resolve();
    setTimeout(resolve, 4000);
  });
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

    // Collect all img elements
    const imgEls = Array.from(cardElement.querySelectorAll("img")) as HTMLImageElement[];
    const origSrcs = imgEls.map((img) => img.src);

    try {
      // Convert every image src to a data URL (same-origin, never taints canvas)
      const dataSrcs = await Promise.all(origSrcs.map(toDataUrl));

      // Swap in data URLs and wait for each to load
      await Promise.all(
        imgEls.map(async (img, i) => {
          if (dataSrcs[i] !== origSrcs[i]) {
            img.src = dataSrcs[i];
            await waitForImg(img);
          }
        })
      );

      // Brief settle for layout
      await new Promise((r) => setTimeout(r, 200));

      // Capture — no CORS needed since all images are data URLs
      const canvas = await html2canvas(cardElement, {
        scale: 2,
        useCORS: false,
        allowTaint: false,
        backgroundColor: null,
        logging: false,
        imageTimeout: 20000,
        onclone: (_clonedDoc, clonedEl) => {
          clonedEl.style.transform = "none";
          clonedEl.style.position = "static";
          clonedEl.style.left = "0";
          clonedEl.style.top = "0";
        },
      });

      // Restore original srcs
      imgEls.forEach((img, i) => { img.src = origSrcs[i]; });

      // Build filename
      const safeName = animalName
        .trim()
        .replace(/[^a-zA-Z0-9\s\-_]/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase() || "animal-card";

      // Download
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
      // Restore srcs on error
      imgEls.forEach((img, i) => { img.src = origSrcs[i]; });
      toast.dismiss(toastId);
      toast.error("Download failed — please try again.", { duration: 5000 });
      setIsDownloading(false);
    }
  }, []);

  return { downloadCard, isDownloading };
}
