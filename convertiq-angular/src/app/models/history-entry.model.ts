import { QrContent } from './qr-content.model';

export interface HistoryEntry extends QrContent {
  id: string;
  tool: string;
  date: number;
}
