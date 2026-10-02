/**
 * WhatsApp helpers. Pure functions — safe in both server and client components.
 * The number itself comes from store_settings.contact.whatsapp (owner-editable).
 */

/** "+234 707 137 4515" -> "2347071374515" (wa.me requires digits only, no leading +/0). */
export function normalizeWhatsAppNumber(input: string): string {
  const digits = (input || '').replace(/[^0-9]/g, '');
  if (digits.startsWith('0') && digits.length === 11) return `234${digits.slice(1)}`; // local NG format
  return digits;
}

export function whatsappUrl(number: string, text?: string): string {
  const base = `https://wa.me/${normalizeWhatsAppNumber(number)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** "+2347071374515" -> "+234 707 137 4515" for display. */
export function formatPhoneDisplay(input: string): string {
  const digits = normalizeWhatsAppNumber(input);
  if (digits.startsWith('234') && digits.length === 13) {
    return `+234 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  return input;
}
