import { AfterViewInit, ChangeDetectorRef, Component, inject, OnInit, Renderer2, ViewChild, PLATFORM_ID, Inject, ElementRef, Directive } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormControl } from '@angular/forms';
import { StockService } from '../../services/stock.service';
import { LensoStock } from '../models/lenso_stock';
import { LensoItem } from '../models/lenso_item';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { LensoPrice } from '../models/lenso_price';
import jsPDF from 'jspdf';
import { MaterialModule } from '../shared/material.module';

@Component({
  selector: 'app-home',
  imports: [MaterialModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  isLoading: boolean = false;
  isLoadingShare: boolean = false;
  isLensoDB: boolean = true;

  @ViewChild('searchbar') searchbar!: ElementRef;
  searchRimText = '';

  fullStockList: LensoStock[] = [];
  fullItemList = new MatTableDataSource<LensoItem>();
  displayedColumns: string[] = ['Image', 'ItemCode', 'Description', 'ItemClass', 'ItemBrand', 'ItemCategory', 'StockQty', 'Cost'];
  isSet: boolean = false;
  showCost: boolean = false;
  showPrice: boolean = false;
  showOOS: boolean = false;
  isMobileView: boolean = true;
  isTabletView: boolean = false;

  selectedSize = new FormControl<string[]>([]);
  selectedPCD = new FormControl<string[]>([]);
  selectedType: string = "all-type";
  selectedSeries: string[] = [];

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
    private cd: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object,
    { nativeElement }: ElementRef<HTMLImageElement>
  ) {
    const supports = 'loading' in HTMLImageElement.prototype;

    if (supports) {
      nativeElement.setAttribute('loading', 'lazy');
    }
  }

  async ngOnInit(): Promise<void> {
    this.isLoadingShare = true;

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
      this.isLoadingShare = false;
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
    this.isLoadingShare = true;
    const width = window.innerWidth;
    this.isMobileView = width <= 600;
    this.isTabletView = width > 600 && width <= 960;
    this.isLoadingShare = false;
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
      if (item.imageExist) this.selectedItems.push(item);
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

    this.selectedItems = [];

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

        this.fetchPriceAndWeight();

        console.log(this.fullItemList.data);
      });
    } catch (error) {
      console.error('Error during filtering:', error);
    } finally {
      this.isLoading = false;
    }
  }

  selectAll() {
    if (this.selectedItems.length > 0) {
      this.selectedItems = [];
      return;
    }

    var itemsToSelect: LensoItem[] = this.filteredItems();
    if (!this.showOOS) itemsToSelect = itemsToSelect.filter((item: LensoItem) => item.StockQty > 0);

    itemsToSelect.forEach((item: LensoItem) => {
      this.selectedItems.push(item);
    });
  }

  async shareSelectedImages() {
    this.isLoadingShare = true;
    const imageFiles: File[] = [];

    for (const item of this.selectedItems) {
      const imageUrl = `https://98j88mtl-3000.asse.devtunnels.ms/images/${item.ItemCode}.png`;

      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();

        const fileName = `${item.ItemCode}.png`;
        const file = new File([blob], fileName, { type: blob.type || 'image/png' });

        imageFiles.push(file);
      } catch (err) {
        console.error('Failed to fetch image:', imageUrl, err);
      }
    }

    if (imageFiles.length > 0 && navigator.canShare && navigator.canShare({ files: imageFiles })) {
      try {
        await navigator.share({
          title: '',
          text: '',
          files: imageFiles,
        });
      } catch (err) {
        console.error('Sharing failed:', err);
      }
    } else {
      alert('Web Share API is not supported or cannot share these files.');
    }

    this.isLoadingShare = false;
  }

  async exportToPDF() {
    this.isLoadingShare = true;
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    const marginX = 4;
    const marginY = 4;
    const gutterX = 4;
    const gutterY = 4;

    const imgWidth = (pageWidth - marginX * 2 - gutterX) / 2;
    const imgHeight = (pageHeight - marginY * 2 - gutterY * 3) / 4;

    let x = marginX;
    let y = marginY;
    let itemsOnPage = 0;

    for (let i = 0; i < this.selectedItems.length; i++) {
      const item = this.selectedItems[i];
      const imgSrc = `https://98j88mtl-3000.asse.devtunnels.ms/images/${item.ItemCode}.png`;

      try {
        const base64Img = await this.getBase64FromUrl(imgSrc);
        doc.addImage(base64Img, 'PNG', x, y, imgWidth, imgHeight);
      } catch (err) {
        console.error('Error loading image for PDF:', item.ItemCode, err);
      }

      if (x === marginX) {
        x += imgWidth + gutterX;
      } else {
        x = marginX;
        y += imgHeight + gutterY;
      }

      itemsOnPage++;

      if (itemsOnPage === 8 && i < this.selectedItems.length - 1) {
        doc.addPage();
        x = marginX;
        y = marginY;
        itemsOnPage = 0;
      }
    }

    const pdfBlob = doc.output('blob');
    const pdfFile = new File([pdfBlob], 'lenso-selected-wheel-catalogue.pdf', { type: 'application/pdf' });

    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      try {
        await navigator.share({
          title: 'Selected Wheels PDF',
          files: [pdfFile],
        });
      } catch (err) {
        console.error('Sharing failed:', err);
      }
    } else {
      const blobUrl = doc.output('bloburl');
      window.open(blobUrl, '_blank');
    }

    this.isLoadingShare = false;
  }

  private async getBase64FromUrl(url: string): Promise<string> {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }

  onImgLoad(event: Event, item: any) {
    item.imageLoaded = true;
    item.imageExist = true;
    if ((event.target as HTMLImageElement).src.includes('image-not-found.png')) {
      item.imageExist = false;
    }
    this.cd.detectChanges();
  }

  onImgError(event: Event, item: any) {
    item.imageLoaded = true;
    (event.target as HTMLImageElement).src = 'assets/image-not-found.png';
    const el = event.target as HTMLElement;
    el.style.userSelect = 'none';
    (el.style as any).webkitUserSelect = 'none';
    (el.style as any).msUserSelect = 'none';
    (el.style as any).MozUserSelect = 'none';
  }
}