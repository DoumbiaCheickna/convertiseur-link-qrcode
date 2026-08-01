import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { HomeComponent } from './pages/home/home.component';
import { GeneratorComponent } from './pages/generator/generator.component';
import { ScannerComponent } from './pages/scanner/scanner.component';
import { BulkComponent } from './pages/bulk/bulk.component';
import { HistoryComponent } from './pages/history/history.component';
import { TOOLS } from './data/tools';

function toolRoute(id: string): { path: string; component: typeof GeneratorComponent; data: Record<string, string> } {
  const t = TOOLS[id];
  return {
    path: id,
    component: GeneratorComponent,
    data: { toolId: id, title: t.title, sub: t.sub },
  };
}

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', pathMatch: 'full', component: HomeComponent, data: { title: 'Accueil', sub: 'ConvertIQ' } },
      toolRoute('url'),
      toolRoute('text'),
      toolRoute('wifi'),
      toolRoute('email'),
      toolRoute('phone'),
      toolRoute('vcard'),
      toolRoute('geo'),
      { path: 'scanner', component: ScannerComponent, data: { title: 'Scanner un QR', sub: 'Décoder depuis la caméra ou une image' } },
      { path: 'bulk', component: BulkComponent, data: { title: 'Conversion en masse', sub: 'Générer plusieurs QR codes à la fois' } },
      { path: 'history', component: HistoryComponent, data: { title: 'Historique', sub: 'Vos QR codes récents' } },
    ],
  },
  { path: '**', redirectTo: '' },
];
