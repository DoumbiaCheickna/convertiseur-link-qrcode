import { Injectable } from '@angular/core';
import * as QRCode from 'qrcode';
import jsQR from 'jsqr';
import { QrOptions } from '../models/qr-options.model';

@Injectable({ providedIn: 'root' })
export class QrService {
  private toOpts(width: number, opts: QrOptions, margin: number): QRCode.QRCodeRenderersOptions {
    return {
      width,
      margin,
      errorCorrectionLevel: opts.ec,
      color: { dark: opts.dark, light: opts.light },
    };
  }

  render(canvas: HTMLCanvasElement, text: string, width: number, opts: QrOptions, margin = 1): Promise<void> {
    return QRCode.toCanvas(canvas, text, this.toOpts(width, opts, margin));
  }

  dataURL(text: string, width: number, opts: QrOptions, margin = 1): Promise<string> {
    return QRCode.toDataURL(text, this.toOpts(width, opts, margin));
  }

  svg(text: string, width: number, opts: QrOptions, margin = 1): Promise<string> {
    return QRCode.toString(text, { ...this.toOpts(width, opts, margin), type: 'svg' });
  }

  decode(data: Uint8ClampedArray, width: number, height: number): string | null {
    try {
      const code = jsQR(data, width, height, { inversionAttempts: 'attemptBoth' });
      return code ? code.data : null;
    } catch {
      return null;
    }
  }
}
