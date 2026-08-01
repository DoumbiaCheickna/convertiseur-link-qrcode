import { Injectable, signal } from '@angular/core';
import { HistoryEntry } from '../models/history-entry.model';
import { QrContent } from '../models/qr-content.model';

const STORAGE_KEY = 'ci-history';

@Injectable({ providedIn: 'root' })
export class HistoryService {
  readonly entries = signal<HistoryEntry[]>(this.load());

  add(content: QrContent, tool: string): void {
    const entry: HistoryEntry = {
      ...content,
      tool,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date: Date.now(),
    };
    this.entries.update(list => [entry, ...list].slice(0, 60));
    this.persist();
  }

  remove(id: string): void {
    this.entries.update(list => list.filter(e => e.id !== id));
    this.persist();
  }

  clear(): void {
    this.entries.set([]);
    this.persist();
  }

  private load(): HistoryEntry[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as HistoryEntry[];
    } catch {
      return [];
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.entries()));
    } catch {
      return;
    }
  }
}
