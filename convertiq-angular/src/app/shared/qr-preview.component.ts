import { Component, effect, ElementRef, inject, viewChild } from '@angular/core';
import { detectType, QrContent, TYPE_ICON, TYPE_LABEL } from '../models/qr-content.model';
import { QrEngineService } from '../services/qr-engine.service';
import { QrService } from '../services/qr.service';
import { ToastService } from '../services/toast.service';
import { copyText, downloadBlob, downloadUrl, slug } from '../utils/format';

@Component({
  selector: 'app-qr-preview',
  standalone: true,
  templateUrl: './qr-preview.component.html',
})
export class QrPreviewComponent {
  protected readonly engine = inject(QrEngineService);
  private readonly qr = inject(QrService);
  private readonly toast = inject(ToastService);
  protected readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');

  constructor() {
    effect(() => {
      const p = this.engine.preview();
      this.engine.options();
      const el = this.canvas()?.nativeElement;
      if (p && el) {
        void this.engine.renderInto(el, 480).catch(() => {});
      }
    });
  }

  get preview(): QrContent | null {
    return this.engine.preview();
  }

  get typeLabel(): string {
    const p = this.preview;
    return p ? TYPE_LABEL[detectType(p.data)] : '';
  }

  get typeIcon(): string {
    const p = this.preview;
    return p ? TYPE_ICON[detectType(p.data)] : 'fa-qrcode';
  }

  async downloadPng(): Promise<void> {
    const p = this.preview;
    if (!p) return this.toast.show("Générez d'abord un QR code", 'error');
    const url = await this.qr.dataURL(p.data, this.engine.options().size, this.engine.options(), 2);
    downloadUrl(url, `${slug(p.label)}-qr.png`);
    this.toast.show('Image PNG téléchargée', 'success');
  }

  async downloadSvg(): Promise<void> {
    const p = this.preview;
    if (!p) return this.toast.show("Générez d'abord un QR code", 'error');
    const svg = await this.qr.svg(p.data, this.engine.options().size, this.engine.options(), 2);
    downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), `${slug(p.label)}-qr.svg`);
    this.toast.show('Image SVG téléchargée', 'success');
  }

  async copy(): Promise<void> {
    const p = this.preview;
    if (!p) return this.toast.show("Générez d'abord un QR code", 'error');
    const c = document.createElement('canvas');
    try {
      await this.qr.render(c, p.data, 512, this.engine.options(), 1);
      const blob = await new Promise<Blob | null>(res => c.toBlob(res));
      if (blob && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        this.toast.show('QR code copié en image', 'success');
        return;
      }
    } catch {
      // fallthrough to text copy
    }
    const ok = await copyText(p.data);
    this.toast.show(ok ? 'Contenu copié dans le presse-papier' : 'Impossible de copier', ok ? 'success' : 'error');
  }

  async share(): Promise<void> {
    const p = this.preview;
    if (!p) return this.toast.show("Générez d'abord un QR code", 'error');
    try {
      if (navigator.share) {
        const c = document.createElement('canvas');
        await this.qr.render(c, p.data, 1024, this.engine.options(), 1);
        const blob = await new Promise<Blob | null>(res => c.toBlob(res));
        if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], 'qrcode.png', { type: 'image/png' })] })) {
          await navigator.share({
            files: [new File([blob], 'qrcode.png', { type: 'image/png' })],
            title: p.label,
            text: p.snippet,
          });
        } else {
          await navigator.share({ title: p.label, text: p.snippet });
        }
      } else {
        const ok = await copyText(p.data);
        this.toast.show(ok ? 'Partage non supporté — contenu copié' : 'Partage indisponible', ok ? 'success' : 'error');
      }
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') this.toast.show('Partage indisponible', 'error');
    }
  }
}
