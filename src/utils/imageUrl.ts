const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL as string;

/**
 * Constructs a full image URL from a url_suffix (R2 object key).
 * Usage: getImageUrl(image.url_suffix) → "https://.../gallery/USR001/123.jpg"
 */
export function getImageUrl(urlSuffix: string): string {
    if (!urlSuffix) return "";
    return `${R2_PUBLIC_URL}/${urlSuffix}`;
}
