export function formatClockTime(date: Date | string = new Date()): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  return d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function truncate(text: string, maxLength = 60): string {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(1)} ${units[unitIndex]}`;
}