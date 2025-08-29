import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class StockService {
    // private domain = "http://localhost:3000";
    private domain = "https://98j88mtl-3000.asse.devtunnels.ms";

    private itemApiUrl = `${this.domain}/api/item`;
    private filteredItemApiUrl = `${this.domain}/api/filtered-item`;
    private stockApiUrl = `${this.domain}/api/stock`;
    private priceApiUrl = `${this.domain}/api/item-price`;

    constructor(private http: HttpClient) { }

    getItemList(isLensoDB?: boolean): Observable<any[]> {
        const dbParam = isLensoDB ? 'lenso' : 'kai_shen';
        const url = `${this.itemApiUrl}?db=${dbParam}`;
        return this.http.get<any[]>(url);
    }

    getStockList(isLensoDB?: boolean): Observable<any[]> {
        const dbParam = isLensoDB ? 'lenso' : 'kai_shen';
        const url = `${this.stockApiUrl}?db=${dbParam}`;
        return this.http.get<any[]>(url);
    }

    getPriceList(isLensoDB?: boolean): Observable<any[]> {
        const dbParam = isLensoDB ? 'lenso' : 'kai_shen';
        const url = `${this.priceApiUrl}?db=${dbParam}`;
        return this.http.get<any[]>(url);
    }

    getFilteredItem(type: string, size: string[], pcd: string[], isLensoDB: boolean) {
        const dbParam = isLensoDB ? 'lenso' : 'kai_shen';
        return this.http.get<any[]>(`${this.filteredItemApiUrl}?db=${dbParam}`, {
            params: {
                type,
                pcd: JSON.stringify(pcd),
                size: JSON.stringify(size)
            }
        });
    }
}
