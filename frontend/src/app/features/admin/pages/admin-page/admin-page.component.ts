import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/admin.service';
import { ToastService } from '../../../../core/toast.service';
import { AdminSkeletonComponent } from '../../../../shared/components/admin-skeleton.component';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSkeletonComponent],
  template: `
    <div class="admin-container">
      <div class="admin-header">
        <h1>Admin Panel</h1>
        <nav class="admin-tabs">
          <button [class.active]="activeTab === 'reports'" (click)="activeTab = 'reports'; loadReports()">Reports Queue</button>
          <button [class.active]="activeTab === 'users'" (click)="activeTab = 'users'">User Lookup</button>
        </nav>
      </div>

      <!-- Reports Queue Tab -->
      <div class="tab-content" *ngIf="activeTab === 'reports'">
        <div class="filter-bar">
          <button class="filter-btn" [class.active]="reportFilter === 'OPEN'" (click)="reportFilter = 'OPEN'; loadReports()">Open</button>
          <button class="filter-btn" [class.active]="reportFilter === 'RESOLVED'" (click)="reportFilter = 'RESOLVED'; loadReports()">Resolved</button>
        </div>

        <app-admin-skeleton *ngIf="reportsLoading"></app-admin-skeleton>

        <div class="table-wrapper" *ngIf="!reportsLoading && reports.length > 0">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Reporter</th>
                <th>Reported User</th>
                <th>Reason</th>
                <th>Post</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let report of reports">
                <td>{{ report.reporter?.username || '-' }}</td>
                <td>{{ report.reportedUser?.username || '-' }}</td>
                <td class="reason-cell">{{ report.reason }}</td>
                <td>{{ report.reportedPost?.title || '-' }}</td>
                <td class="date-cell">{{ report.createdAt | date:'short' }}</td>
                <td>
                  <button class="btn-resolve" *ngIf="report.status === 'OPEN'" (click)="resolveReport(report)" [disabled]="resolvingId === report.id">
                    {{ resolvingId === report.id ? 'Resolving...' : 'Resolve' }}
                  </button>
                  <span class="resolved-badge" *ngIf="report.status !== 'OPEN'">Resolved</span>
                </td>
              </tr>
            </tbody>
          </table>
          <button class="btn-load-more" *ngIf="reports.length < reportsTotal" (click)="loadMoreReports()">Load More</button>
        </div>

        <div *ngIf="!reportsLoading && reports.length === 0" class="empty-state">
          <p>No {{ reportFilter.toLowerCase() }} reports.</p>
        </div>
      </div>

      <!-- User Lookup Tab -->
      <div class="tab-content" *ngIf="activeTab === 'users'">
        <div class="search-bar">
          <input type="text" [(ngModel)]="userQuery" placeholder="Search by username..." class="search-input" (keydown.enter)="searchUsers()" />
          <button class="btn-search" (click)="searchUsers()" [disabled]="!userQuery.trim()">Search</button>
        </div>

        <app-admin-skeleton *ngIf="usersLoading"></app-admin-skeleton>

        <div class="table-wrapper" *ngIf="!usersLoading && users.length > 0">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Display Name</th>
                <th>Role</th>
                <th>Open Reports</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of users">
                <td>{{ user.username }}</td>
                <td>{{ user.displayName }}</td>
                <td><span class="role-tag" [class.admin]="user.role === 'ADMIN'">{{ user.role }}</span></td>
                <td>{{ user.openReportCount }}</td>
                <td>
                  <button class="btn-action" (click)="viewUserReports(user)">
                    View Reports
                  </button>
                  <button class="btn-action" [class.muted]="user._muted" (click)="toggleMuteUser(user)" [disabled]="mutingId === user.id">
                    {{ mutingId === user.id ? '...' : (user._muted ? 'Unmute' : 'Mute') }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <button class="btn-load-more" *ngIf="users.length < usersTotal" (click)="loadMoreUsers()">Load More</button>
        </div>

        <div *ngIf="!usersLoading && users.length === 0 && searched" class="empty-state">
          <p>No users found.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-container { max-width: 1000px; margin: 2rem auto; padding: 0 1rem; }
    .admin-header { margin-bottom: 2rem; }
    .admin-header h1 { margin: 0 0 1rem; font-size: 1.5rem; font-weight: 800; color: var(--text-main); }
    .admin-tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border-color); }
    .admin-tabs button { background: none; border: none; padding: 0.75rem 1.5rem; font-size: 0.95rem; font-weight: 700; color: var(--text-muted); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.15s; }
    .admin-tabs button:hover { color: var(--text-main); }
    .admin-tabs button.active { color: var(--text-main); border-bottom-color: var(--text-main); }

    .filter-bar { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
    .filter-btn { padding: 0.4rem 1rem; border-radius: 9999px; border: 1px solid var(--border-color); background: transparent; color: var(--text-muted); font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.15s; }
    .filter-btn.active { background: var(--text-main); color: var(--bg-main); border-color: var(--text-main); }

    .table-wrapper { background: var(--bg-elevated); border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; }
    .admin-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    .admin-table th { text-align: left; padding: 0.75rem 1rem; background: var(--bg-hover); color: var(--text-muted); font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border-color); }
    .admin-table td { padding: 0.75rem 1rem; color: var(--text-main); border-bottom: 1px solid var(--border-color); }
    .admin-table tr:last-child td { border-bottom: none; }
    .reason-cell { max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .date-cell { white-space: nowrap; font-size: 0.85rem; color: var(--text-muted); }

    .btn-resolve { padding: 0.35rem 0.75rem; border-radius: 8px; border: 1px solid var(--border-color); background: transparent; color: var(--text-main); font-weight: 600; font-size: 0.8rem; cursor: pointer; transition: all 0.15s; }
    .btn-resolve:hover:not(:disabled) { background: var(--text-main); color: var(--bg-main); }
    .btn-resolve:disabled { opacity: 0.5; cursor: not-allowed; }
    .resolved-badge { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; }

    .btn-action { padding: 0.35rem 0.75rem; border-radius: 8px; border: 1px solid var(--border-color); background: transparent; color: var(--text-main); font-weight: 600; font-size: 0.8rem; cursor: pointer; margin-right: 0.5rem; transition: all 0.15s; }
    .btn-action:hover:not(:disabled) { background: var(--bg-hover); }
    .btn-action:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-action.muted { background: var(--danger); color: white; border-color: var(--danger); }
    .btn-action.muted:hover { opacity: 0.9; }

    .role-tag { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; background: var(--bg-hover); color: var(--text-muted); text-transform: uppercase; }
    .role-tag.admin { background: var(--text-main); color: var(--bg-main); }

    .search-bar { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
    .search-input { flex: 1; padding: 0.75rem 1rem; border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.95rem; font-family: inherit; background: var(--bg-elevated); color: var(--text-main); }
    .search-input:focus { outline: none; border-color: var(--text-main); }
    .btn-search { padding: 0.75rem 1.5rem; border-radius: 8px; border: none; background: var(--text-main); color: var(--bg-main); font-weight: 700; cursor: pointer; }
    .btn-search:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-load-more { display: block; width: 100%; padding: 0.75rem; background: none; border: none; color: var(--text-muted); font-weight: 600; cursor: pointer; border-top: 1px solid var(--border-color); }
    .btn-load-more:hover { background: var(--bg-hover); color: var(--text-main); }

    .loading { text-align: center; padding: 3rem; color: var(--text-muted); font-weight: 600; }
    .empty-state { text-align: center; padding: 4rem; color: var(--text-muted); border: 1px dashed var(--border-color); border-radius: 12px; margin-top: 1rem; }

    @media (max-width: 767px) {
      .admin-table { font-size: 0.8rem; }
      .admin-table th, .admin-table td { padding: 0.5rem 0.6rem; }
      .reason-cell { max-width: 120px; }
    }
  `]
})
export class AdminPageComponent implements OnInit {
  activeTab: 'reports' | 'users' = 'reports';

