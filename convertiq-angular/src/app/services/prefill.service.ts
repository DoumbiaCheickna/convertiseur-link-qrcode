import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PrefillService {
  readonly data = signal<{ tool: string; data: string } | null>(null);

  set(tool: string, data: string): void {
    this.data.set({ tool, data });
  }

  clear(): void {
    this.data.set(null);
  }
}
