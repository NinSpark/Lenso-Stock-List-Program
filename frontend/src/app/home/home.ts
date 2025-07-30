import { AfterViewInit, ChangeDetectorRef, Component, inject, OnInit, Renderer2, ViewChild, PLATFORM_ID, Inject, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { lastValueFrom } from 'rxjs';
import { MatExpansionModule } from '@angular/material/expansion';
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
import { MatCardModule } from '@angular/material/card';
import { LensoPrice } from '../models/lenso_price';

@Component({
  selector: 'app-home',
  imports: [CommonModule, MatDatepickerModule, MatSelectModule, MatFormFieldModule, MatSelectModule, FormsModule, ReactiveFormsModule, MatButtonModule, MatDividerModule, MatIconModule, MatMenuModule, MatIconModule, MatSlideToggleModule, MatCheckboxModule, MatTableModule, MatSortModule, MatInputModule, MatProgressSpinner, MatCardModule, MatExpansionModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  isLoading: boolean = false;
  isLensoDB: boolean = true;

  @ViewChild('searchbar') searchbar!: ElementRef;
  searchRimText = '';

  fullStockList: LensoStock[] = [];
  fullItemList = new MatTableDataSource<LensoItem>();
  displayedColumns: string[] = ['Image', 'ItemCode', 'Description', 'ItemClass', 'ItemBrand', 'ItemCategory', 'StockQty', 'Cost'];
  isSet: boolean = false;
  showCost: boolean = false;
  showPrice: boolean = false;
  showOOS: boolean = true;
  isMobileView: boolean = true;
  isTabletView: boolean = false;

  selectedSize = new FormControl<string[]>([]);
  selectedPCD = new FormControl<string[]>([]);
  selectedType: string = "all-type";
  selectedSeries: string[] = [];

  imageUrlMap: { [itemCode: string]: string } = {};
  loadingMap: { [itemCode: string]: boolean } = {};
  selectedItems: LensoItem[] = [];

  sizeList: any[] = [
    { name: '15"', value: '15' },
    { name: '16"', value: '16' },
    { name: '17"', value: '17' },
    { name: '18"', value: '18' },
    { name: '19"', value: '19' },
    { name: '20"', value: '20' }
  ];

  pcdList: any[] = [
    { name: '4-100', value: '4-100' },
    { name: '4-108', value: '4-108' },
    { name: '4(100/114.3)', value: '4(100/114.3)' },
    { name: '5-100', value: '5-100' },
    { name: '5-108', value: '5-108' },
    { name: '5-112', value: '5-112' },
    { name: '5-114.3', value: '5-114.3' },
    { name: '5-120', value: '5-120' },
    { name: '5-139.7', value: '5-139.7' },
    { name: '6-114.3', value: '6-114.3' },
    { name: '6-139.7', value: '6-139.7' }
  ];

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
    private cdRef: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  async ngOnInit(): Promise<void> {
    this.isLoading = true;

    if (isPlatformBrowser(this.platformId)) {
      this.checkScreen();
      window.addEventListener('resize', this.checkScreen.bind(this));
    }

    this.updateDisplayedColumns();
    this.initializeFilter();

    try {
      await this.fetchItems();
    } catch (error) {
      console.error('Error during initialization:', error);
    } finally {
      this.isLoading = false;
    }
  }

  filteredItems() {
    if (!this.searchRimText) return this.fullItemList.data;

    const lowerSearch = this.searchRimText.toLowerCase();

    return this.fullItemList.data.filter(item =>
      item.ItemCode?.toLowerCase().includes(lowerSearch) ||
      item.Description?.toLowerCase().includes(lowerSearch)
    );
  }

  filteredItemsTable() {
    if (!this.searchRimText) return this.fullItemList;

    const lowerSearch = this.searchRimText.toLowerCase();
    var filteredItemList = new MatTableDataSource<LensoItem>();

    filteredItemList.data = this.fullItemList.data.filter(item =>
      item.ItemCode?.toLowerCase().includes(lowerSearch) ||
      item.Description?.toLowerCase().includes(lowerSearch)
    );

    return filteredItemList;
  }

  checkScreen() {
    const width = window.innerWidth;
    this.isMobileView = width <= 600;
    this.isTabletView = width > 600 && width <= 960;
  }

  resetFilters(): void {
    this.selectedType = 'all-type';
    this.selectedSize.setValue(['all-size', ...this.sizeList.map(size => size.value)]);
    this.selectedPCD.setValue(['all-pcd', ...this.pcdList.map(pcd => pcd.value)]);
    this.showCost = false;
    this.showPrice = false;
    this.isSet = false;
    this.showOOS = false;

    this.applyFilter();
  }

  toggleCard(item: LensoItem) {
    const index = this.selectedItems.indexOf(item);
    if (index >= 0) {
      this.selectedItems.splice(index, 1);
    } else {
      this.selectedItems.push(item);
    }
  }

  isSelected(item: LensoItem): boolean {
    return this.selectedItems.includes(item);
  }

  updateDisplayedColumns() {
    this.displayedColumns = ['Image', 'ItemCode', 'Description', 'ItemClass', 'ItemBrand', 'ItemCategory', 'StockQty'];
    if (this.showCost) {
      this.displayedColumns.push('Cost');
    }
    if (this.showPrice) {
      this.displayedColumns.push('Price');
    }
  }

  async fetchItems(): Promise<void> {
    try {
      this.stockService.getItemList(this.isLensoDB).subscribe((data: LensoItem[]) => {
        this.fullItemList.data = data;

        if (isPlatformBrowser(this.platformId)) {
          this.generateBlobUrls(data);
        }

        this.fetchPriceAndWeight();
      });
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  }

  async fetchPriceAndWeight(): Promise<void> {
    try {
      this.stockService.getPriceList(this.isLensoDB).subscribe((data: LensoPrice[]) => {
        this.fullItemList.data.forEach((item: LensoItem) => {
          let price = data.find((itemPrice) => itemPrice.ItemCode == item.ItemCode)?.Price;
          if (price) {
            item.Price = price;
          }
          else {
            item.Price = -1;
          }

          let weight = data.find((itemWeight) => itemWeight.ItemCode == item.ItemCode)?.Weight;
          if (weight) {
            item.Weight = weight;
          }
          else {
            item.Weight = -1;
          }
        });

        this.fetchStocks();
      });
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  }

  async fetchStocks(): Promise<void> {
    try {
      this.stockService.getStockList(this.isLensoDB).subscribe((data: LensoStock[]) => {
        this.fullStockList = data;

        this.fullItemList.data.forEach((item: LensoItem) => {
          item.StockQty = 0;
          item.Cost = 0;

          let currentItemList = this.fullStockList.filter((stock: LensoStock) => stock.ItemCode === item.ItemCode);
          currentItemList.forEach((currentItem) => {
            item.StockQty += currentItem.Qty;
          });

          if (currentItemList.length > 0) {
            item.Cost = currentItemList[0].Cost;
          }
        });
      });
    } catch (error) {
      console.error('Error fetching stocks:', error);
    }
  }

  initializeFilter() {
    this.selectedSize.setValue(['all-size', ...this.sizeList.map(size => size.value)]);
    this.selectedPCD.setValue(['all-pcd', ...this.pcdList.map(pcd => pcd.value)]);
  }

  calculateSet(value: number): number {
    return Math.floor(value / 4);
  }

  inStockCount() {
    return this.filteredItems().filter(item => item.StockQty > 0).length;
  }

  toggleAllSize(event: any) {
    if (event._selected) {
      this.selectedSize.setValue(this.sizeList.map(size => size.value));
      event._selected = true;
    }
    else {
      this.selectedSize.setValue([]);
    }
  }

  getSelectedSizeText(): string {
    const values: string[] = this.selectedSize.value || [];
    const actualValues = values.filter(v => v !== 'all-size');

    if (actualValues.length === this.sizeList.length) {
      return 'All Sizes';
    }

    return this.sizeList
      .filter(size => actualValues.includes(size.value))
      .map(size => size.name)
      .join(', ');
  }

  toggleAllPCD(event: any) {
    if (event._selected) {
      this.selectedPCD.setValue(this.pcdList.map(pcd => pcd.value));
      event._selected = true;
    }
    else {
      this.selectedPCD.setValue([]);
    }
  }

  getSelectedPCDText(): string {
    const values: string[] = this.selectedPCD.value || [];
    const actualValues = values.filter(v => v !== 'all-pcd');

    if (actualValues.length === this.pcdList.length) {
      return 'All PCDs';
    }

    return this.pcdList
      .filter(pcd => actualValues.includes(pcd.value))
      .map(pcd => pcd.name)
      .join(', ');
  }

  async applyFilter() {
    this.isLoading = true;
    let selectedSizes: string[] = this.selectedSize.value || [];
    let selectedPCDs: string[] = this.selectedPCD.value || [];
    let selectedType: string = this.selectedType;

    const pcdIndex = selectedPCDs.indexOf("all-pcd");
    if (pcdIndex > -1) {
      selectedPCDs.splice(pcdIndex, 1);
    }
    const sizeIndex = selectedSizes.indexOf("all-size");
    if (sizeIndex > -1) {
      selectedSizes.splice(sizeIndex, 1);
    }

    try {
      this.stockService.getFilteredItem(selectedType, selectedSizes, selectedPCDs, this.isLensoDB).subscribe((data: LensoItem[]) => {
        this.fullItemList.data = data;

        if (isPlatformBrowser(this.platformId)) {
          this.generateBlobUrls(data);
        }

        this.fetchPriceAndWeight();

        console.log(this.fullItemList.data);
      });
    } catch (error) {
      console.error('Error during filtering:', error);
    } finally {
      this.isLoading = false;
    }
  }

  generateBlobUrls(data: LensoItem[]) {
    for (const url of Object.values(this.imageUrlMap || {})) {
      URL.revokeObjectURL(url);
    }

    this.imageUrlMap = {};
    data.forEach(item => {
      if (item.Image && item.Image.data && Array.isArray(item.Image.data)) {
        const byteArray = new Uint8Array(item.Image.data);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });
        const url = URL.createObjectURL(blob);
        this.imageUrlMap[item.ItemCode] = url;
      }
    });
  }

  onImageLoad(itemCode: string) {
    this.loadingMap[itemCode] = false;
  }

  onImageError(itemCode: string) {
    this.loadingMap[itemCode] = false;
  }

  async shareSelectedImages() {
    console.log(!navigator.canShare)
    console.log(!navigator.canShare({ files: [] }))
    if (!navigator.canShare || !navigator.canShare({ files: [] })) {
      alert("Sharing images is not supported on this device.");
      return;
    }

    const files: File[] = this.selectedItems.map((item, index) =>
      this.convertImageToFile(item.Image, `${item.ItemCode}.png`)
    );
    console.log('Can share files:', navigator.canShare({ files }));

    try {
      await navigator.share({
        title: 'Check out these wheels!',
        files,
        text: 'Here are some rims you might like.',
      });
    } catch (err) {
      console.error('Sharing failed:', err);
    }
  }

  convertImageToFile(imageObj: { type: string; data: number[] }, filename: string): File {
    const byteArray = new Uint8Array(imageObj.data);
    const blob = new Blob([byteArray], { type: imageObj.type });
    return new File([blob], filename, { type: imageObj.type });
  }
}