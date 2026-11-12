const kstOffsetMs = 9 * 60 * 60 * 1000;

export function parseKstDate(date: string): Date {
  return new Date(`${date}T00:00:00+09:00`);
}

export function formatKstDate(date: Date): string {
  return new Date(date.getTime() + kstOffsetMs).toISOString().slice(0, 10);
}
