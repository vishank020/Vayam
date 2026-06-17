import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { adminGuard } from './core/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login.component')
      .then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/pages/register/register.component')
      .then(m => m.RegisterComponent)
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/pages/forgot-password/forgot-password.component')
      .then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/pages/reset-password/reset-password.component')
      .then(m => m.ResetPasswordComponent)
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./features/auth/pages/verify-email/verify-email.component')
      .then(m => m.VerifyEmailComponent)
  },
  {
    path: 'privacy-policy',
    loadComponent: () => import('./features/legal/pages/privacy-policy/privacy-policy.component')
      .then(m => m.PrivacyPolicyComponent)
  },
  {
    path: 'terms-and-conditions',
    loadComponent: () => import('./features/legal/pages/terms-and-conditions/terms-and-conditions.component')
      .then(m => m.TermsAndConditionsComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/pages/profile.component')
      .then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'profile/:username',
    redirectTo: 'u/:username',
    pathMatch: 'full'
  },
  {
    path: 'u/:username',
    loadComponent: () => import('./features/profile/pages/profile-view/profile-view.component')
      .then(m => m.ProfileViewComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/pages/settings-page/settings-page.component')
      .then(m => m.SettingsPageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'communities',
    loadComponent: () => import('./features/communities/pages/community-list/community-list.component')
      .then(m => m.CommunityListComponent)
  },
  {
    path: 'communities/new',
    loadComponent: () => import('./features/communities/pages/create-community/create-community.component')
      .then(m => m.CreateCommunityComponent),
    canActivate: [authGuard]
  },
  {
    path: 'communities/join/:code',
    loadComponent: () => import('./features/communities/pages/community-detail/community-detail.component')
      .then(m => m.CommunityDetailComponent)
  },
  {
    path: 'communities/:id',
    loadComponent: () => import('./features/communities/pages/community-detail/community-detail.component')
      .then(m => m.CommunityDetailComponent)
  },
  {
    path: 'c/:slug',
    loadComponent: () => import('./features/communities/pages/community-detail/community-detail.component')
      .then(m => m.CommunityDetailComponent)
  },
  {
    path: 'questions',
    loadComponent: () => import('./features/qna/pages/question-list/question-list.component')
      .then(m => m.QuestionListComponent)
  },
  {
    path: 'questions/new',
    loadComponent: () => import('./features/qna/pages/ask-question/ask-question.component')
      .then(m => m.AskQuestionComponent),
    canActivate: [authGuard]
  },
  {
    path: 'questions/:id',
    loadComponent: () => import('./features/qna/pages/question-detail/question-detail.component')
      .then(m => m.QuestionDetailComponent)
  },
  {
    path: 'feed',
    loadComponent: () => import('./features/feed/pages/feed-page/feed-page.component')
      .then(m => m.FeedPageComponent)
  },
  {
    path: 'posts/new',
    loadComponent: () => import('./features/post/pages/create-post/create-post.component')
      .then(m => m.CreatePostComponent),
    canActivate: [authGuard]
  },
  {
    path: 'posts/:id',
    loadComponent: () => import('./features/post/pages/post-detail/post-detail.component')
      .then(m => m.PostDetailComponent)
  },
  {
    path: 'posts/:id/edit',
    loadComponent: () => import('./features/post/pages/edit-post/edit-post.component')
      .then(m => m.EditPostComponent),
    canActivate: [authGuard]
  },
  {
    path: 'dm',
    loadComponent: () => import('./features/dm/pages/dm-list/dm-list.component')
      .then(m => m.DmListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'dm/:id',
    loadComponent: () => import('./features/dm/pages/dm-chat/dm-chat.component')
      .then(m => m.DmChatComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/pages/admin-page/admin-page.component')
      .then(m => m.AdminPageComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'drafts',
    loadComponent: () => import('./features/drafts/pages/drafts-page/drafts-page.component')
      .then(m => m.DraftsPageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'search',
    loadComponent: () => import('./features/search/pages/search-page/search-page.component')
      .then(m => m.SearchPageComponent)
  },
  {
    path: '',
    redirectTo: '/feed',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/feed'
  }
];
