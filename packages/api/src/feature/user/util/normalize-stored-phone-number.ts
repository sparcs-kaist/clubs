export function normalizeStoredPhoneNumber(
  phoneNumber: string | null | undefined,
): string | null {
  const trimmed = phoneNumber?.trim();
  if (!trimmed) return null;

  return trimmed.replace(/^(010)(\d{4})(\d{4})$/, "$1-$2-$3");
}
