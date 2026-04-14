import { Image } from 'react-native';

const prefetchedImageUrls = new Set<string>();
const inflightImageUrls = new Set<string>();

function normalizeImageUrl(url?: string) {
  const normalized = url?.trim();
  if (!normalized || !/^https?:\/\//i.test(normalized)) {
    return undefined;
  }
  return normalized;
}

export function prefetchImageUrls(urls: Array<string | undefined>, maxCount = 12) {
  const candidates = Array.from(
    new Set(
      urls
        .map(normalizeImageUrl)
        .filter((url): url is string => !!url)
    )
  )
    .filter((url) => !prefetchedImageUrls.has(url) && !inflightImageUrls.has(url))
    .slice(0, maxCount);

  candidates.forEach((url) => {
    inflightImageUrls.add(url);
    Image.prefetch(url)
      .then((prefetched) => {
        if (prefetched) {
          prefetchedImageUrls.add(url);
        }
      })
      .catch(() => {
        // Best-effort warm cache; rendering can still load the image normally.
      })
      .finally(() => {
        inflightImageUrls.delete(url);
      });
  });
}
