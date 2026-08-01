export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export interface QrOptions {
  size: number;
  dark: string;
  light: string;
  ec: ErrorCorrectionLevel;
}

export const DEFAULT_QR_OPTIONS: QrOptions = {
  size: 512,
  dark: '#0f172a',
  light: '#ffffff',
  ec: 'H',
};

export const QR_PRESETS = ['#0f172a', '#6366f1', '#7c3aed', '#dc2626', '#16a34a', '#ea580c', '#0d9488', '#e11d48'];

export const EXPORT_SIZES = [256, 512, 1024, 2048];

export const EC_LEVELS: { value: ErrorCorrectionLevel; label: string }[] = [
  { value: 'L', label: 'L — 7%' },
  { value: 'M', label: 'M — 15%' },
  { value: 'Q', label: 'Q — 25%' },
  { value: 'H', label: 'H — 30%' },
];
