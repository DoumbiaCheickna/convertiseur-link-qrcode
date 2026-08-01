import { Component, inject } from '@angular/core';
import { EC_LEVELS, ErrorCorrectionLevel, EXPORT_SIZES, QR_PRESETS } from '../models/qr-options.model';
import { QrEngineService } from '../services/qr-engine.service';

@Component({
  selector: 'app-qr-options',
  standalone: true,
  templateUrl: './qr-options.component.html',
})
export class QrOptionsComponent {
  protected readonly engine = inject(QrEngineService);
  protected readonly sizes = EXPORT_SIZES;
  protected readonly ecLevels = EC_LEVELS;
  protected readonly presets = QR_PRESETS;

  setSize(value: string): void {
    this.engine.updateOptions({ size: Number(value) });
  }

  setEc(value: string): void {
    this.engine.updateOptions({ ec: value as ErrorCorrectionLevel });
  }

  setDark(value: string): void {
    this.engine.updateOptions({ dark: value });
  }

  setLight(value: string): void {
    this.engine.updateOptions({ light: value });
  }
}
