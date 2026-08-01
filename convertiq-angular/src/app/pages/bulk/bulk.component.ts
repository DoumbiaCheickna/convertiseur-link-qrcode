import { Component, inject, signal } from '@angular/core';
import JSZip from 'jszip';
import { TOOLS } from '../../data/tools';
import { detectType, QrContent } from '../../models/qr-content.model';
import { HistoryService } from '../../services/history.service';
import { QrEngineService } from '../../services/qr-engine.service';
import { QrService } from '../../services/qr.service';
import { ToastService } from '../../services/toast.service';
import { downloadBlob, downloadUrl, slug } from '../../utils/format';

interface BulkRow {
  id: number;
  input: string;
  label: string;
  data: string;
  ok: boolean;
  error?: string;
}

@Component({
  selector: 'app-bulk',
  standalone: true,
  templateUrl: './bulk.component.html',
})
export class BulkComponent {
  private readonly engine = inject(QrEngineService);
  private readonly qr = inject(QrService);
  private readonly toast = inject(ToastService);
  private readonly history = inject(HistoryService);

  protected readonly toolId = signal<'url' | 'text'>('url');
  protected readonly raw = signal('');
  protected readonly rows = signal<BulkRow[]>([]);
  protected readonly busy = signal(false);

  private nextId = 1;

  get tool(): 'url' | 'text' {
    return this.toolId();
  }

  get config() {
    return TOOLS[this.toolId()];
  }

  get validRows() {
    return this.rows().filter(r => r.ok);
  }

  setTool(t: 'url' | 'text'): void {
    this.toolId.set(t);
    this.process();
  }

  onRawChange(event: Event): void {
    this.raw.set((event.target as HTMLTextAreaElement).value);
    this.process();
  }

  clearAll(): void {
    this.raw.set('');
    this.rows.set([]);
  }

  process(): void {
    const lines = this.raw()
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    const tool = this.toolId();
    const built = lines.map(line => {
      const data =
        tool === 'url'
          ? /^https?:\/\//i.test(line)
            ? line
            : 'https://' + line
          : line;
      try {
        const out = TOOLS[tool].build({ input: data });
        return { id: this.nextId++, input: line, label: out.label, data: out.data, ok: true } satisfies BulkRow;
      } catch (e) {
        return { id: this.nextId++, input: line, label: '', data: '', ok: false, error: (e as Error).message } satisfies BulkRow;
      }
    });
    this.rows.set(built);
  }

  addToHistory(): void {
    for (const row of this.validRows) {
      const content: QrContent = { data: row.data, type: detectType(row.data), label: row.label, snippet: row.data };
      this.history.add(content, 'url');
    }
    this.toast.show('Ajoutés à l\'historique', 'success');
  }

  async downloadZip(): Promise<void> {
    const rows = this.validRows;
    if (!rows.length) return this.toast.show('Aucune ligne valide à exporter', 'error');
    this.busy.set(true);
    try {
      const zip = new JSZip();
      const opts = this.engine.options();
      for (const row of rows) {
        const url = await this.qr.dataURL(row.data, 1024, opts, 2);
        zip.file(`${slug(row.label)}.png`, url.split(',')[1], { base64: true });
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(blob, 'qrcodes-export.zip');
      this.toast.show(`ZIP généré (${rows.length} QR codes)`, 'success');
    } catch {
      this.toast.show('Erreur lors de la génération du ZIP', 'error');
    } finally {
      this.busy.set(false);
    }
  }

  async downloadOne(row: BulkRow): Promise<void> {
    const url = await this.qr.dataURL(row.data, 1024, this.engine.options(), 2);
    downloadUrl(url, `${slug(row.label)}.png`);
    this.toast.show('QR code téléchargé', 'success');
  }
}
