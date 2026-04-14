import { useRef, useCallback, useState } from "react";
import { toPng } from "html-to-image";
import { useToast } from "../../context/ToastContext";

/**
 * Convert all <img> inside the container to inline data-URIs so
 * html-to-image can render cross-origin images (e.g. profile pics
 * served from R2/CDN).
 */
async function inlineImages(root: HTMLElement): Promise<void> {
  const imgs = root.querySelectorAll<HTMLImageElement>("img");
  await Promise.all(
    Array.from(imgs).map(async (img) => {
      if (!img.src || img.src.startsWith("data:")) return;
      try {
        const resp = await fetch(img.src, { mode: "cors" });
        const blob = await resp.blob();
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        img.src = dataUrl;
      } catch {
        // If fetch fails, leave original src ΓÇö html-to-image will use
        // the fallback (blank or broken) which is acceptable.
      }
    })
  );
}

export function useShareToClipboard() {
  const ref = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const toast = useToast();

  const share = useCallback(async () => {
    if (!ref.current) return;
    setSharing(true);
    try {
      // Pre-convert cross-origin images to data URIs
      await inlineImages(ref.current);

      const dataUrl = await toPng(ref.current, {
        pixelRatio: 2,
        cacheBust: true,
        quality: 1,
      });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      toast.success("Image copied to clipboard!");
    } catch (err) {
      console.error("Share failed", err);
      toast.error("Failed to copy image. Please try again.");
    } finally {
      setSharing(false);
    }
  }, [toast]);

  return { ref, share, sharing };
}
