import { Injectable, signal } from '@angular/core';
import { QrContent } from '../models/qr-content.model';
import { DEFAULT_QR_OPTIONS, QrOptions } from '../models/qr-options.model';
import { QrService } from './qr.service';

@Injectable({ providedIn: 'root' })
export class QrEngineService {
  readonly preview = signal<QrContent | null>(null);
  readonly options = signal<QrOptions>(DEFAULT_QR_OPTIONS);

  constructor(private readonly qr: QrService) {}

  setPreview(p: QrContent | null): void {
    this.preview.set(p);
  }

  updateOptions(partial: Partial<QrOptions>): void {
    this.options.update(o => ({ ...o, ...partial }));
  }

  renderInto(canvas: HTMLCanvasElement, width: number): Promise<void> {
    const p = this.preview();
    if (!p) return Promise.resolve();
    return this.qr.render(canvas, p.data, width, this.options());
  }
}
