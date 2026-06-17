import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SearchResult {
  id: string;
  type: 'POST' | 'COMMUNITY' | 'USER';
  title: string;
  description: string;
  url: string;
  avatarUrl: string | null;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private apiUrl = `${environment.apiUrl}/search`;

  constructor(private http: HttpClient) {}

  search(q: string, type = 'all', page = 0, size = 20): Observable<SearchResponse> {
    return this.http.get<SearchResponse>(`${this.apiUrl}?q=${encodeURIComponent(q)}&type=${type}&page=${page}&size=${size}`);
  }
}
