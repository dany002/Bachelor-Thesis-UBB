import { Component, Input, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { DashboardService } from '../services/dashboard.service';
import 'chartjs-adapter-moment';
import * as moment from 'moment';

@Component({
  selector: 'app-sql-injection-chart',
  templateUrl: './sql-injection-chart.component.html',
  styleUrls: ['./sql-injection-chart.component.css']
})
export class SqlInjectionChartComponent implements OnInit, AfterViewInit {
  @Input() fileIdSQL: string | undefined;

  public lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'SQL Injection Detected',
        borderWidth: 2,
        pointRadius: 2
      }
    ]
  };

  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'hour',
          displayFormats: {
            hour: 'h:mm a'
          }
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Suspicion Level'
        }
      }
    }
  };

  constructor(private dashboardService: DashboardService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    console.log('ngOnInit: Initializing component');
    if (this.fileIdSQL) {
      this.fetchData();
    } else {
      this.loadHardcodedData();
    }
  }

  ngAfterViewInit(): void {
    console.log('ngAfterViewInit: View initialized');
    this.cdr.detectChanges();  // Ensure change detection after view init
  }

  fetchData(): void {
    if (this.fileIdSQL != undefined) {
      console.log('fetchData: Fetching data for fileIdSQL:', this.fileIdSQL);
      this.dashboardService.refreshChartSQLForASpecificFile(this.fileIdSQL).subscribe(
        (response) => {
          console.log('fetchData: Refresh response:', response);
          if (response.detail === "File processed successfully") {
            this.dashboardService.getLogsForAFile(this.fileIdSQL).subscribe(
              (logs) => {
                console.log('fetchData: Logs fetched:', logs);
                const { timestamps, suspicions } = this.aggregateData(logs);
                this.updateChartData(timestamps, suspicions);
              },
              (error) => {
                console.error('Error fetching logs:', error);
              }
            );
          } else {
            console.error('File processing failed:', response);
          }
        },
        (error) => {
          console.error('Error fetching data:', error);
        }
      );
    }
  }

  loadHardcodedData(): void {
    console.log('loadHardcodedData: Loading hardcoded data');
    const sampleTimestamps = [
      new Date('2024-05-18T10:00:00Z'),
      new Date('2024-05-18T11:00:00Z'),
      new Date('2024-05-18T12:00:00Z')
    ];

    const sampleSuspicions = [2, 5, 8];

    this.updateChartData(sampleTimestamps, sampleSuspicions);
  }

  updateChartData(timestamps: Date[], suspicions: number[]): void {
    console.log('updateChartData: Updating chart data');
    this.lineChartData.labels = timestamps as unknown as string[];
    this.lineChartData.datasets[0].data = suspicions;

    // Force change detection and chart redraw
    this.cdr.detectChanges();
    setTimeout(() => {
      console.log('updateChartData: Triggering markForCheck');
      this.cdr.markForCheck();
    }, 0);
  }

  aggregateData(logs: any[]): { timestamps: Date[], suspicions: number[] } {
    console.log('aggregateData: Aggregating data');
    const aggregatedData: { [key: string]: { sum: number, count: number } } = {};

    logs.forEach(log => {
      const timestamp = moment(log.timestamp).startOf('hour').toISOString();
      if (!aggregatedData[timestamp]) {
        aggregatedData[timestamp] = { sum: 0, count: 0 };
      }
      aggregatedData[timestamp].sum += log.level;
      aggregatedData[timestamp].count += 1;
    });

    const timestamps: Date[] = [];
    const suspicions: number[] = [];

    for (const timestamp in aggregatedData) {
      timestamps.push(new Date(timestamp));
      suspicions.push(aggregatedData[timestamp].sum / aggregatedData[timestamp].count);
    }

    console.log('aggregateData: Aggregated timestamps:', timestamps);
    console.log('aggregateData: Aggregated suspicions:', suspicions);

    return { timestamps, suspicions };
  }
}
