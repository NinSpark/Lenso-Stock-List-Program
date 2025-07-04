import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class StockService {
    private domain = "http://localhost:3000";
    // private domain = "https://glm84bs6-3000.asse.devtunnels.ms";

    private itemApiUrl = `${this.domain}/api/item`;
    private stockApiUrl = `${this.domain}/api/stock`;

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
}
