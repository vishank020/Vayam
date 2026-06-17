import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-terms-and-conditions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="legal-page">
      <div class="legal-content">
        <div class="legal-header">
          <h1>Terms &amp; Conditions</h1>
          <p class="legal-meta">Version 1.0 &mdash; Last Updated: January 2026</p>
        </div>

        <section>
          <h2>Acceptance of Terms</h2>
          <p>By accessing or using Vayam, you agree to be bound by these Terms &amp; Conditions. If you do not agree with any part of these terms, you may not use the platform.</p>
          <p>These terms apply to all visitors, users, and others who access or use the platform.</p>
        </section>

        <section>
          <h2>User Responsibilities</h2>
          <p>When using Vayam, you agree that you will not:</p>
          <ul>
            <li><strong>Post illegal content</strong> &mdash; upload, share, or distribute content that violates any applicable law or regulation</li>
            <li><strong>Harass others</strong> &mdash; engage in bullying, harassment, intimidation, or hateful conduct toward any user</li>
            <li><strong>Spam</strong> &mdash; send unsolicited messages, post repetitive content, or engage in any form of spam</li>
            <li><strong>Abuse the platform</strong> &mdash; attempt to circumvent security measures, exploit bugs, or disrupt platform operations</li>
            <li><strong>Impersonate others</strong> &mdash; pretend to be another person, organization, or entity</li>
            <li><strong>Share harmful content</strong> &mdash; distribute malware, viruses, or any malicious code</li>
          </ul>
          <p>You are responsible for all activity that occurs under your account and for maintaining the confidentiality of your login credentials.</p>
        </section>

        <section>
          <h2>Content Ownership</h2>
          <p>You retain full ownership of all content you create and share on Vayam, including posts, comments, questions, answers, media uploads, and profile information.</p>
          <p>By posting content on the platform, you grant Vayam a non-exclusive, royalty-free, worldwide license to display, distribute, and reproduce your content for the purpose of operating and improving the platform. This license ends when you delete your content or your account, except where the content has been shared with others and cannot be fully recalled.</p>
          <p>We do not claim ownership of your content. You are free to share your content elsewhere at any time.</p>
        </section>

        <section>
          <h2>Account Responsibility</h2>
          <p>You are responsible for maintaining the security of your account. Vayam uses HttpOnly cookies for authentication, and you should take reasonable steps to prevent unauthorized access to your device and browser.</p>
          <p>If you suspect that your account has been compromised, please change your password immediately and contact the platform administrators.</p>
          <p>You must be at least 13 years of age to create an account. By registering, you confirm that you meet this age requirement.</p>
        </section>

        <section>
          <h2>Moderation</h2>
          <p>Vayam reserves the right, but does not assume the obligation, to:</p>
          <ul>
            <li><strong>Remove content</strong> &mdash; delete or hide any content that violates these terms or is otherwise objectionable</li>
            <li><strong>Suspend accounts</strong> &mdash; temporarily or permanently suspend accounts that engage in prohibited behavior</li>
            <li><strong>Restrict abusive behavior</strong> &mdash; limit, block, or restrict users who violate community standards</li>
          </ul>
          <p>Content moderation decisions are made at the discretion of the platform administrators and are final.</p>
        </section>

        <section>
          <h2>Limitation of Liability</h2>
          <p>Vayam is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. We make no warranties, expressed or implied, regarding the availability, reliability, or suitability of the platform for your purposes.</p>
          <p>In no event shall Vayam, its administrators, or contributors be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of the platform.</p>
          <p>This limitation of liability applies to the fullest extent permitted by applicable law.</p>
        </section>

        <section>
          <h2>Changes to Terms</h2>
          <p>We reserve the right to update or modify these Terms &amp; Conditions at any time. Changes will be effective immediately upon posting to this page. We encourage you to review these terms periodically.</p>
          <p>Your continued use of the platform after any changes constitutes acceptance of the new terms. If you do not agree with the changes, you should discontinue using the platform.</p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>If you have questions about these Terms &amp; Conditions, please contact the platform administrators through the community channels or reach out via the platform's support features.</p>
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
export class TermsAndConditionsComponent {}
