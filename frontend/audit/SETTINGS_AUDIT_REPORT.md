# Settings Page Audit Report

Date: 2026-06-17

## API Endpoints

| Endpoint | Method | Service method |
|---|---|---|
| `GET /api/settings` | GET | `SettingsService.getSettings()` |
| `PUT /api/settings` | PUT | `SettingsService.updateSettings(settings)` |
| `PUT /api/auth/password` | PUT | `AuthService.changePassword()` |
| `GET /api/auth/2fa/generate` | GET | `AuthService.generate2fa()` |
| `POST /api/auth/2fa/enable` | POST | `AuthService.enable2fa()` |
| `POST /api/auth/2fa/disable` | POST | `AuthService.disable2fa()` |
| `POST /api/auth/logout` | POST | `AuthService.logout()` |

## Backend DTO (`UserSettingsDto`)

```
theme, accentColor, notifyComments, notifyReplies, notifyMentions,
notifyFollows, notifySystem, showEmail, showWebsite, showLocation,
allowDiscovery, allowFollowRequests
```

Frontend `UserSettingsResponse` matches 1:1.

---

## Per-Section Status

### Appearance

| Setting | Status | Mechanism |
|---|---|---|
| Theme (system/light/dark) | ✅ Wired | `onThemeChange()` → `themeService.applyTheme()` (local CSS) + `saveSingleSetting('theme')` → `PUT /api/settings` |
| Accent Color | ✅ Wired | `onAccentInput()` → `previewAccentColor()` (immediate CSS) + debounced 500ms → `saveSingleSetting('accentColor')` → `PUT /api/settings` |

### Notifications

All 5 toggles fire `onToggleChange(key, $event)` → `saveSingleSetting(key, value)` → `PUT /api/settings` immediately on change (no Save button). All backend fields exist.

| Setting | Status |
|---|---|
| Comments (`notifyComments`) | ✅ Wired |
| Replies (`notifyReplies`) | ✅ Wired |
| Mentions (`notifyMentions`) | ✅ Wired |
| New Followers (`notifyFollows`) | ✅ Wired |
| System (`notifySystem`) | ✅ Wired |

### Privacy & Safety

| Setting | Status | Mechanism |
|---|---|---|
| Show Location (`showLocation`) | ✅ Wired | `onToggleChange` → `PUT /api/settings` |
| Show Website (`showWebsite`) | ✅ Wired | `onToggleChange` → `PUT /api/settings` |
| Allow Follow Requests (`allowFollowRequests`) | ✅ Wired | `onToggleChange` → `PUT /api/settings` |
| Anonymous Browsing | ⚠️ Frontend-only | `toggleAnonymousMode()` → `anonymousBrowsingService.setAnonymousMode()` — local state only, no backend API call |
| Show Email (`showEmail`) | ✅ Wired | `onToggleChange` → `PUT /api/settings` |
| Allow Profile Discovery (`allowDiscovery`) | ✅ Wired | `onToggleChange` → `PUT /api/settings` |

### Security

| Setting | Status | Mechanism |
|---|---|---|
| Change Password | ✅ Wired | `canChangePassword()` validates (min 8 chars, match) → `changePassword()` → `AuthService.changePassword()` → `PUT /api/auth/password`. Handles 401/403 (wrong password) and 400 (requirements). |
| 2FA Setup | ✅ Wired | `start2faSetup()` → `GET /api/auth/2fa/generate` → shows QR + secret → `enable2fa()` → `POST /api/auth/2fa/enable` |
| 2FA Disable | ✅ Wired | `disable2fa()` → `POST /api/auth/2fa/disable` |
| Log Out | ✅ Wired | `logout()` → `AuthService.logout()` → `POST /api/auth/logout` |

### Account

| Setting | Status |
|---|---|
| Change username | ❌ Missing — no UI, no frontend endpoint |
| Change email | ❌ Missing — no UI, no frontend endpoint |

---

## Issues Found

1. **Hardcoded light-theme colors in `saveStatus` div** — `background: #dcfce7; color: #166534;` breaks on dark mode. Should use `ToastService.showSuccess()` or CSS variables.

2. **No debouncing on notification/privacy toggles** — `onToggleChange()` fires `PUT /api/settings` immediately on every click. Rapid toggling sends concurrent PUTs and the error rollback in `saveSingleSetting` can race with `[(ngModel)]` two-way binding.

3. **No Account section** — username/email changes are entirely absent from the UI and the 5-section nav.
