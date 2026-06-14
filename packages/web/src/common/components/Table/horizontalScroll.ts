export function getCenteredHorizontalScrollLeft(
  scrollWidth: number,
  clientWidth: number,
) {
  return Math.max(0, Math.floor((scrollWidth - clientWidth) / 2));
}
