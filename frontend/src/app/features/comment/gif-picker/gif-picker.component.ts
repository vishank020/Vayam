import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-gif-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="gif-picker-overlay" *ngIf="visible">
      <div class="backdrop" (click)="close()"></div>
      <div class="gif-picker">
        <div class="picker-header">
          <input type="text" [(ngModel)]="searchTerm" (keyup.enter)="search()" placeholder="Search Giphy..." autofocus />
          <button (click)="search()">Search</button>
        </div>
        <div class="gif-grid" *ngIf="gifs.length > 0">
          <img *ngFor="let gif of gifs" [src]="gif.images.fixed_height.url" (click)="selectGif(gif)" alt="gif" />
        </div>
        <div *ngIf="loading" class="gif-grid-skeleton">
          <div class="skeleton skeleton-media" style="height: 100px; margin-bottom: 0;" *ngFor="let _ of [].constructor(4)"></div>
        </div>
        <div *ngIf="!loading && gifs.length === 0 && hasSearched" class="empty">No GIFs found</div>
      </div>
    </div>
  `,
  styles: [`
    .gif-picker-overlay { position: relative; }
    .backdrop { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 1000; }
    .gif-picker { position: absolute; bottom: 100%; right: 0; width: 320px; background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 8px; z-index: 1001; padding: 0.75rem; box-shadow: 0 4px 12px rgba(0,0,0,0.15); margin-bottom: 0.5rem; }
    .picker-header { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; }
    .picker-header input { flex: 1; padding: 0.4rem 0.6rem; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.9rem; background: var(--bg-elevated); color: var(--text-main); }
    .picker-header input:focus { outline: none; border-color: var(--accent-color); }
    .picker-header button { padding: 0.4rem 0.8rem; background: var(--accent-color); color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 500; }
    .gif-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; max-height: 250px; overflow-y: auto; }
    .gif-grid img { width: 100%; height: 100px; object-fit: cover; border-radius: 6px; cursor: pointer; background: var(--bg-hover); transition: opacity 0.1s ease; }
    .gif-grid img:hover { opacity: 0.8; }
    .loading, .empty { text-align: center; padding: 1rem; color: var(--text-muted); font-size: 0.85rem; }
    .gif-grid-skeleton { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
  `]
})
export class GifPickerComponent {
  @Input() visible = false;
  @Output() gifSelected = new EventEmitter<string>();
  @Output() closed = new EventEmitter<void>();

  searchTerm = '';
  gifs: any[] = [];
  loading = false;
  hasSearched = false;

  constructor(private http: HttpClient) {}

  search(): void {
    if (!this.searchTerm.trim()) return;
    this.loading = true;
    this.hasSearched = true;
    const url = `${environment.apiUrl}/gifs/search?q=${encodeURIComponent(this.searchTerm)}`;
    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.gifs = res.data || [];
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  selectGif(gif: any): void {
    this.gifSelected.emit(gif.images.fixed_height.url);
    this.close();
  }

  close(): void {
    this.visible = false;
    this.closed.emit();
  }
}
