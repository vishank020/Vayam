import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FollowResponse {
  id: string;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface FollowCountResponse {
  followersCount: number;
  followingCount: number;
}

@Injectable({ providedIn: 'root' })
export class FollowService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  follow(userId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${userId}/follow`, {});
  }

  unfollow(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}/follow`);
  }

  getFollowers(userId: string, page: number = 0, size: number = 20): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${userId}/followers?page=${page}&size=${size}`);
  }

  getFollowing(userId: string, page: number = 0, size: number = 20): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${userId}/following?page=${page}&size=${size}`);
  }

  getFollowCounts(userId: string): Observable<FollowCountResponse> {
    return this.http.get<FollowCountResponse>(`${this.apiUrl}/${userId}/follow-counts`);
  }

  isFollowing(userId: string): Observable<{ isFollowing: boolean }> {
    return this.http.get<{ isFollowing: boolean }>(`${this.apiUrl}/${userId}/is-following`);
  }
}
