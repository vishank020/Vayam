import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AnonymousSession {
  id: string;
  sessionToken: string;
  displayName: string;
}

export interface AnonymousIdentity {
  id: string;
  displayName: string;
  createdAt: string;
}

const STORAGE_KEY = 'anonymous_token';

@Injectable({ providedIn: 'root' })
export class AnonymousService {
  private apiUrl = `${environment.apiUrl}/anonymous`;
  private sessionSubject = new BehaviorSubject<AnonymousSession | null>(null);
  session$ = this.sessionSubject.asObservable();

  constructor(private http: HttpClient) {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const session: AnonymousSession = JSON.parse(stored);
      this.sessionSubject.next(session);
      // verify session is still valid
      this.getIdentity(session.sessionToken).subscribe({
        error: () => {
          localStorage.removeItem(STORAGE_KEY);
          this.sessionSubject.next(null);
        }
      });
    }
  }

  get currentToken(): string | null {
    return this.sessionSubject.value?.sessionToken ?? null;
  }

  get currentSession(): AnonymousSession | null {
    return this.sessionSubject.value;
  }

  createSession(): Observable<AnonymousSession> {
    return this.http.post<AnonymousSession>(`${this.apiUrl}/session`, {}).pipe(
      tap(session => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        this.sessionSubject.next(session);
      })
    );
  }

  getIdentity(token: string): Observable<AnonymousIdentity> {
    return this.http.get<AnonymousIdentity>(`${this.apiUrl}/me`, {
      headers: new HttpHeaders({ 'X-Anonymous-Token': token })
    });
  }

  exitAnonymousMode(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.sessionSubject.next(null);
  }

  authHeaders(): HttpHeaders {
    const token = this.currentToken;
    return token ? new HttpHeaders({ 'X-Anonymous-Token': token }) : new HttpHeaders();
  }

  get isAnonymous(): boolean {
    return this.currentToken !== null;
  }
}
