import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserSettingsResponse {
  theme: string;
  accentColor: string;
  notifyComments: boolean;
  notifyReplies: boolean;
  notifyMentions: boolean;
  notifyFollows: boolean;
  notifySystem: boolean;
  showEmail: boolean;
  showWebsite: boolean;
  showLocation: boolean;
  allowDiscovery: boolean;
  allowFollowRequests: boolean;
  anonymousBrowsing: boolean;
}

export type UpdateSettingsRequest = Partial<UserSettingsResponse>;

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private apiUrl = `${environment.apiUrl}/settings`;

  constructor(private http: HttpClient) {}

  getSettings(): Observable<UserSettingsResponse> {
    return this.http.get<UserSettingsResponse>(this.apiUrl);
  }

  updateSettings(settings: UpdateSettingsRequest): Observable<UserSettingsResponse> {
    return this.http.put<UserSettingsResponse>(this.apiUrl, settings);
  }
}
