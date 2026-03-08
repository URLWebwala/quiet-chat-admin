import { baseURL } from "./config";

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
