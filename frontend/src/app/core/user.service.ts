import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserResponse {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  coverUrl: string;
  website?: string;
  location?: string;
  publicKey: string;
  role: string;
  createdAt: string;
  followerCount: number;
  followingCount: number;
  postCount: number;
  commentCount: number;
  isFollowing: boolean | null;
  isTotpEnabled: boolean;
  isMuted?: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getMyProfile(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/me`);
  }

  updateProfile(data: Partial<UserResponse>): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.apiUrl}/me`, data);
  }

  deleteAvatar(): Observable<UserResponse> {
    return this.http.delete<UserResponse>(`${this.apiUrl}/me/avatar`);
  }

  updatePublicKey(publicKey: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/me/public-key`, { publicKey });
  }

  getUserById(id: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/${id}`);
  }

  getUserByUsername(username: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/by-username/${username}`);
  }

  blockUser(userId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${userId}/block`, {});
  }

  unblockUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}/block`);
  }

  muteUser(userId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${userId}/mute`, {});
  }

  unmuteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}/mute`);
  }

  getBlockedUsers(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/me/blocked`);
  }

  reportUser(userId: string, reason: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${userId}/report`, { reason });
  }

  searchUsers(query: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/search?q=${encodeURIComponent(query)}`);
  }
}
