export default async function messages(
  locale: string,
): Promise<Record<string, string>> {
  try {
    const message = (await import(`./locales/${locale}.json`)).default;
    return message;
  } catch (error) {
    throw new Error(`Could not load messages for locale "${locale}": ${error}`);
  }
}
