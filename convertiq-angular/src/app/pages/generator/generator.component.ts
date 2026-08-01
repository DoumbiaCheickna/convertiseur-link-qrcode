import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TOOLS } from '../../data/tools';
import { detectType, QrContent } from '../../models/qr-content.model';
import { HistoryService } from '../../services/history.service';
import { PrefillService } from '../../services/prefill.service';
import { QrEngineService } from '../../services/qr-engine.service';
import { ToastService } from '../../services/toast.service';
import { QrOptionsComponent } from '../../shared/qr-options.component';
import { QrPreviewComponent } from '../../shared/qr-preview.component';

@Component({
  selector: 'app-generator',
  standalone: true,
  imports: [QrOptionsComponent, QrPreviewComponent],
  templateUrl: './generator.component.html',
})
export class GeneratorComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly engine = inject(QrEngineService);
  private readonly toast = inject(ToastService);
  private readonly history = inject(HistoryService);
  private readonly prefill = inject(PrefillService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly tool = this.route.snapshot.data['toolId'] as string;
  protected readonly config = TOOLS[this.tool];
  protected readonly values = signal<Record<string, unknown>>({});

  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    const defaults: Record<string, unknown> = {};
    for (const field of this.config.fields) defaults[field.key] = field.defaultValue ?? '';

    const pre = this.prefill.data();
    if (pre && pre.tool === this.tool) {
      defaults['input'] = pre.data;
      this.prefill.clear();
    }

    this.values.set(defaults);
    this.engine.setPreview(null);
    this.destroyRef.onDestroy(() => {
      if (this.timer) clearTimeout(this.timer);
    });
  }

  onValueChange(key: string, event: Event): void {
    const el = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const value = el instanceof HTMLSelectElement ? el.value : (el as HTMLInputElement).type === 'checkbox' ? (el as HTMLInputElement).checked : el.value;
    this.values.update(v => ({ ...v, [key]: value }));
    this.live();
  }

  setValue(key: string, value: unknown): void {
    this.values.update(v => ({ ...v, [key]: value }));
    this.live();
  }

  counterText(): string {
    const n = String(this.values()['input'] ?? '').length;
    return `${n} ${n > 1 ? 'caractères' : 'caractère'}`;
  }

  generate(): void {
    this.tryGenerate(false);
  }

  private live(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.tryGenerate(true), 350);
  }

  private tryGenerate(silent: boolean): void {
    try {
      const result = this.config.build(this.values());
      const content: QrContent = {
        data: result.data,
        type: detectType(result.data),
        label: result.label,
        snippet: result.snippet,
      };
      this.engine.setPreview(content);
      if (result.notice) this.toast.show(result.notice, 'info');
      if (!silent) this.history.add(content, this.tool);
    } catch (err) {
      if (!silent) this.toast.show((err as Error).message, 'error');
    }
  }
}
