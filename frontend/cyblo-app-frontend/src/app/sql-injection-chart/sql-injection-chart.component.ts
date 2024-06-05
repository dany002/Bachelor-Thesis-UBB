import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ViewChild,
  OnChanges, SimpleChanges, ChangeDetectorRef
} from '@angular/core';
import { Chart, registerables } from 'chart.js';

import {ChartData, ChartOptions, ChartType, ScatterDataPoint, TooltipItem} from 'chart.js/auto';
import { DashboardService } from '../services/dashboard.service';
import 'chartjs-adapter-moment';
import { BaseChartDirective } from 'ng2-charts';
import * as moment from 'moment';
import {interval, Subscription, switchMap, take} from "rxjs";
import zoomPlugin from 'chartjs-plugin-zoom';

Chart.register(...registerables, zoomPlugin);

@Component({
  selector: 'app-sql-injection-chart',
  templateUrl: './sql-injection-chart.component.html',
  styleUrls: ['./sql-injection-chart.component.css']
})
export class SqlInjectionChartComponent implements OnInit, OnDestroy, OnChanges {

  @Input() selectedTable: string | undefined;
  @Input() connectionId: string | undefined;
  @Input() selectedOption: string | undefined;
  @Input() selectedFile: string | null | undefined
  @Input() selectedMode: string | undefined;

  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;


  public lineChartData: ChartData<'line'> = {
    datasets: [
      {
        data: [], // For counts of queries labeled as 1
        label: 'SQL Injection Attacks',
        borderColor: 'red',
        backgroundColor: 'rgba(255, 0, 0, 0.3)',
        borderWidth: 3,
        pointRadius: 3,
        fill: false
      },
      {
        data: [], // For counts of queries labeled as 0
        label: 'Safe Queries',
        borderColor: 'green',
        backgroundColor: 'rgba(0, 255, 0, 0.3)',
        borderWidth: 3,
        pointRadius: 3,
        fill: false
      }
    ]
  };


