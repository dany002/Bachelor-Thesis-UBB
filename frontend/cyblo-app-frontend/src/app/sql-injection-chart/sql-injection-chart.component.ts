import {Component, Input, OnInit, AfterViewInit, ChangeDetectorRef, OnDestroy, ViewChild} from '@angular/core';
import {ChartData, ChartOptions, ScatterDataPoint, TooltipItem} from 'chart.js';
import { DashboardService } from '../services/dashboard.service';
import 'chartjs-adapter-moment';
import { BaseChartDirective } from 'ng2-charts';
import * as moment from 'moment';
import {Log} from "../models/Log";
import {interval, Subscription, switchMap} from "rxjs";
import zoomPlugin from 'chartjs-plugin-zoom';


@Component({
  selector: 'app-sql-injection-chart',
  templateUrl: './sql-injection-chart.component.html',
  styleUrls: ['./sql-injection-chart.component.css']
})
export class SqlInjectionChartComponent implements OnInit, OnDestroy {


  @Input() selectedTable: string | undefined;
  @Input() connectionId: string | undefined;

  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  public lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'SQL Injection Detection',
        borderColor: 'red',
        backgroundColor: 'rgba(255, 0, 0, 0.3)',
        borderWidth: 3,
        fill: true
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
            hour: 'MMM D, h:mm a'
          }
        },
        title: {
          display: true,
          text: 'Timestamp'
        }
      },
      y: {
        beginAtZero: true,
        max: 1,
        title: {
          display: true,
          text: 'SQL Injection Detection (0 or 1)'
        }
      }
    },
    plugins: {
      zoom: {
        pan: {
          enabled: true,
          mode: 'xy',
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true
          },
          mode: 'xy',
        }
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'line'>) => {
            const index = context.dataIndex;
            const dataPoint = (this.lineChartData.datasets[0].data as ScatterDataPoint[])[index];
            const query = (dataPoint as any).query;
            return `Prediction: ${dataPoint.y}, Query: ${query}`;
          }
        }
      }
    }
  };

  private subscription: Subscription | undefined;
  private offset: number = 0;

  constructor(private dataFetchService: DashboardService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (this.selectedTable && this.connectionId) {
      this.startFetchingData();
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  startFetchingData(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.subscription = interval(10000)
      .pipe(
        switchMap(() => this.dataFetchService.fetchRecords(this.selectedTable!, this.offset, this.connectionId!))
      )
      .subscribe((response: any) => {
        this.updateChartData(response.records);
        this.offset += 100;
      });
  }

  updateChartData(records: any[]): void {
    const timestamps = records.map(record => new Date(record.timestamp));
    const predictions = records.map(record => record.prediction);
    const queries = records.map(record => record.query);

    // Create a map of timestamps to predictions and queries
    const dataMap: { [key: string]: { y: number, query: string } } = {};
    timestamps.forEach((timestamp, index) => {
      const time = moment(timestamp).startOf('minute').toISOString();
      dataMap[time] = {y: predictions[index], query: queries[index]};
    });

    // Use the first log's timestamp as the start time
    const startTime = timestamps.length > 0 ? moment(timestamps[0]).startOf('minute') : moment().startOf('minute');
    const endTime = moment();

    const newTimeSeries: { x: number, y: number, query: string }[] = [];

    for (let time = startTime; time <= endTime; time.add(1, 'minute')) {
      const timeString = time.toISOString();
      newTimeSeries.push({
        x: time.valueOf(),
        y: dataMap[timeString] !== undefined ? dataMap[timeString].y : 0,
        query: dataMap[timeString] !== undefined ? dataMap[timeString].query : ''
      });
    }

    // Append new data to the existing data
    const existingData = this.lineChartData.datasets[0].data as { x: number, y: number, query: string }[];
    const combinedData = [...existingData, ...newTimeSeries];

    // Sort the combined data by timestamp to maintain chronological order
    combinedData.sort((a, b) => a.x - b.x);

    // Update chart data
    this.lineChartData.labels = combinedData.map(point => point.x);
    this.lineChartData.datasets[0].data = combinedData;

    this.cdr.detectChanges();
    if (this.chart) {
      this.chart.update();
    }
  }


  //
  // @Input() selectedTable: string | undefined;
  // @Input() connectionId: string | undefined;
  //
  // @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;
  //
  // public lineChartData: ChartData<'line'> = {
  //   labels: [],
  //   datasets: [
  //     {
  //       data: [],
  //       label: 'SQL Injection Detection',
  //       borderColor: 'red',
  //       backgroundColor: 'rgba(255, 0, 0, 0.3)',
  //       borderWidth: 3,
  //       fill: true
  //     }
  //   ]
  // };
  //
  // public lineChartOptions: ChartOptions<'line'> = {
  //   responsive: true,
  //   scales: {
  //     x: {
  //       type: 'time',
  //       time: {
  //         unit: 'hour',
  //         displayFormats: {
  //           hour: 'MMM D, h:mm a'
  //         }
  //       },
  //       title: {
  //         display: true,
  //         text: 'Timestamp'
  //       }
  //     },
  //     y: {
  //       beginAtZero: true,
  //       max: 1,
  //       title: {
  //         display: true,
  //         text: 'SQL Injection Detection (0 or 1)'
  //       }
  //     }
  //   },
  //   plugins: {
  //     zoom: {
  //       pan: {
  //         enabled: true,
  //         mode: 'xy',
  //       },
  //       zoom: {
  //         wheel: {
  //           enabled: true,
  //         },
  //         pinch: {
  //           enabled: true
  //         },
  //         mode: 'xy',
  //       }
  //     },
  //     tooltip: {
  //       callbacks: {
  //         label: (context: TooltipItem<'line'>) => {
  //           const index = context.dataIndex;
  //           const query = (this.lineChartData.datasets[0].data as any)[index].query;
  //           return `Prediction: ${context.raw}, Query: ${query}`;
  //         }
  //       }
  //     }
  //   }
  // };
  //
  // private subscription: Subscription | undefined;
  // private offset: number = 0;
  //
  // constructor(private dataFetchService: DashboardService, private cdr: ChangeDetectorRef) {}
  //
  // ngOnInit(): void {
  //   if (this.selectedTable && this.connectionId) {
  //     this.startFetchingData();
  //   }
  // }
  //
  // ngOnDestroy(): void {
  //   if (this.subscription) {
  //     this.subscription.unsubscribe();
  //   }
  // }
  //
  // startFetchingData(): void {
  //   if (this.subscription) {
  //     this.subscription.unsubscribe();
  //   }
  //   this.subscription = interval(10000)
  //     .pipe(
  //       switchMap(() => this.dataFetchService.fetchRecords(this.selectedTable!, this.offset, this.connectionId!))
  //     )
  //     .subscribe((response: any) => {
  //       this.updateChartData(response.records);
  //       this.offset += 100;
  //     });
  // }
  //
  // updateChartData(records: any[]): void {
  //   const timestamps = records.map(record => new Date(record.timestamp));
  //   const predictions = records.map(record => record.prediction);
  //
  //   // Create a map of timestamps to predictions
  //   const dataMap: { [key: string]: number } = {};
  //   timestamps.forEach((timestamp, index) => {
  //     const time = moment(timestamp).startOf('minute').toISOString();
  //     dataMap[time] = predictions[index];
  //   });
  //
  //   // Use the first log's timestamp as the start time
  //   const startTime = timestamps.length > 0 ? moment(timestamps[0]).startOf('minute') : moment().startOf('minute');
  //   const endTime = moment();
  //
  //   const timeSeries: { x: Date, y: number }[] = [];
  //
  //   for (let time = startTime; time <= endTime; time.add(1, 'minute')) {
  //     const timeString = time.toISOString();
  //     timeSeries.push({
  //       x: new Date(timeString),
  //       y: dataMap[timeString] !== undefined ? dataMap[timeString] : 0
  //     });
  //   }
  //
  //   // Ensure existing data arrays are defined and concatenate new data
  //   this.lineChartData.labels = [
  //     ...(this.lineChartData.labels || []),
  //     ...timeSeries.map(point => point.x)
  //   ];
  //   this.lineChartData.datasets[0].data = [
  //     ...(this.lineChartData.datasets[0].data || []),
  //     ...timeSeries.map(point => point.y)
  //   ];
  //
  //   this.cdr.detectChanges();
  //   if (this.chart) {
  //     this.chart.update();
  //   }
  // }


}
