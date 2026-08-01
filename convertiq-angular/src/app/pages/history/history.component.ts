import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { detectType, TYPE_ICON, TYPE_LABEL } from '../../models/qr-content.model';
import { HistoryEntry } from '../../models/history-entry.model';
import { DEFAULT_QR_OPTIONS } from '../../models/qr-options.model';
import { HistoryService } from '../../services/history.service';
import { PrefillService } from '../../services/prefill.service';
import { QrService } from '../../services/qr.service';
import { ToastService } from '../../services/toast.service';
import { copyText, downloadUrl, slug } from '../../utils/format';

@Component({
  selector: 'app-history',
  standalone: true,
  templateUrl: './history.component.html',
})
export class HistoryComponent {
  protected readonly history = inject(HistoryService);
  private readonly qr = inject(QrService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly prefill = inject(PrefillService);

  protected readonly query = signal('');

  get filtered() {
    const q = this.query().trim().toLowerCase();
    const all = this.history.entries();
    if (!q) return all;
    return all.filter(e => e.data.toLowerCase().includes(q) || (e.label ?? '').toLowerCase().includes(q));
  }

  setQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  typeIcon(t: ReturnType<typeof detectType>): string {
    return TYPE_ICON[t];
  }

  typeLabel(t: ReturnType<typeof detectType>): string {
    return TYPE_LABEL[t];
  }

  formatDate(ts: number): string {
    return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  async copyEntry(e: HistoryEntry): Promise<void> {
    const ok = await copyText(e.data);
    this.toast.show(ok ? 'Contenu copié dans le presse-papier' : 'Impossible de copier', ok ? 'success' : 'error');
  }

  async downloadEntry(e: HistoryEntry): Promise<void> {
    const url = await this.qr.dataURL(e.data, 1024, { ...DEFAULT_QR_OPTIONS, ec: 'M' });
    downloadUrl(url, `${slug(e.label)}.png`);
    this.toast.show('QR code téléchargé', 'success');
  }

  reuseEntry(e: HistoryEntry): void {
    const target = detectType(e.data) === 'url' ? 'url' : 'text';
    this.prefill.set(target, e.data);
    void this.router.navigate(['/' + target]);
  }

  removeEntry(id: string): void {
    this.history.remove(id);
  }
}
