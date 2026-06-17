import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject, Observable, fromEvent, of } from 'rxjs';
import { map, startWith, distinctUntilChanged } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  isMobile$: Observable<boolean>;

  private openSubject = new Subject<boolean>();
  open$ = this.openSubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      this.isMobile$ = fromEvent(window, 'resize').pipe(
        map(() => window.innerWidth <= 767),
        startWith(window.innerWidth <= 767),
        distinctUntilChanged()
      );
    } else {
      this.isMobile$ = of(false);
    }
  }

  toggle(): void {
    this.openSubject.next(true);
  }

  close(): void {
    this.openSubject.next(false);
  }
}
