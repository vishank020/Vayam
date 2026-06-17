import { Injectable } from '@angular/core';
import { Subject, switchMap, take } from 'rxjs';
import { AuthService } from './auth.service';
import { SettingsService } from './settings.service';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private themeChanged = new Subject<string>();
  themeChanged$ = this.themeChanged.asObservable();

  constructor(
    private authService: AuthService,
    private settingsService: SettingsService
  ) {}

  applyTheme(theme: string): void {
    if (theme === 'system') {
      const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
      document.body.classList.toggle('light-theme', prefersLight);
    } else {
      document.body.classList.toggle('light-theme', theme === 'light');
    }
    localStorage.setItem('cc-theme', theme);
    this.themeChanged.next(theme);
  }

  toggleTheme(): void {
    const isLight = document.body.classList.contains('light-theme');
    const theme = isLight ? 'dark' : 'light';
    this.applyTheme(theme);
    this.authService.currentUser$.pipe(
      take(1),
      switchMap(user => {
        if (user) {
          return this.settingsService.updateSettings({ theme });
        }
        return [];
      })
    ).subscribe();
  }
}
