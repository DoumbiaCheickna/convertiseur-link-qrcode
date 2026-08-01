import { Component, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { detectType, QrContent, TYPE_ICON, TYPE_LABEL } from '../../models/qr-content.model';
import { HistoryService } from '../../services/history.service';
import { PrefillService } from '../../services/prefill.service';
import { QrService } from '../../services/qr.service';
import { ToastService } from '../../services/toast.service';
import { copyText } from '../../utils/format';

@Component({
  selector: 'app-scanner',
  standalone: true,
  templateUrl: './scanner.component.html',
})
export class ScannerComponent {
  private readonly qr = inject(QrService);
  private readonly toast = inject(ToastService);
  private readonly history = inject(HistoryService);
  private readonly router = inject(Router);
  private readonly prefill = inject(PrefillService);

  protected readonly tab = signal<'camera' | 'image'>('camera');
  protected readonly scanning = signal(false);
  protected readonly busy = signal(false);
  protected readonly result = signal<QrContent | null>(null);

  protected readonly video = viewChild<ElementRef<HTMLVideoElement>>('video');

  private stream: MediaStream | null = null;
  private raf = 0;
  private buffer: HTMLCanvasElement | null = null;

  get typeIcon(): string {
    const r = this.result();
    return r ? TYPE_ICON[detectType(r.data)] : 'fa-tag';
  }

  get typeLabel(): string {
    const r = this.result();
    return r ? TYPE_LABEL[detectType(r.data)] : 'Données';
  }

  get canOpen(): boolean {
    const r = this.result();
    return r ? detectType(r.data) === 'url' : false;
  }

  get canReuse(): boolean {
    const r = this.result();
    return r ? ['url', 'text'].includes(detectType(r.data)) : false;
  }

  setTab(t: 'camera' | 'image'): void {
    this.tab.set(t);
    if (t !== 'camera') this.stopCamera();
  }

  async startCamera(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
      const v = this.video()?.nativeElement;
      if (!v) throw new Error('no video');
      v.srcObject = this.stream;
      this.scanning.set(true);
      await v.play();
      this.loop();
      this.toast.show('Caméra active — scannez votre QR code', 'info');
    } catch {
      this.toast.show('Caméra indisponible. Utilisez le mode Image.', 'error');
    }
  }

  stopCamera(): void {
    this.scanning.set(false);
    cancelAnimationFrame(this.raf);
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    const v = this.video();
    if (v) v.nativeElement.srcObject = null;
  }

  private loop(): void {
    if (!this.scanning()) return;
    const v = this.video()?.nativeElement;
    if (v && v.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA) {
      const canvas = this.buffer ?? (this.buffer = document.createElement('canvas'));
      canvas.width = v.videoWidth;
      canvas.height = v.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(v, 0, 0);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = this.qr.decode(img.data, img.width, img.height);
        if (data) {
          this.onDecoded(data);
          return;
        }
      }
    }
    this.raf = requestAnimationFrame(() => this.loop());
  }

  decodeFile(file: File): void {
    this.busy.set(true);
    const img = new Image();
    img.onload = () => {
      const max = 1440;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        this.busy.set(false);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = this.qr.decode(imgData.data, imgData.width, imgData.height);
      this.busy.set(false);
      if (data) {
        this.onDecoded(data);
        this.toast.show('QR code détecté', 'success');
      } else {
        this.toast.show('Aucun QR code détecté dans cette image', 'error');
      }
    };
    img.onerror = () => {
      this.busy.set(false);
      this.toast.show('Impossible de lire cette image', 'error');
    };
    img.src = URL.createObjectURL(file);
  }

  onFileChange(event: Event): void {
    const el = event.target as HTMLInputElement;
    const file = el.files?.[0];
    if (file) this.decodeFile(file);
    el.value = '';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    (event.currentTarget as HTMLElement).classList.add('drag');
  }

  onDragLeave(event: DragEvent): void {
    (event.currentTarget as HTMLElement).classList.remove('drag');
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    (event.currentTarget as HTMLElement).classList.remove('drag');
    const file = event.dataTransfer?.files[0];
    if (file) this.decodeFile(file);
  }

  @HostListener('document:paste', ['$event'])
  onPaste(e: ClipboardEvent): void {
    const items = e.clipboardData?.items ?? [];
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          this.setTab('image');
          this.decodeFile(file);
          return;
        }
      }
    }
  }

  private onDecoded(data: string): void {
    this.stopCamera();
    const type = detectType(data);
    this.result.set({ data, type, label: TYPE_LABEL[type], snippet: data.slice(0, 120) });
  }

  async copyResult(): Promise<void> {
    const r = this.result();
    if (!r) return;
    const ok = await copyText(r.data);
    this.toast.show(ok ? 'Contenu copié dans le presse-papier' : 'Impossible de copier', ok ? 'success' : 'error');
  }

  openResult(): void {
    const r = this.result();
    if (r && detectType(r.data) === 'url') window.open(r.data, '_blank', 'noopener,noreferrer');
  }

  useResult(): void {
    const r = this.result();
    if (!r) return;
    const target = detectType(r.data) === 'url' ? 'url' : 'text';
    this.prefill.set(target, r.data);
    void this.router.navigate(['/' + target]);
  }

  saveResult(): void {
    const r = this.result();
    if (!r) return;
    this.history.add(r, 'scanner');
    this.toast.show("Ajouté à l'historique", 'success');
  }
}
