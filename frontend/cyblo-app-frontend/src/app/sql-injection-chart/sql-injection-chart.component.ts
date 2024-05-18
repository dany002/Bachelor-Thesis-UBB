import {Component, Input, OnInit} from '@angular/core';
import {ChartData, ChartOptions} from "chart.js";
import {DashboardService} from "../services/dashboard.service";

@Component({
  selector: 'app-sql-injection-chart',
  templateUrl: './sql-injection-chart.component.html',
  styleUrls: ['./sql-injection-chart.component.css']
})
export class SqlInjectionChartComponent implements OnInit{
  @Input() fileIdSQL: string | undefined;

  public lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      { data: [], label: 'SQL Injection Detected' }
    ]
  };

  public lineChartOptions: ChartOptions = {
    responsive: true,
  };

  constructor(private dashboardService: DashboardService) { }

  ngOnInit(): void {
    if (this.fileIdSQL) {
      this.fetchData();
    }
  }

  fetchData(): void {
    if(this.fileIdSQL != undefined){
      this.dashboardService.refreshChartSQLForASpecificFile(this.fileIdSQL).subscribe(
        (response) => {
          console.log(response);
          this.lineChartData.labels = response.timestamps;
          this.lineChartData.datasets[0].data = response.suspicions;
        },
        (error) => {
          console.error('Error fetching data:', error);
        }
      );
    }
  }
}
