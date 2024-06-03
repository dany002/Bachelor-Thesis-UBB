import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ViewChild,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { ChartData, ChartOptions, TooltipItem } from 'chart.js/auto';
import { DashboardService } from '../services/dashboard.service';
import 'chartjs-adapter-moment';
import { BaseChartDirective } from 'ng2-charts';
import * as moment from 'moment';
import { forkJoin, interval, Subscription, switchMap } from "rxjs";
import zoomPlugin from 'chartjs-plugin-zoom';

Chart.register(...registerables, zoomPlugin);

@Component({
  selector: 'app-xss-injection-chart-detailed-ai-regex',
  templateUrl: './xss-injection-chart-detailed-ai-regex.component.html',
  styleUrls: ['./xss-injection-chart-detailed-ai-regex.component.css']
})
export class XssInjectionChartDetailedAiRegexComponent implements OnInit, OnDestroy, OnChanges{

  @Input() selectedTableXSS: string | undefined;
  @Input() connectionId: string | undefined;
  @Input() selectedOption: string | undefined;

  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  public lineChartData: ChartData<'line'> = {
    datasets: [
      {
        data: [],
        label: 'XSS Attacks Detected With LSTM',
        borderColor: 'red',
        backgroundColor: 'rgba(255, 0, 0, 0.3)',
        borderWidth: 3,
        pointRadius: 3,
        fill: false
      },
      {
        data: [],
        label: 'XSS Attacks Detected With Regex',
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
        max: 100,
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
            const formattedDate = moment(dataPoint.x).format('MMM D, HH:mm:ss');
            return `Count: ${dataPoint.y}, ${formattedDate}`;
          }
        }
      }
    }
  };

  private offset: number = 0;
  private subscription: Subscription | undefined;

  constructor(private dataFetchService: DashboardService) {}

  ngOnInit(): void {
    if (this.selectedTableXSS && this.connectionId) {
      this.startFetchingData();
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
    this.startFetchingData();
  }

  startFetchingData(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    const currentTimestamp = moment().format('HH:mm');
    this.subscription = interval(10000)
      .pipe(
        switchMap(() => {
          // const currentTimestamp = moment().format('HH:mm:ss'); // Update current timestamp for each request
          return forkJoin([
            this.dataFetchService.fetchRecordsForAIXSS(this.selectedTableXSS!, currentTimestamp, this.connectionId!, this.offset),
            this.dataFetchService.fetchRecordsForRegexXSS(this.selectedTableXSS!, currentTimestamp, this.connectionId!, this.offset)
          ]);
        })
      )
      .subscribe(([aiResponse, regexResponse]: [any, any]) => {
        this.updateChartData(aiResponse.records, regexResponse.records);
        this.offset += 1;
      });
  }

  updateChartData(aiRecords: any[], regexRecords: any[]): void {
    const currentTimestamp = moment().valueOf(); // Current time on the frontend

    const aiPredictions = aiRecords.map(record => record.prediction);
    const regexPredictions = regexRecords.map(record => record.prediction);

    // Count SQL Injection detections for AI and Regex
    const sqliCountAI = aiPredictions.filter(prediction => prediction === 1).length;
    const sqliCountRegex = regexPredictions.filter(prediction => prediction === 1).length;

    // Create point data for SQL Injection detections
    const pointDataSqliAI = { x: currentTimestamp, y: sqliCountAI };
    const pointDataSqliRegex = { x: currentTimestamp, y: sqliCountRegex };

    // Append new data to existing datasets
    this.lineChartData.datasets[0].data.push(pointDataSqliAI);
    this.lineChartData.datasets[1].data.push(pointDataSqliRegex);

    // Update chart options
    this.lineChartOptions.scales!['x']!.min = moment().valueOf();
    this.lineChartOptions.scales!['x']!.max = moment().add(10, 'minutes').valueOf();

    if (this.chart) {
      this.chart.update();
    }
  }
}
