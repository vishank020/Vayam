import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="legal-page">
      <div class="legal-content">
        <div class="legal-header">
          <h1>Privacy Policy</h1>
          <p class="legal-meta">Version 1.0 &mdash; Last Updated: January 2026</p>
        </div>

        <section>
          <h2>Introduction</h2>
          <p>Vayam is a community platform that enables college students and developers to connect, create communities, share projects, post anonymously, and message securely. This Privacy Policy explains how we collect, use, store, and protect your personal information when you use our platform.</p>
          <p>By creating an account and using Vayam, you agree to the collection and use of information in accordance with this Privacy Policy.</p>
        </section>

        <section>
          <h2>Information We Collect</h2>

          <h3>Account Information</h3>
          <p>When you create an account, we collect:</p>
          <ul>
            <li><strong>Username</strong> &mdash; used to identify you publicly on the platform</li>
            <li><strong>Email address</strong> &mdash; stored as a SHA-256 hash for security; used for account recovery and notifications</li>
            <li><strong>Password</strong> &mdash; encrypted using BCrypt; we never store plaintext passwords</li>
          </ul>

          <h3>Profile Information</h3>
          <p>You may optionally provide:</p>
          <ul>
            <li><strong>Display name</strong> &mdash; shown on your profile and content</li>
            <li><strong>Bio</strong> &mdash; a short description about yourself</li>
            <li><strong>Avatar image</strong> &mdash; a profile picture</li>
            <li><strong>Website and location</strong> &mdash; visible on your public profile</li>
            <li><strong>Public encryption key</strong> &mdash; used for end-to-end encrypted direct messages</li>
          </ul>

          <h3>Content Information</h3>
          <p>When you use the platform, we collect the content you create, including:</p>
          <ul>
            <li><strong>Posts</strong> &mdash; including text, media attachments, and post type</li>
            <li><strong>Comments</strong> &mdash; including replies and nested discussions</li>
            <li><strong>Uploaded media</strong> &mdash; images and files stored in our infrastructure</li>
            <li><strong>Questions and answers</strong> &mdash; contributed to the Q&A section</li>
            <li><strong>Direct messages</strong> &mdash; end-to-end encrypted; we cannot read their content</li>
          </ul>

          <h3>Usage Information</h3>
          <p>We automatically collect:</p>
          <ul>
            <li><strong>Application interactions</strong> &mdash; posts viewed, communities joined, users followed</li>
            <li><strong>Preferences</strong> &mdash; theme selection, notification settings, privacy preferences</li>
            <li><strong>Block and report data</strong> &mdash; users you block and content you report</li>
          </ul>
        </section>

        <section>
          <h2>How We Use Your Information</h2>
          <p>We use the information we collect for the following purposes:</p>
          <ul>
            <li><strong>Account management</strong> &mdash; creating, maintaining, and securing your account</li>
            <li><strong>Platform functionality</strong> &mdash; delivering posts, comments, messages, communities, and other features</li>
            <li><strong>Security</strong> &mdash; preventing abuse, enforcing our Terms &amp; Conditions, and protecting users</li>
            <li><strong>Content moderation</strong> &mdash; reviewing reported content and enforcing community guidelines</li>
            <li><strong>Notifications</strong> &mdash; sending you updates about follows, comments, mentions, and replies</li>
            <li><strong>Improvement</strong> &mdash; analyzing usage patterns to improve the platform experience</li>
          </ul>
        </section>

        <section>
          <h2>Data Storage and Security</h2>
          <p>Your data is stored on secure servers and encrypted in transit using TLS. Passwords are hashed with BCrypt, and email addresses are stored as SHA-256 hashes. Media files are stored in S3-compatible object storage (MinIO) with access-controlled URLs.</p>
          <p>We implement industry-standard security measures to protect your personal information, but no method of electronic storage is 100% secure. We encourage you to use a strong, unique password.</p>
        </section>

        <section>
          <h2>Your Rights</h2>
          <p>You have the following rights regarding your data:</p>
          <ul>
            <li><strong>Edit your profile</strong> &mdash; update your display name, bio, avatar, and preferences at any time</li>
            <li><strong>Delete your content</strong> &mdash; remove your posts, comments, and messages</li>
            <li><strong>Control visibility</strong> &mdash; manage who can see your location, website, and other profile details</li>
            <li><strong>Request account deletion</strong> &mdash; contact us to request permanent deletion of your account and associated data</li>
          </ul>
        </section>

        <section>
          <h2>Cookies and Local Storage</h2>
          <p>We use HttpOnly cookies for authentication (access and refresh tokens). These cookies are essential for platform functionality and are never accessible to client-side JavaScript. We do not use tracking cookies or third-party analytics cookies.</p>
          <p>Local storage is used solely for user preferences such as theme selection and anonymous browsing mode.</p>
        </section>

        <section>
          <h2>Third-Party Services</h2>
          <p>We integrate with the following third-party services:</p>
          <ul>
            <li><strong>GIPHY</strong> &mdash; for GIF search in the post composer (optional feature)</li>
            <li><strong>MinIO</strong> &mdash; self-hosted S3-compatible storage for uploaded media</li>
          </ul>
          <p>No personal information is shared with these services beyond what is necessary for their function.</p>
        </section>

        <section>
          <h2>Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. Changes will be posted on this page, and the &ldquo;Last Updated&rdquo; date at the top will reflect the most recent revision. Continued use of the platform after changes constitutes acceptance of the updated policy.</p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us through the platform or reach out to the community administrators.</p>
        </section>

        <a routerLink="/register" class="back-link">&larr; Back to Registration</a>
      </div>
    </div>
  `,
  styles: [`
    .legal-page {
      max-width: 900px;
      margin: 2rem auto;
      padding: 0 1.5rem;
    }
    .legal-content {
      background: var(--bg-elevated);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 3rem;
      line-height: 1.8;
      color: var(--text-main);
    }
    .legal-header {
      margin-bottom: 2.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }
    .legal-header h1 {
      margin: 0 0 0.5rem;
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .legal-meta {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin: 0;
    }
    h2 {
      font-size: 1.35rem;
      font-weight: 700;
      margin: 2rem 0 1rem;
      color: var(--text-main);
    }
    h3 {
      font-size: 1.05rem;
      font-weight: 600;
      margin: 1.5rem 0 0.5rem;
      color: var(--text-main);
    }
    p {
      margin: 0 0 1rem;
      color: var(--text-muted);
    }
    ul {
      margin: 0 0 1rem 1.5rem;
      padding: 0;
    }
    li {
      margin-bottom: 0.4rem;
      color: var(--text-muted);
    }
    li strong {
      color: var(--text-main);
    }
    section {
      margin-bottom: 0.5rem;
    }
    .back-link {
      display: inline-block;
      margin-top: 2rem;
      color: var(--accent-color);
      text-decoration: none;
      font-weight: 600;
      font-size: 0.95rem;
    }
    .back-link:hover {
      text-decoration: underline;
    }
  `]
})
export class PrivacyPolicyComponent {}