  reportFilter = 'OPEN';
  reports: any[] = [];
  reportsLoading = false;
  reportsTotal = 0;
  reportsPage = 0;
  resolvingId: string | null = null;

  userQuery = '';
  users: any[] = [];
  usersLoading = false;
  usersTotal = 0;
  usersPage = 0;
  searched = false;
  mutingId: string | null = null;

  constructor(
    private adminService: AdminService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.reportsLoading = true;
    this.reportsPage = 0;
    this.adminService.getReports(this.reportFilter, 0, 20).subscribe({
      next: (res) => {
        this.reports = res.content || [];
        this.reportsTotal = res.totalElements || 0;
        this.reportsLoading = false;
      },
      error: () => {
        this.reportsLoading = false;
        this.toastService.showError('Failed to load reports');
      }
    });
  }

  loadMoreReports(): void {
    this.reportsPage++;
    this.adminService.getReports(this.reportFilter, this.reportsPage, 20).subscribe({
      next: (res) => {
        this.reports = [...this.reports, ...(res.content || [])];
        this.reportsTotal = res.totalElements || 0;
      },
      error: () => this.toastService.showError('Failed to load reports')
    });
  }

  resolveReport(report: any): void {
    this.resolvingId = report.id;
    this.adminService.resolveReport(report.id).subscribe({
      next: () => {
        this.reports = this.reports.filter(r => r.id !== report.id);
        this.reportsTotal--;
        this.resolvingId = null;
        this.toastService.showSuccess('Report resolved');
      },
      error: () => {
        this.resolvingId = null;
        this.toastService.showError('Failed to resolve report');
      }
    });
  }

  searchUsers(): void {
    if (!this.userQuery.trim()) return;
    this.searched = true;
    this.usersLoading = true;
    this.usersPage = 0;
    this.adminService.searchUsers(this.userQuery, 0, 20).subscribe({
      next: (res) => {
        this.users = (res.content || []).map((u: any) => ({ ...u, _muted: false }));
        this.usersTotal = res.totalElements || 0;
        this.usersLoading = false;
      },
      error: () => {
        this.usersLoading = false;
        this.toastService.showError('Search failed');
      }
    });
  }

  loadMoreUsers(): void {
    this.usersPage++;
    this.adminService.searchUsers(this.userQuery, this.usersPage, 20).subscribe({
      next: (res) => {
        const newUsers = (res.content || []).map((u: any) => ({ ...u, _muted: false }));
        this.users = [...this.users, ...newUsers];
        this.usersTotal = res.totalElements || 0;
      },
      error: () => this.toastService.showError('Failed to load more users')
    });
  }

  toggleMuteUser(user: any): void {
    this.mutingId = user.id;
    const obs = user._muted
      ? this.adminService.unmuteUser(user.id)
      : this.adminService.muteUser(user.id);
    obs.subscribe({
      next: () => {
        user._muted = !user._muted;
        this.mutingId = null;
        this.toastService.showSuccess(user._muted ? 'User muted' : 'User unmuted');
      },
      error: () => {
        this.mutingId = null;
        this.toastService.showError('Failed to update mute status');
      }
    });
  }

  viewUserReports(user: any): void {
    this.userQuery = user.username;
    this.activeTab = 'reports';
    this.loadReports();
  }
}
