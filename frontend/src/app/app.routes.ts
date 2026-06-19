import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { adminGuard } from './core/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login.component')
      .then(m => m.LoginComponent),
    data: { title: 'Sign In | Vayam', description: 'Sign in to your Vayam account to access communities, posts, and direct messages.' }
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/pages/register/register.component')
      .then(m => m.RegisterComponent),
    data: { title: 'Sign Up | Vayam', description: 'Create a free Vayam account to join communities, ask questions, and connect with others.' }
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./features/auth/pages/forgot-password/forgot-password.component')
      .then(m => m.ForgotPasswordComponent),
    data: { title: 'Forgot Password | Vayam', description: 'Request a password reset link for your Vayam account.' }
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/pages/reset-password/reset-password.component')
      .then(m => m.ResetPasswordComponent),
    data: { title: 'Reset Password | Vayam', description: 'Set a new password for your Vayam account using your reset token.' }
  },
  {
    path: 'verify-email',
    loadComponent: () => import('./features/auth/pages/verify-email/verify-email.component')
      .then(m => m.VerifyEmailComponent),
    data: { title: 'Verify Email | Vayam', description: 'Verify your email address to activate your Vayam account.' }
  },
  {
    path: 'privacy-policy',
    loadComponent: () => import('./features/legal/pages/privacy-policy/privacy-policy.component')
      .then(m => m.PrivacyPolicyComponent),
    data: { title: 'Privacy Policy | Vayam', description: 'How Vayam collects, uses, and protects your personal information.' }
  },
  {
    path: 'terms-and-conditions',
    loadComponent: () => import('./features/legal/pages/terms-and-conditions/terms-and-conditions.component')
      .then(m => m.TermsAndConditionsComponent),
    data: { title: 'Terms and Conditions | Vayam', description: 'The terms of service and usage rules governing your use of Vayam.' }
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/pages/profile.component')
      .then(m => m.ProfileComponent),
    canActivate: [authGuard],
    data: { title: 'My Profile | Vayam', description: 'View and edit your Vayam profile, posts, and settings.' }
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
    canActivate: [authGuard],
    data: { title: 'Settings | Vayam', description: 'Manage your account settings, notifications, privacy, and appearance preferences.' }
  },
  {
    path: 'communities',
    loadComponent: () => import('./features/communities/pages/community-list/community-list.component')
      .then(m => m.CommunityListComponent),
    data: { title: 'Communities | Vayam', description: 'Browse and join communities on Vayam to discuss topics you care about.' }
  },
  {
    path: 'communities/new',
    loadComponent: () => import('./features/communities/pages/create-community/create-community.component')
      .then(m => m.CreateCommunityComponent),
    canActivate: [authGuard],
    data: { title: 'Create Community | Vayam', description: 'Create a new community on Vayam and invite others to join.' }
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
      .then(m => m.QuestionListComponent),
    data: { title: 'Questions | Vayam', description: 'Browse, search, and answer questions from the Vayam community.' }
  },
  {
    path: 'questions/new',
    loadComponent: () => import('./features/qna/pages/ask-question/ask-question.component')
      .then(m => m.AskQuestionComponent),
    canActivate: [authGuard],
    data: { title: 'Ask a Question | Vayam', description: 'Post a new question to get help from the Vayam community.' }
  },
  {
    path: 'questions/:id',
    loadComponent: () => import('./features/qna/pages/question-detail/question-detail.component')
      .then(m => m.QuestionDetailComponent)
  },
  {
    path: 'feed',
    loadComponent: () => import('./features/feed/pages/feed-page/feed-page.component')
      .then(m => m.FeedPageComponent),
    data: { title: 'Feed | Vayam', description: 'See the latest posts and discussions from communities you follow.' }
  },
  {
    path: 'posts/new',
    loadComponent: () => import('./features/post/pages/create-post/create-post.component')
      .then(m => m.CreatePostComponent),
    canActivate: [authGuard],
    data: { title: 'Create Post | Vayam', description: 'Write and publish a new post to a community on Vayam.' }
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
    canActivate: [authGuard],
    data: { title: 'Messages | Vayam', description: 'View and manage your direct message conversations.' }
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
    canActivate: [adminGuard],
    data: { title: 'Admin | Vayam', description: 'Admin dashboard for managing users, communities, and site settings.' }
  },
  {
    path: 'drafts',
    loadComponent: () => import('./features/drafts/pages/drafts-page/drafts-page.component')
      .then(m => m.DraftsPageComponent),
    canActivate: [authGuard],
    data: { title: 'Drafts | Vayam', description: 'View and manage your saved draft posts.' }
  },
  {
    path: 'search',
    loadComponent: () => import('./features/search/pages/search-page/search-page.component')
      .then(m => m.SearchPageComponent),
    data: { title: 'Search | Vayam', description: 'Search across posts, communities, questions, and users on Vayam.' }
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
