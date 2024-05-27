import {Component, Input, OnInit, AfterViewInit, ChangeDetectorRef, OnDestroy} from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { DashboardService } from '../services/dashboard.service';
import 'chartjs-adapter-moment';
import * as moment from 'moment';
import {Log} from "../models/Log";
import {interval, Subscription, switchMap} from "rxjs";

@Component({
  selector: 'app-sql-injection-chart',
  templateUrl: './sql-injection-chart.component.html',
  styleUrls: ['./sql-injection-chart.component.css']
})
export class SqlInjectionChartComponent implements OnInit, OnDestroy {

  @Input() selectedTable: string | undefined;
  @Input() connectionId: string | undefined;
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

    // Create a map of timestamps to predictions
    const dataMap: { [key: string]: number } = {};
    timestamps.forEach((timestamp, index) => {
      const time = moment(timestamp).startOf('minute').toISOString();
      dataMap[time] = predictions[index];
    });

    // Generate data points for the entire day
    const startOfDay = moment().startOf('day');
    const endOfDay = moment().endOf('day');
    const timeSeries: { x: Date, y: number }[] = [];

    for (let time = startOfDay; time <= endOfDay; time.add(1, 'minute')) {
      const timeString = time.toISOString();
      timeSeries.push({
        x: new Date(timeString),
        y: dataMap[timeString] !== undefined ? dataMap[timeString] : 0
      });
    }

    // Ensure existing data arrays are defined and concatenate new data
    this.lineChartData.labels = [
      ...(this.lineChartData.labels || []),
      ...timeSeries.map(point => point.x)
    ];
    this.lineChartData.datasets[0].data = [
      ...(this.lineChartData.datasets[0].data || []),
      ...timeSeries.map(point => point.y)
    ];

    this.cdr.detectChanges();
  }

}
