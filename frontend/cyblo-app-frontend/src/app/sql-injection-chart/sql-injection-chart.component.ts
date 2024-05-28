import {
  Component,
  Input,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef,
  OnDestroy,
  ViewChild,
  OnChanges, SimpleChanges
} from '@angular/core';
import {Chart, ChartData, ChartOptions, registerables, ScatterDataPoint, TooltipItem} from 'chart.js';
import { DashboardService } from '../services/dashboard.service';
import 'chartjs-adapter-moment';
import { BaseChartDirective } from 'ng2-charts';
import * as moment from 'moment';
import {Log} from "../models/Log";
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

  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

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

  public lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        data: [], // For detections labeled as 1
        label: 'SQL Injection Detection (1)',
        borderColor: 'red',
        backgroundColor: 'rgba(255, 0, 0, 0.3)',
        borderWidth: 3,
        fill: true
      },
      {
        data: [], // For detections labeled as 0
        label: 'SQL Injection Detection (0)',
        borderColor: 'green',
        backgroundColor: 'rgba(0, 255, 0, 0.3)',
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
        // beginAtZero: true,
        min: -1,
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
            const dataset = context.datasetIndex === 0 ? this.lineChartData.datasets[0] : this.lineChartData.datasets[1];
            const dataPoint = (dataset.data as ScatterDataPoint[])[index];
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedOption'] && !changes['selectedOption'].firstChange) {
      this.renderChart();
    }
  }

  renderChart(): void {
    // Clear existing data
    this.lineChartData.labels = [];
    this.lineChartData.datasets[0].data = [];
    this.lineChartData.datasets[1].data = [];

    // Reset offset
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
    this.subscription = interval(10000)
      .pipe(
        take(9),
        switchMap(() => {
          if (this.selectedOption === 'AI') {
            return this.dataFetchService.fetchRecordsForAISQL(this.selectedTable!, this.offset, this.connectionId!);
          } else if (this.selectedOption === 'Regex') {
            return this.dataFetchService.fetchRecordsForRegexSQL(this.selectedTable!, this.offset, this.connectionId!);
          } else {
            throw new Error('Invalid selected option');
          }
        })
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
      dataMap[time] = { y: predictions[index], query: queries[index] };
    });

    // Use the first log's timestamp as the start time
    const startTime = timestamps.length > 0 ? moment(timestamps[0]).startOf('minute') : moment().startOf('minute');
    const endTime = moment();

    const newTimeSeries1: { x: number, y: number, query: string }[] = []; // For detections labeled as 1
    const newTimeSeries0: { x: number, y: number, query: string }[] = []; // For detections labeled as 0
    const newTimeSeriesMinus1: { x: number, y: number, query: string }[] = []; // For detections labeled as -1

    // Preserve existing data
    const existingData1 = this.lineChartData.datasets[0].data as { x: number, y: number, query: string }[];
    const existingData0 = this.lineChartData.datasets[1].data as { x: number, y: number, query: string }[];
    const existingDataMinus1 = existingData0.filter(data => data.y === -1);
    const existingData0Only = existingData0.filter(data => data.y === 0);

    newTimeSeries1.push(...existingData1);
    newTimeSeries0.push(...existingData0Only);
    newTimeSeriesMinus1.push(...existingDataMinus1);

    for (let time = startTime; time <= endTime; time.add(1, 'minute')) {
      const timeString = time.toISOString();
      if (dataMap[timeString] !== undefined) {
        if (dataMap[timeString].y === 1) {
          newTimeSeries1.push({
            x: time.valueOf(),
            y: 1,
            query: dataMap[timeString].query
          });
        } else if (dataMap[timeString].y === 0) {
          newTimeSeriesMinus1.push({
            x: time.valueOf(),
            y: -1,
            query: dataMap[timeString].query
          });
        }
      } else {
        newTimeSeries0.push({
          x: time.valueOf(),
          y: 0,
          query: ''
        });
      }
    }

    // Concatenate and sort data to ensure correct order by timestamp
    const combinedNewTimeSeries0 = newTimeSeries0.concat(newTimeSeriesMinus1).sort((a, b) => a.x - b.x);

    // Update chart data
    this.lineChartData.datasets[0].data = newTimeSeries1;
    this.lineChartData.datasets[1].data = combinedNewTimeSeries0;

    this.cdr.detectChanges();
    if (this.chart) {
      this.chart.update();
    }
  }




  // updateChartData(records: any[]): void {
  //   const timestamps = records.map(record => new Date(record.timestamp));
  //   const predictions = records.map(record => record.prediction);
  //   const queries = records.map(record => record.query);
  //
  //   // Create a map of timestamps to predictions and queries
  //   const dataMap: { [key: string]: { y: number, query: string } } = {};
  //   timestamps.forEach((timestamp, index) => {
  //     const time = moment(timestamp).startOf('minute').toISOString();
  //     dataMap[time] = {y: predictions[index], query: queries[index]};
  //   });
  //
  //   // Use the first log's timestamp as the start time
  //   const startTime = timestamps.length > 0 ? moment(timestamps[0]).startOf('minute') : moment().startOf('minute');
  //   const endTime = moment();
  //
  //   const newTimeSeries: { x: number, y: number, query: string }[] = [];
  //
  //   for (let time = startTime; time <= endTime; time.add(1, 'minute')) {
  //     const timeString = time.toISOString();
  //     newTimeSeries.push({
  //       x: time.valueOf(),
  //       y: dataMap[timeString] !== undefined ? dataMap[timeString].y : 0,
  //       query: dataMap[timeString] !== undefined ? dataMap[timeString].query : ''
  //     });
  //   }
  //
  //   // Append new data to the existing data
  //   const existingData = this.lineChartData.datasets[0].data as { x: number, y: number, query: string }[];
  //   const combinedData = [...existingData, ...newTimeSeries];
  //
  //   // Sort the combined data by timestamp to maintain chronological order
  //   combinedData.sort((a, b) => a.x - b.x);
  //
  //   // Update chart data
  //   this.lineChartData.labels = combinedData.map(point => point.x);
  //   this.lineChartData.datasets[0].data = combinedData;
  //
  //   this.cdr.detectChanges();
  //   if (this.chart) {
  //     this.chart.update();
  //   }
  // }

}
