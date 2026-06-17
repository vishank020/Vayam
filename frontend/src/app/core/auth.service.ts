import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { catchError, map, tap, switchMap } from 'rxjs/operators';
import { UserResponse } from './user.service';
import { environment } from '../../environments/environment';

// WHY: JWT tokens are stored in HttpOnly cookies (set by the backend).
// The frontend never touches tokens directly — it relies on the /api/auth/me
// endpoint to check authentication state. This prevents XSS token theft.

export interface AuthResponse {
  userId: string;
  username: string;
  role: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  displayName?: string;
  acceptedTerms: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  userId?: string;
  username?: string;
  role?: string;
  requires2fa: boolean;
  tempToken?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  
  public currentUserSubject = new BehaviorSubject<UserResponse | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private cachedUser: UserResponse | null = null;
  private cacheTimestamp = 0;
  private readonly CACHE_TTL_MS = 30_000;

  private _accessToken: string | null = null;
  private accessTokenFetching = false;

  constructor(private http: HttpClient, private router: Router) {}

  private clearCache(): void {
    this.cachedUser = null;
    this.cacheTimestamp = 0;
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, request).pipe(
      switchMap(response => {
        this.clearCache();
        return this.checkAuth().pipe(map(() => response));
      })
    );
  }

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, request).pipe(
      switchMap(response => {
        if (response.requires2fa) {
          return of(response);
        }
        this.clearCache();
        return this.checkAuth().pipe(map(() => response));
      })
    );
  }

  verifyLogin(tempToken: string, code: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login/verify`, { tempToken, code }).pipe(
      switchMap(response => {
        this.clearCache();
        return this.checkAuth().pipe(map(() => response));
      })
    );
  }

  generate2fa(): Observable<{ qrCodeImage: string, secret: string }> {
    return this.http.get<{ qrCodeImage: string, secret: string }>(`${this.apiUrl}/2fa/generate`);
  }

  enable2fa(code: string, secret: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/2fa/enable`, { code, secret });
  }

  disable2fa(code: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/2fa/disable`, { code, secret: '' });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/password`, { currentPassword, newPassword }, { withCredentials: true });
  }

  changeUsername(currentPassword: string, newUsername: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/username`, { currentPassword, newUsername }, { withCredentials: true });
  }

  changeEmail(currentPassword: string, newEmail: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/email`, { currentPassword, newEmail }, { withCredentials: true });
  }

  // WHY: Calls /api/auth/me which reads the JWT from the HttpOnly cookie
  // and returns the user profile. This is how the frontend checks if
  // the user is authenticated without accessing tokens directly.
  // Results are cached in-memory for 30 seconds to avoid redundant calls
  // on guarded route navigations.
  checkAuth(): Observable<UserResponse | null> {
    const now = Date.now();
    if (this.cachedUser !== null && (now - this.cacheTimestamp) < this.CACHE_TTL_MS) {
      return of(this.cachedUser);
    }

    return this.http.get<UserResponse>(`${this.apiUrl}/me`).pipe(
      tap(user => {
        this.cachedUser = user;
        this.cacheTimestamp = Date.now();
        this.currentUserSubject.next(user);
      }),
      catchError(() => {
        this.clearCache();
        this.currentUserSubject.next(null);
        return of(null);
      })
    );
  }

  isLoggedIn(): Observable<boolean> {
    return this.checkAuth().pipe(map(user => user !== null));
  }

  getAccessToken(): Observable<string | null> {
    if (this._accessToken) {
      return of(this._accessToken);
    }
    if (this.accessTokenFetching) {
      return of(null);
    }
    this.accessTokenFetching = true;
    return this.http.get<{ token: string }>(`${this.apiUrl}/token`).pipe(
      tap(res => this._accessToken = res.token),
      map(res => res.token),
      catchError(() => {
        this._accessToken = null;
        return of(null);
      }),
      tap(() => this.accessTokenFetching = false)
    );
  }

  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/reset-password`, { token, newPassword });
  }

  verifyEmail(token: string): Observable<void> {
    return this.http.get<void>(`${this.apiUrl}/verify-email`, { params: { token } });
  }

  logout(): void {
    this._accessToken = null;
    this.clearCache();
    this.http.post<void>(`${this.apiUrl}/logout`, {}).subscribe({
      next: () => {
        this.currentUserSubject.next(null);
        this.router.navigate(['/login']);
      },
      error: () => {
        this.currentUserSubject.next(null);
        this.router.navigate(['/login']);
      }
    });
  }
}
