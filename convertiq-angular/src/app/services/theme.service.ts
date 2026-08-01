import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<ThemeMode>(this.load());

  constructor() {
    this.apply(this.theme());
  }

  toggle(): void {
    this.theme.update(t => {
      const next = t === 'dark' ? 'light' : 'dark';
      this.apply(next);
      return next;
    });
  }

  private load(): ThemeMode {
    try {
      const saved = localStorage.getItem('ci-theme');
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  }

  private apply(t: ThemeMode): void {
    document.documentElement.setAttribute('data-theme', t);
    try {
      localStorage.setItem('ci-theme', t);
    } catch {
      return;
    }
  }
}
