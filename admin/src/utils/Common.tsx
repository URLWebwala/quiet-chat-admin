import { Success } from "@/api/toastServices";
import { baseURL } from "./config";

export const routerChange = (path: string, type: string, router: any) => {
    const handleRouteChange = (url: string) => {
        if (!url.includes(path)) {
            localStorage.removeItem(type);
        }
    };

    router.events.on("routeChangeStart", handleRouteChange);
    return () => {
        router.events.off("routeChangeStart", handleRouteChange);
    };
}


  export  function getCountryCodeFromEmoji(emoji : any) {
  if (!emoji || emoji.length < 2) return null;
  const codePoints = [...emoji].map(char => char.codePointAt(0) - 127397);
  return String.fromCharCode(...codePoints).toLowerCase(); // e.g. "in"
}

export const getImageUrl = (
  path?: string,
  fallback: string = "/images/male.png"
) => {
  if (!path) return;

  // Normalize slashes
  const normalized = path.replace(/\\/g, "/");

  // Already full URL
  if (normalized.startsWith("http")) return normalized;

  // Ensure leading slash
  const finalPath = normalized.startsWith("/")
    ? normalized
    : `${normalized}`;

  return `${baseURL}${finalPath}`;
};

export function formatCoins(value?: number | null): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '0';
  }

  // Integer → return without decimals
  if (Number.isInteger(value)) {
    return String(value);
  }

  const truncated = Math.trunc(value * 100) / 100;

  return truncated
    .toFixed(2)
    .replace(/\.?0+$/, '');
}

export const copyId = (id: string) => {
  if (id && id !== "-") {
    navigator.clipboard.writeText(id).then(() => {
      Success("Unique ID copied");
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  }
};
