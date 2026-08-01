import { Component, inject, signal } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { filter } from 'rxjs';
import { ThemeService } from '../services/theme.service';
import { ToastContainerComponent } from '../shared/toast-container.component';
import { TOOL_GROUPS } from '../data/tools';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToastContainerComponent],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  protected readonly groups = TOOL_GROUPS;
  protected readonly theme = inject(ThemeService);
  protected readonly menuOpen = signal(false);
  protected readonly title = signal('ConvertIQ');
  protected readonly sub = signal('');

  private readonly router = inject(Router);
  private readonly titleService = inject(Title);

  constructor() {
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe(() => {
      const data = this.deepest(this.router.routerState.snapshot.root)?.data ?? {};
      const t = String(data['title'] ?? 'ConvertIQ');
      this.title.set(t);
      this.sub.set(String(data['sub'] ?? ''));
      this.titleService.setTitle(`${t} — ConvertIQ`);
      this.menuOpen.set(false);
    });
  }

  private deepest(r: ActivatedRouteSnapshot): ActivatedRouteSnapshot | null {
    let cur: ActivatedRouteSnapshot | null = r;
    while (cur.firstChild) cur = cur.firstChild;
    return cur;
  }

  toggleMenu(): void {
    this.menuOpen.update(v => !v);
  }
}
