import { AfterViewInit, ChangeDetectorRef, Component, inject, OnInit, Renderer2, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { lastValueFrom } from 'rxjs';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StockService } from '../../services/stock.service';
import { LensoStock } from '../models/lenso_stock';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { LensoItem } from '../models/lenso_item';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-home',
  imports: [CommonModule, MatDatepickerModule, MatSelectModule, MatFormFieldModule, MatSelectModule, FormsModule, ReactiveFormsModule, MatButtonModule, MatDividerModule, MatIconModule, MatMenuModule, MatIconModule, MatSlideToggleModule, MatCheckboxModule, MatTableModule, MatSortModule, MatInputModule, MatProgressSpinner],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  isLoading: boolean = false;
  isLensoDB: boolean = true;

  fullStockList: LensoStock[] = [];
  fullItemList = new MatTableDataSource<LensoItem>();
  displayedColumns: string[] = ['ItemCode', 'Description', 'StockQty', 'Cost'];
  isSet: boolean = false;
  showCost: boolean = false;

  private _sort!: MatSort;

  @ViewChild(MatSort)
  set matSort(sort: MatSort) {
    this._sort = sort;
    if (this.fullItemList) {
      this.fullItemList.sort = sort;
    }
  }

  constructor(
    private stockService: StockService,
    private router: Router,
    private renderer: Renderer2,
    private cdRef: ChangeDetectorRef
  ) { }

  async ngOnInit(): Promise<void> {
    this.isLoading = true;
    this.updateDisplayedColumns();

    try {
      await this.fetchItems();
    } catch (error) {
      console.error('Error during initialization:', error);
    } finally {
      this.isLoading = false;
    }
  }

  updateDisplayedColumns() {
    this.displayedColumns = ['ItemCode', 'Description', 'StockQty'];
    if (this.showCost) {
      this.displayedColumns.push('Cost');
    }
  }

  async fetchItems(): Promise<void> {
    try {
      this.stockService.getItemList(this.isLensoDB).subscribe((data: LensoItem[]) => {
        this.fullItemList.data = data;

        this.fetchStocks();
      });
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  }

  async fetchStocks(): Promise<void> {
    try {
      this.stockService.getStockList(this.isLensoDB).subscribe((data: LensoStock[]) => {
        this.fullStockList = data;

        this.fullItemList.data.forEach((item: LensoItem) => {
          item.StockQty = 0;
          item.Cost = 0;

          const match = this.fullStockList.find((stock: LensoStock) => stock.ItemCode === item.ItemCode);
          if (match) {
            item.StockQty = match.Qty;
            item.Cost = match.Cost;
          }
        });
      });
    } catch (error) {
      console.error('Error fetching stocks:', error);
    }
  }

  changeUOM() {
    if (!this.isSet) {
      this.fullItemList.data.forEach((item: LensoItem) => {
        item.StockQty = item.StockQty * 4;
        item.Cost = item.Cost * 4;
      });
    }
    else {
      this.fullItemList.data.forEach((item: LensoItem) => {
        item.StockQty = item.StockQty / 4;
        item.Cost = item.Cost / 4;
      });
    }
  }

  roundDown(value: number): number {
    return Math.floor(value);
  }
}