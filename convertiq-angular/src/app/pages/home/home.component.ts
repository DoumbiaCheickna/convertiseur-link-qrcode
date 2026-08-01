import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TOOL_GROUPS } from '../../data/tools';
import { DEFAULT_QR_OPTIONS } from '../../models/qr-options.model';
import { HistoryService } from '../../services/history.service';
import { QrService } from '../../services/qr.service';
import { ToastService } from '../../services/toast.service';
import { copyText } from '../../utils/format';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  protected readonly groups = TOOL_GROUPS;
  protected readonly history = inject(HistoryService);
  private readonly qr = inject(QrService);
  private readonly toast = inject(ToastService);

  async copyLast(): Promise<void> {
    const entry = this.history.entries()[0];
    if (!entry) return this.toast.show('Aucun QR code dans l\'historique', 'error');
    const ok = await copyText(entry.data);
    this.toast.show(ok ? 'Contenu copié dans le presse-papier' : 'Impossible de copier', ok ? 'success' : 'error');
  }

  async redoLast(): Promise<void> {
    const entry = this.history.entries()[0];
    if (!entry) return this.toast.show('Aucun QR code dans l\'historique', 'error');
    const url = await this.qr.dataURL(entry.data, 1024, { ...DEFAULT_QR_OPTIONS, ec: 'M' });
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qr-code.png';
    a.click();
    this.toast.show('Dernier QR code téléchargé', 'success');
  }
}
