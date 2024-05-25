import { Component, Input, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { DashboardService } from '../services/dashboard.service';
import 'chartjs-adapter-moment';
import * as moment from 'moment';
import {Log} from "../models/Log";

@Component({
  selector: 'app-sql-injection-chart',
  templateUrl: './sql-injection-chart.component.html',
  styleUrls: ['./sql-injection-chart.component.css']
})
export class SqlInjectionChartComponent implements OnInit, AfterViewInit {
  @Input() fileIdSQL: string | undefined;

  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'No SQL Injection Detected',
        backgroundColor: 'blue'
      },
      {
        data: [],
        label: 'SQL Injection Detected',
        backgroundColor: 'red'
      }
    ]
  };

  public barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    scales: {
      x: {
        type: 'timeseries',
        time: {
          unit: 'hour',
          displayFormats: {
            hour: 'MMM D, h:mm a (TIMESTAMP)'
          }
        },
        title: {
          display: true,
          text: 'Timestamp'
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Logs'
        }
      }
    }
  };

  constructor(private dashboardService: DashboardService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (this.fileIdSQL) {
      this.fetchData();
    } else {
      this.loadHardcodedData();
    }
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();  // Ensure change detection after view init
  }

  loadHardcodedData(): void {
    const sampleTimestamps = [
      new Date('2024-05-18T10:00:00Z'),
      new Date('2024-05-18T11:00:00Z'),
      new Date('2024-05-18T12:00:00Z')
    ];

    const sampleSuspicions = [2, 5, 8];

    //this.updateChartData(sampleTimestamps, sampleSuspicions);
  }

  fetchData(): void {
    if (this.fileIdSQL) {
      this.dashboardService.refreshChartSQLForASpecificFile(this.fileIdSQL).subscribe(
        (response) => {
          if (response.detail === "File processed successfully") {
            this.dashboardService.getLogsForAFile(this.fileIdSQL).subscribe(
                (logs: Log[]) => {
                  // Extract timestamps from logs
                  const timestamps = logs.map(log => new Date(log.timestamp));
                  this.updateChartData(timestamps, logs);
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


  // updateChartData(timestamps: Date[], logs: Log[]): void {
  //   // Group logs by suspicion level
  //   const groupedLogs = logs.reduce((acc, log) => {
  //     const key = log.level === 0 ? 'level0' : 'level10';
  //     if (!acc[key]) {
  //       acc[key] = [];
  //     }
  //     acc[key].push(log);
  //     return acc;
  //   }, {} as { [key: string]: Log[] });
  //
  //   // Count logs for each level
  //   const zeroSuspicions = groupedLogs['level0'] ? groupedLogs['level0'].length : 0;
  //   const tenSuspicions = groupedLogs['level10'] ? groupedLogs['level10'].length : 0;
  //   console.log(zeroSuspicions);
  //   console.log(tenSuspicions)
  //   // Update the dataset with the new values
  //   this.barChartData.datasets[0].data = [zeroSuspicions];
  //   this.barChartData.datasets[1].data = [tenSuspicions];
  //
  //   // Force change detection and chart redraw
  //   this.cdr.detectChanges();
  //   setTimeout(() => {
  //     this.cdr.markForCheck();
  //   }, 0);
  // }

  updateChartData(timestamps: Date[], logs: Log[]): void {
    const zeroSuspicions = logs.filter(log => log.level === 0).length;
    const tenSuspicions = logs.filter(log => log.level === 10).length;

    this.barChartData.labels = timestamps.map(timestamp => moment(timestamp).format('MMM D, h:mm a'));
    console.log(timestamps);
    this.barChartData.datasets[0].data = [zeroSuspicions];
    this.barChartData.datasets[1].data = [tenSuspicions];

    // Force change detection and chart redraw
    this.cdr.detectChanges();
    setTimeout(() => {
      this.cdr.markForCheck();
    }, 0);
  }



  aggregateData(logs: any[]): { timestamps: Date[], suspicions: number[] } {
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

    return { timestamps, suspicions };
  }
}
