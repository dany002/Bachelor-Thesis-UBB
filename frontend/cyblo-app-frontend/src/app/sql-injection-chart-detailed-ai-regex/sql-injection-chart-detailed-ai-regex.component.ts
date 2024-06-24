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
  selector: 'app-sql-injection-chart-detailed-ai-regex',
  templateUrl: './sql-injection-chart-detailed-ai-regex.component.html',
  styleUrls: ['./sql-injection-chart-detailed-ai-regex.component.css']
})
export class SqlInjectionChartDetailedAiRegexComponent implements OnInit, OnDestroy, OnChanges {

  @Input() selectedTable: string | undefined;
  @Input() connectionId: string | undefined;
  @Input() selectedOption: string | undefined;
  @Input() selectedFile: string | null | undefined
  @Input() selectedMode: string | undefined;

  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  public lineChartData: ChartData<'line'> = {
    datasets: [
      {
        data: [],
        label: 'SQL Injection Detected With LSTM',
        borderColor: 'red',
        backgroundColor: 'rgba(255, 0, 0, 0.3)',
        borderWidth: 3,
        pointRadius: 3,
        fill: false
      },
      {
        data: [],
        label: 'SQL Injection Detected With Regex',
        borderColor: 'green',
        backgroundColor: 'rgba(0, 255, 0, 0.3)',
        borderWidth: 3,
        pointRadius: 3,
        fill: false
      },
      {
        data: [],
        label: 'SQL Injection Detected With Random Forests',
        borderColor: 'blue',
        backgroundColor: 'rgba(0, 0, 255, 0.5)',
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
    if (this.selectedTable && this.connectionId && this.selectedMode === 'Real-Time') {
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
    this.lineChartData.datasets[2].data = [];
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

  startFetchingDataFromFile(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    this.subscription = interval(10000)
      .pipe(
        switchMap(() => {
          const currentTimestamp = moment().format('HH:mm:ss');
          // const currentTimestamp = moment().format('HH:mm:ss'); // Update current timestamp for each request
          if(this.selectedFile)
            return forkJoin([
            this.dataFetchService.checkFileSQLAI(this.selectedFile, currentTimestamp, this.offset),
            this.dataFetchService.checkFileSQLRegex(this.selectedFile, currentTimestamp, this.offset),
            this.dataFetchService.checkFileSQLRandom(this.selectedFile, currentTimestamp, this.offset)
          ]);
          else
            throw new Error('Invalid selected option');
        })
      )
      .subscribe(([aiResponse, regexResponse, forestsResponse]: [any, any, any]) => {
        this.updateChartData(aiResponse.records, regexResponse.records, forestsResponse.records);
        this.offset += 1;
      });
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
            this.dataFetchService.fetchRecordsForAISQL(this.selectedTable!, currentTimestamp, this.connectionId!, this.offset),
            this.dataFetchService.fetchRecordsForRegexSQL(this.selectedTable!, currentTimestamp, this.connectionId!, this.offset),
            this.dataFetchService.fetchRecordsForRandomSQL(this.selectedTable!, currentTimestamp, this.connectionId!, this.offset)
          ]);
        })
      )
      .subscribe(([aiResponse, regexResponse, forestsResponse]: [any, any, any]) => {
        this.updateChartData(aiResponse.records, regexResponse.records, forestsResponse.records);
        this.offset += 1;
      });
  }

  updateChartData(aiRecords: any[], regexRecords: any[], forestsRecords: any[]): void {
    const currentTimestamp = moment().valueOf(); // Current time on the frontend

    const aiPredictions = aiRecords.map(record => record.prediction);
    const regexPredictions = regexRecords.map(record => record.prediction);
    const forestPredictions = forestsRecords.map(record => record.prediction);

    // Count SQL Injection detections for AI and Regex
    const sqliCountAI = aiPredictions.filter(prediction => prediction === 1).length;
    const sqliCountRegex = regexPredictions.filter(prediction => prediction === 1).length;
    const sqliCountForest = forestPredictions.filter(prediction => prediction === 1).length;

    // Create point data for SQL Injection detections
    const pointDataSqliAI = { x: currentTimestamp, y: sqliCountAI };
    const pointDataSqliRegex = { x: currentTimestamp, y: sqliCountRegex };
    const pointDataSqliForest = { x: currentTimestamp, y: sqliCountForest };

    // Append new data to existing datasets
    this.lineChartData.datasets[0].data.push(pointDataSqliAI);
    this.lineChartData.datasets[1].data.push(pointDataSqliRegex);
    this.lineChartData.datasets[2].data.push(pointDataSqliForest);


    // Update chart options
    this.lineChartOptions.scales!['x']!.min = moment().valueOf();
    this.lineChartOptions.scales!['x']!.max = moment().add(10, 'minutes').valueOf();

    if (this.chart) {
      this.chart.update();
    }
  }
}
