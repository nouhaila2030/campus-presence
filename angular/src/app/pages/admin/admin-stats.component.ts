import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { forkJoin } from 'rxjs';
import { Absence } from '../../models/absence.model';
import { Classe } from '../../models/classe.model';
import { AbsenceService } from '../../services/absence.service';
import { ClasseService } from '../../services/classe.service';
import { EtudiantService } from '../../services/etudiant.service';

Chart.register(...registerables);

type LineGranularity = 'day' | 'week';

@Component({
  selector: 'app-admin-stats',
  templateUrl: './admin-stats.component.html',
  styleUrl: './admin-stats.component.css',
})
export class AdminStatsComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly absenceService = inject(AbsenceService);
  private readonly etudiantService = inject(EtudiantService);
  private readonly classeService = inject(ClasseService);

  @ViewChild('barChart') private readonly barChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieChart') private readonly pieChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('lineChart') private readonly lineChartRef?: ElementRef<HTMLCanvasElement>;

  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal('');
  protected readonly lineGranularity = signal<LineGranularity>('day');
  protected readonly totalEtudiants = signal(0);
  protected readonly totalAbsences = signal(0);
  protected readonly totalJustifiees = signal(0);
  protected readonly totalNonJustifiees = signal(0);

  private absences: Absence[] = [];
  private classes: Classe[] = [];
  private charts: Chart[] = [];
  private viewReady = false;
  private dataReady = false;

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.tryRenderCharts();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  onLineGranularityChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as LineGranularity;
    this.lineGranularity.set(value);
    this.updateLineChart();
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    forkJoin({
      absences: this.absenceService.getAll(),
      etudiants: this.etudiantService.getAll(),
      classes: this.classeService.getAll(),
    }).subscribe({
      next: ({ absences, etudiants, classes }) => {
        this.absences = absences;
        this.classes = classes;
        const justifiees = absences.filter((a) => a.justifiee).length;
        this.totalEtudiants.set(etudiants.length);
        this.totalAbsences.set(absences.length);
        this.totalJustifiees.set(justifiees);
        this.totalNonJustifiees.set(absences.length - justifiees);
        this.isLoading.set(false);
        this.dataReady = true;
        this.tryRenderCharts();
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Impossible de charger les statistiques.');
      },
    });
  }

  private tryRenderCharts(): void {
    if (!this.dataReady || !this.viewReady || this.isLoading()) {
      return;
    }
    requestAnimationFrame(() => {
      this.destroyCharts();
      this.renderBarChart();
      this.renderPieChart();
      this.renderLineChart();
    });
  }

  private destroyCharts(): void {
    for (const chart of this.charts) {
      chart.destroy();
    }
    this.charts = [];
  }

  private getAbsenceClasseId(absence: Absence): number | null {
    return absence.etudiant?.classe?.id ?? absence.seance?.classe?.id ?? null;
  }

  private getAbsenceDate(absence: Absence): string | null {
    return absence.date ?? absence.seance?.date ?? null;
  }

  private buildAbsencesPerClasse(): { labels: string[]; data: number[] } {
    const counts = new Map<number, number>();
    for (const absence of this.absences) {
      const classeId = this.getAbsenceClasseId(absence);
      if (classeId != null) {
        counts.set(classeId, (counts.get(classeId) ?? 0) + 1);
      }
    }
    const labels: string[] = [];
    const data: number[] = [];
    for (const classe of this.classes) {
      labels.push(classe.nom || `Classe ${classe.id}`);
      data.push(counts.get(classe.id) ?? 0);
    }
    const unassigned = this.absences.filter((a) => this.getAbsenceClasseId(a) == null).length;
    if (unassigned > 0) {
      labels.push('Non assignée');
      data.push(unassigned);
    }
    return { labels, data };
  }

  private getWeekStartKey(dateStr: string): string {
    const date = new Date(`${dateStr}T12:00:00`);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    return date.toISOString().slice(0, 10);
  }

  private buildAbsencesTimeline(granularity: LineGranularity): { labels: string[]; data: number[] } {
    const counts = new Map<string, number>();
    for (const absence of this.absences) {
      const date = this.getAbsenceDate(absence);
      if (!date) continue;
      const key = granularity === 'week' ? this.getWeekStartKey(date) : date;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const sorted = [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
    return {
      labels: sorted.map(([key]) =>
        granularity === 'week' ? `Sem. ${this.formatShortDate(key)}` : this.formatShortDate(key),
      ),
      data: sorted.map(([, count]) => count),
    };
  }

  private formatShortDate(isoDate: string): string {
    const [y, m, d] = isoDate.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  private renderBarChart(): void {
    const canvas = this.barChartRef?.nativeElement;
    if (!canvas) return;
    const { labels, data } = this.buildAbsencesPerClasse();
    this.charts.push(
      new Chart(canvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Absences',
              data,
              backgroundColor: 'rgba(37, 99, 235, 0.75)',
              borderColor: '#2563eb',
              borderWidth: 1,
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(148, 163, 184, 0.2)' } },
            x: { grid: { display: false } },
          },
        },
      }),
    );
  }

  private renderPieChart(): void {
    const canvas = this.pieChartRef?.nativeElement;
    if (!canvas) return;
    this.charts.push(
      new Chart(canvas, {
        type: 'pie',
        data: {
          labels: ['Justifiées', 'Non justifiées'],
          datasets: [
            {
              data: [this.totalJustifiees(), this.totalNonJustifiees()],
              backgroundColor: ['#2563eb', '#93c5fd'],
              borderColor: '#ffffff',
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { color: '#334155', padding: 16 } } },
        },
      }),
    );
  }

  private renderLineChart(): void {
    const canvas = this.lineChartRef?.nativeElement;
    if (!canvas) return;
    const { labels, data } = this.buildAbsencesTimeline(this.lineGranularity());
    this.charts.push(
      new Chart(canvas, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Absences',
              data,
              borderColor: '#2563eb',
              backgroundColor: 'rgba(37, 99, 235, 0.12)',
              fill: true,
              tension: 0.35,
              pointBackgroundColor: '#1d4ed8',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 2,
              pointRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(148, 163, 184, 0.2)' } },
            x: { grid: { display: false } },
          },
        },
      }),
    );
  }

  private updateLineChart(): void {
    const lineChart = this.charts[2];
    if (!lineChart) {
      this.renderLineChart();
      return;
    }
    const { labels, data } = this.buildAbsencesTimeline(this.lineGranularity());
    lineChart.data.labels = labels;
    lineChart.data.datasets[0].data = data;
    lineChart.update();
  }
}
