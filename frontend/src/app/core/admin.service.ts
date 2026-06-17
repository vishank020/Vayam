import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getReports(status: string, page: number = 0, size: number = 20): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reports?status=${status}&page=${page}&size=${size}`);
  }

  resolveReport(id: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/reports/${id}/resolve`, {});
  }

  deletePost(postId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/posts/${postId}`);
  }

  deleteComment(commentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/comments/${commentId}`);
  }

  muteUser(userId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/users/${userId}/mute`, {});
  }

  unmuteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${userId}/mute`);
  }

  searchUsers(query: string, page: number = 0, size: number = 20): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`);
  }
}
