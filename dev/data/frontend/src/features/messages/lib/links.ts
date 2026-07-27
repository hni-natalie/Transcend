const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

export function extractUrlsFromText(text?: string): string[] {
  if (!text) {
    return [];
  }

  return text.match(URL_PATTERN) ?? [];
}

export function getDisplayNameFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export type TextPart = { type: 'text' | 'url'; value: string };

export function splitTextWithLinks(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(URL_PATTERN)) {
    const index = match.index ?? 0;

    if (index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, index) });
    }

    parts.push({ type: 'url', value: match[0] });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts;
}