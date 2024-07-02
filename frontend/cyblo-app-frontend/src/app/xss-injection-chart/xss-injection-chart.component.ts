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
  selector: 'app-xss-injection-chart',
  templateUrl: './xss-injection-chart.component.html',
  styleUrls: ['./xss-injection-chart.component.css']
})
export class XssInjectionChartComponent implements OnInit, OnDestroy, OnChanges {

  @Input() selectedTableXSS: string | undefined;
  @Input() connectionId: string | undefined;
  @Input() selectedOption: string | undefined;
  @Input() selectedFile: string | null | undefined
  @Input() selectedMode: string | undefined;

  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;


  public lineChartData: ChartData<'line'> = {
    datasets: [
      {
        data: [], // For counts of queries labeled as 1
        label: 'XSS Attacks',
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
          text: 'Count of XSS Attacks Detections'
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
    if (this.selectedTableXSS && this.connectionId && this.selectedMode === 'Real-Time') {
      this.startFetchingData();
    } else {
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
    this.subscription = interval(10000) // Wait for 30 seconds between each request
      .pipe(
        switchMap(() => {
          const currentTimestamp = moment().format('HH:mm'); // Update current timestamp for each request
          if (this.selectedOption === 'AI') {
            return this.dataFetchService.fetchRecordsForBiLSTMXSS(this.selectedTableXSS!, currentTimestamp, this.connectionId!, this.offset);
          } else if (this.selectedOption === 'Regex') {
            return this.dataFetchService.fetchRecordsForRegexXSS(this.selectedTableXSS!, currentTimestamp, this.connectionId!, this.offset);
          } else if (this.selectedOption === 'Forest') {
            return this.dataFetchService.fetchRecordsForRandomForestXSS(this.selectedTableXSS!, currentTimestamp, this.connectionId!, this.offset);
          }
          else {
            throw new Error('Invalid selected option');
          }
        })
      )
      .subscribe((response: any) => {
        this.updateChartData(response.records);
        this.offset += 1;
      });
  }

  startFetchingDataFromFile(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    const currentTimestamp = moment().format('HH:mm'); // Update current timestamp for each request
    this.subscription = interval(10000) // Wait for 30 seconds between each request
      .pipe(
        switchMap(() => {
          if (this.selectedOption === 'AI' && this.selectedFile) {
            return this.dataFetchService.checkFileXSSBiLSTM(this.selectedFile, currentTimestamp, this.offset);
          } else if (this.selectedOption === 'Regex' && this.selectedFile) {
            return this.dataFetchService.checkFileXSSRegex(this.selectedFile, currentTimestamp, this.offset);
          } else if (this.selectedOption === 'Forest' && this.selectedFile) {
            return this.dataFetchService.checkFileXSSRandomForest(this.selectedFile, currentTimestamp, this.offset);
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

    const pointDataXSS = { x: currentTime.valueOf(), y: sqliCount };
    const pointDataNoXSS = { x: currentTime.valueOf(), y: noSqliCount };

    this.lineChartData.datasets[0].data = [...this.lineChartData.datasets[0].data, pointDataXSS];
    this.lineChartData.datasets[1].data = [...this.lineChartData.datasets[1].data, pointDataNoXSS];

    this.lineChartOptions.scales!['x']!.min = moment().valueOf();
    this.lineChartOptions.scales!['x']!.max = moment().add(10, 'minutes').valueOf();

    this.cdr.detectChanges();  // Force change detection
    if (this.chart) {
      this.chart.update();
    }
  }
}
