export type QrType = 'url' | 'text' | 'wifi' | 'email' | 'phone' | 'sms' | 'vcard' | 'geo' | 'event' | 'other';

export interface QrContent {
  data: string;
  type: QrType;
  label: string;
  snippet: string;
}

export const TYPE_ICON: Record<QrType, string> = {
  url: 'fa-link',
  text: 'fa-font',
  wifi: 'fa-wifi',
  email: 'fa-envelope',
  phone: 'fa-phone',
  sms: 'fa-comment-dots',
  vcard: 'fa-id-card',
  geo: 'fa-location-dot',
  event: 'fa-calendar',
  other: 'fa-tag',
};

export const TYPE_LABEL: Record<QrType, string> = {
  url: 'Lien web',
  text: 'Texte',
  wifi: 'Réseau Wi-Fi',
  email: 'Email',
  phone: 'Téléphone',
  sms: 'SMS',
  vcard: 'Carte de visite',
  geo: 'Localisation',
  event: 'Événement',
  other: 'Données',
};

export function detectType(data: string): QrType {
  if (/^https?:\/\//i.test(data)) return 'url';
  if (/^WIFI:/i.test(data)) return 'wifi';
  if (/^mailto:/i.test(data)) return 'email';
  if (/^tel:/i.test(data)) return 'phone';
  if (/^sms(to)?:/i.test(data)) return 'sms';
  if (/^geo:/i.test(data)) return 'geo';
  if (/^MECARD:/i.test(data) || /^BEGIN:VCARD/i.test(data)) return 'vcard';
  if (/^BEGIN:VEVENT/i.test(data)) return 'event';
  return 'text';
}
