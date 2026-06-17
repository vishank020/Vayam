import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProjectResponse {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  techStack: string | null;
  repoUrl: string | null;
  liveUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRequest {
  title: string;
  description?: string | null;
  techStack?: string | null;
  repoUrl?: string | null;
  liveUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getMyProjects(): Observable<ProjectResponse[]> {
    return this.http.get<ProjectResponse[]>(`${this.apiUrl}/me/projects`);
  }

  createProject(request: ProjectRequest): Observable<ProjectResponse> {
    return this.http.post<ProjectResponse>(`${this.apiUrl}/me/projects`, request);
  }

  updateProject(id: string, request: ProjectRequest): Observable<ProjectResponse> {
    return this.http.put<ProjectResponse>(`${this.apiUrl}/me/projects/${id}`, request);
  }

  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/me/projects/${id}`);
  }

  getUserProjects(userId: string): Observable<ProjectResponse[]> {
    return this.http.get<ProjectResponse[]>(`${this.apiUrl}/${userId}/projects`);
  }
}
