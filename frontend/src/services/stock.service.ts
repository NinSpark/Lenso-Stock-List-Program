import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class StockService {
    // private domain = "http://localhost:3000";
    private domain = "https://mcq5cp7n-3002.asse.devtunnels.ms";

    private itemPCDUrl = `${this.domain}/api/item-category`;
    private filteredItemApiUrl = `${this.domain}/api/filtered-item`;
    private getSecuredLoginUrl = `${this.domain}/secured-sales-login`;

    constructor(private http: HttpClient) { }

    getSecuredLoginDetails(username: string, password: string) {
        const body = { username, password };
        return this.http.post<any>(this.getSecuredLoginUrl, body);
    }

    getPCDList(): Observable<any[]> {
        const url = `${this.itemPCDUrl}?db=lenso`;
        return this.http.get<any[]>(url);
    }

    getFilteredItem(type: string, size: string[], pcd: string[], isLensoDB: boolean, search?: string) {
        const dbParam = isLensoDB ? 'lenso' : 'kai_shen';

        let params: any = {
            type,
            pcd: JSON.stringify(pcd),
            size: JSON.stringify(size),
        };

        if (search && search.trim() !== '') {
            params.search = search;
        }

        return this.http.get<any[]>(`${this.filteredItemApiUrl}?db=${dbParam}`, {
            params
        });
    }
}