  public lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'second',
          displayFormats: {
            second: 'HH:mm:ss'
          }
        },
        title: {
          display: true,
          text: 'Timestamp'
        },
        min: moment().valueOf(),
        max: moment().add(10, 'minutes').valueOf()
      },
      y: {
        beginAtZero: true,
        max: 200,
        title: {
          display: true,
          text: 'Count of SQL Injection Detections'
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
            const dataPoint = context.raw as { x: number, y: number };
            const formattedDate = moment(dataPoint.x).format('MMM D, h:mm a');
            // return `Count: ${dataPoint.x}, ${dataPoint.y}`
            return `Count: ${dataPoint.y}, ${formattedDate}`;
          }
        }
      }
    }
  };

  private offset: number = 0;
  private subscription: Subscription | undefined;

  constructor(private dataFetchService: DashboardService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (this.selectedTable && this.connectionId && this.selectedMode === 'Real-Time') {
      this.startFetchingData();
    } else{
      this.startFetchingDataFromFile();
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedOption'] && !changes['selectedOption'].firstChange) {
      this.renderChart();
    }
  }

  renderChart(): void {
    // Clear existing data
    this.lineChartData.datasets[0].data = [];
    this.lineChartData.datasets[1].data = [];
    this.offset = 0;

    if (this.chart) {
      this.chart.update();
    }

    // Start fetching new data
    if(this.selectedMode === 'Real-Time')
      this.startFetchingData();
    else{
      this.startFetchingDataFromFile()
    }
  }

  startFetchingData(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    const currentTimestamp = moment().format('HH:mm'); // Update current timestamp for each request
    this.subscription = interval(10000) // Wait for 30 seconds between each request
      .pipe(
        switchMap(() => {
          if (this.selectedOption === 'AI') {
            return this.dataFetchService.fetchRecordsForAISQL(this.selectedTable!, currentTimestamp, this.connectionId!, this.offset);
          } else if (this.selectedOption === 'Regex') {
            return this.dataFetchService.fetchRecordsForRegexSQL(this.selectedTable!, currentTimestamp, this.connectionId!, this.offset);
          } else {
            throw new Error('Invalid selected option');
          }
        })
      )
      .subscribe((response: any) => {
        // console.log(response.records);
        this.updateChartData(response.records);
        this.offset += 1;
      });
  }

  startFetchingDataFromFile(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.subscription = interval(10000) // Wait for 30 seconds between each request
      .pipe(
        switchMap(() => {
          const currentTimestamp = moment().format('HH:mm:ss');
          if (this.selectedOption === 'AI' && this.selectedFile) {
            return this.dataFetchService.checkFileSQLAI(this.selectedFile, currentTimestamp, this.offset);
          } else if (this.selectedOption === 'Regex' && this.selectedFile) {
            return this.dataFetchService.checkFileSQLRegex(this.selectedFile, currentTimestamp, this.offset);
          } else {
            throw new Error('Invalid selected option');
          }
        })
      )
      .subscribe((response: any) => {
        this.updateChartData(response.records);
        this.offset += 1;
      });
  }

  updateChartData(records: any[]): void {
    const currentTime = moment(); // Current time on the frontend

    const sqliCount = records.filter(record => record.prediction === 1).length;
    const noSqliCount = records.filter(record => record.prediction === 0).length;

    const pointDataSqli = { x: currentTime.valueOf(), y: sqliCount };
    const pointDataNoSqli = { x: currentTime.valueOf(), y: noSqliCount };

    this.lineChartData.datasets[0].data = [...this.lineChartData.datasets[0].data, pointDataSqli];
    this.lineChartData.datasets[1].data = [...this.lineChartData.datasets[1].data, pointDataNoSqli];

    this.lineChartOptions.scales!['x']!.min = moment().valueOf();
    this.lineChartOptions.scales!['x']!.max = moment().add(10, 'minutes').valueOf();

    this.cdr.detectChanges();  // Force change detection
    if (this.chart) {
      this.chart.update();
    }
  }


  // updateChartData(records: any[]): void {
  //   const timestamps = records.map(record => new Date(record.timestamp));
  //   const predictions = records.map(record => record.prediction);
  //
  //   const sqliCount = predictions.filter(prediction => prediction === 1).length;
  //   const noSqliCount = predictions.filter(prediction => prediction === 0).length;
  //
  //   const x = timestamps[0].getTime() - 3 * 60 * 60 * 1000;
  //
  //   const pointDataSqli = { x, y: sqliCount };
  //   const pointDataNoSqli = { x, y: noSqliCount };
  //
  //   this.lineChartData.datasets[0].data = [...this.lineChartData.datasets[0].data, pointDataSqli];
  //   this.lineChartData.datasets[1].data = [...this.lineChartData.datasets[1].data, pointDataNoSqli];
  //
  //   this.lineChartData.datasets[0].label = 'SQL Injection Attacks';
  //   this.lineChartData.datasets[1].label = 'Safe Queries';
  //
  //   this.lineChartOptions.scales!['x']!.min = moment().subtract(3, 'hours').valueOf();
  //   this.lineChartOptions.scales!['x']!.max = moment().add(40, 'minutes').valueOf();
  //
  //   this.cdr.detectChanges();  // Force change detection
  //   if (this.chart) {
  //     this.chart.update();
  //   }
  // }


  // updateChartData(records: any[]): void {
  //   const timestamps = records.map(record => new Date(record.timestamp));
  //   const predictions = records.map(record => record.prediction);
  //
  //   // Count SQL Injection and Non-SQL Injection queries
  //   const sqliCount = predictions.filter(prediction => prediction === 1).length;
  //   const noSqliCount = predictions.filter(prediction => prediction === 0).length;
  //
  //   // Calculate x coordinate with -3 hours adjustment
  //   const x = timestamps[0].getTime() - 3 * 60 * 60 * 1000;
  //
  //   // Create point data for SQL Injection and Non-SQL Injection queries
  //   const pointDataSqli = { x, y: sqliCount };
  //   const pointDataNoSqli = { x, y: noSqliCount };
  //
  //   // Append new data to existing datasets or create new datasets if they don't exist
  //   if (!this.lineChartData.datasets[0].data.length) {
  //     this.lineChartData.datasets[0].data.push(pointDataSqli);
  //   } else {
  //     const lastDataPoint = this.lineChartData.datasets[0].data[this.lineChartData.datasets[0].data.length - 1] as ScatterDataPoint;
  //     if (lastDataPoint && lastDataPoint.x !== undefined && lastDataPoint.x !== pointDataSqli.x) {
  //       this.lineChartData.datasets[0].data.push(pointDataSqli);
  //     }
  //   }
  //
  //   if (!this.lineChartData.datasets[1].data.length) {
  //     this.lineChartData.datasets[1].data.push(pointDataNoSqli);
  //   } else {
  //     const lastDataPoint = this.lineChartData.datasets[1].data[this.lineChartData.datasets[1].data.length - 1] as ScatterDataPoint;
  //     if (lastDataPoint && lastDataPoint.x !== undefined && lastDataPoint.x !== pointDataNoSqli.x) {
  //       this.lineChartData.datasets[1].data.push(pointDataNoSqli);
  //     }
  //   }
  //
  //   // Update dataset labels
  //   this.lineChartData.datasets[0].label = 'SQL Injection Attacks';
  //   this.lineChartData.datasets[1].label = 'Safe Queries';
  //   console.log(this.lineChartData.datasets[0]);
  //   console.log(this.lineChartData.datasets[1]);
  //
  //   // Update chart options
  //   this.lineChartOptions.scales!['x']!.min = moment().subtract(3, 'hours').valueOf();
  //   this.lineChartOptions.scales!['x']!.max = moment().add(40, 'minutes').valueOf();
  //
  //   if (this.chart) {
  //     this.chart.update();
  //   }
  // }

}
