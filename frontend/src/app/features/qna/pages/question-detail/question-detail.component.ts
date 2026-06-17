import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { marked } from 'marked';
import { QnaService, QuestionResponse, AnswerResponse } from '../../../../core/qna.service';
import { AnonymousBrowsingService } from '../../../../core/anonymous-browsing.service';
import { PostDetailSkeletonComponent } from '../../../../shared/components/post-detail-skeleton.component';
import { timeAgo } from '../../../../core/time-ago';

@Component({
  selector: 'app-question-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PostDetailSkeletonComponent],
  template: `
    <div class="container">
      <app-post-detail-skeleton *ngIf="loading"></app-post-detail-skeleton>
      <div *ngIf="error" class="error-message">{{ error }}</div>

      <div *ngIf="!loading && question" class="detail">
        <div class="question-header">
          <div *ngIf="!isEditingQuestion">
            <h1>{{ question.title }}</h1>
          </div>
          <div *ngIf="isEditingQuestion">
            <input [(ngModel)]="qEditTitle" class="edit-title-input" placeholder="Question title" />
          </div>
          <div class="meta">
            <span>Asked by &#64;{{ question.authorUsername }}</span>
            <span>{{ timeAgo(question.createdAt) }}</span>
            <span>{{ question.answerCount }} {{ question.answerCount === 1 ? 'answer' : 'answers' }}</span>
          </div>
          <div class="question-actions">
            <button *ngIf="question.isAuthor && !isEditingQuestion" class="btn-edit" (click)="startEditQuestion()">Edit</button>
            <button *ngIf="question.isAuthor && !isEditingQuestion" class="btn-danger" (click)="deleteQuestion()">Delete</button>
          </div>
          <div *ngIf="isEditingQuestion" class="edit-actions">
            <button class="btn-primary" (click)="saveEditQuestion()" [disabled]="!qEditTitle.trim() || !qEditBody.trim()">Save</button>
            <button class="btn-draft" (click)="cancelEditQuestion()">Cancel</button>
          </div>
        </div>

        <div class="question-content">
          <div class="vote-col">
            <button class="vote-btn upvote" [class.voted]="question.currentUserVote === 1" [disabled]="question.isAuthor" (click)="voteQuestion(1)">&#9650;</button>
            <span class="vote-count">{{ question.voteCount }}</span>
            <button class="vote-btn downvote" [class.voted]="question.currentUserVote === -1" [disabled]="question.isAuthor" (click)="voteQuestion(-1)">&#9660;</button>
          </div>
          <div class="question-body-col">
            <div *ngIf="!isEditingQuestion" class="question-body" [innerHTML]="renderMarkdown(question.body)"></div>
            <div *ngIf="isEditingQuestion" class="question-body-edit">
              <textarea [(ngModel)]="qEditBody" rows="6" placeholder="Question body"></textarea>
            </div>
          </div>
        </div>

        <div class="answers-section">
          <h3>{{ question.answers.length }} {{ question.answers.length === 1 ? 'Answer' : 'Answers' }}</h3>

          <div *ngIf="question.answers.length === 0" class="empty-section">No answers yet.</div>

          <div class="answer" *ngFor="let a of question.answers" [class.accepted]="a.isAccepted">
            <div class="vote-col">
              <button class="vote-btn upvote" [class.voted]="a.currentUserVote === 1" [disabled]="a.isAuthor" (click)="voteOnAnswer(a.id, 1)">&#9650;</button>
              <span class="vote-count">{{ a.voteCount }}</span>
              <button class="vote-btn downvote" [class.voted]="a.currentUserVote === -1" [disabled]="a.isAuthor" (click)="voteOnAnswer(a.id, -1)">&#9660;</button>
            </div>
            <div class="answer-body-col">
              <div class="answer-body" *ngIf="editingAnswerId !== a.id" [innerHTML]="renderMarkdown(a.body)"></div>
              <div class="answer-edit" *ngIf="editingAnswerId === a.id">
                <textarea [(ngModel)]="editBody" rows="4"></textarea>
                <div class="edit-actions">
                  <button class="btn-primary" (click)="saveEditAnswer(a.id)" [disabled]="!editBody.trim()">Save</button>
                  <button class="btn-draft" (click)="cancelEditAnswer()">Cancel</button>
                </div>
              </div>
              <div class="answer-meta">
                <span>Answered by &#64;{{ a.authorUsername }}</span>
                <span>{{ timeAgo(a.createdAt) }}</span>
                <span *ngIf="a.isAccepted" class="accepted-badge">Accepted</span>
                <button *ngIf="question.isAuthor && !a.isAccepted" class="btn-accept" (click)="acceptAnswer(a.id)">Accept</button>
                <button *ngIf="a.isAuthor && editingAnswerId !== a.id" class="btn-edit" (click)="startEditAnswer(a)">Edit</button>
                <button *ngIf="a.isAuthor" class="btn-danger" (click)="deleteAnswer(a.id)">Delete</button>
              </div>
            </div>
          </div>

          <div class="your-answer your-answer-desktop">
            <h4>Your Answer</h4>
            <textarea [(ngModel)]="answerBody" placeholder="Write your answer..." rows="4"></textarea>
            <div class="answer-actions">
              <button class="btn-draft" (click)="saveAnswerDraft()" [disabled]="submitting">
                {{ submitting ? 'Saving...' : 'Save Draft' }}
              </button>
              <button class="btn-primary" (click)="submitAnswer()" [disabled]="!answerBody.trim() || submitting">
                {{ submitting ? 'Posting...' : 'Post Answer' }}
              </button>
            </div>
          </div>
          <div class="your-answer your-answer-mobile">
            <button *ngIf="!showAnswerForm" class="btn-toggle-answer" (click)="showAnswerForm = true">Write an answer</button>
            <div *ngIf="showAnswerForm">
              <h4>Your Answer</h4>
              <textarea [(ngModel)]="answerBody" placeholder="Write your answer..." rows="4"></textarea>
              <div class="answer-actions">
                <button class="btn-draft" (click)="saveAnswerDraft()" [disabled]="submitting">
                  {{ submitting ? 'Saving...' : 'Save Draft' }}
                </button>
                <button class="btn-primary" (click)="submitAnswer()" [disabled]="!answerBody.trim() || submitting">
                  {{ submitting ? 'Posting...' : 'Post Answer' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { max-width: 720px; margin: 2rem auto; padding: 0 1rem; }
    .back-link { color: var(--accent-color); text-decoration: none; font-size: 0.9rem; display: inline-block; margin-bottom: 1rem; }
    .back-link:hover { text-decoration: underline; }
    .loading { text-align: center; color: var(--text-muted); padding: 2rem; }
    .error-message { background: rgba(231, 76, 60, 0.1); color: var(--danger, #e74c3c); padding: 0.6rem; border-radius: 8px; margin-bottom: 1rem; font-size: 0.9rem; }
    .detail { background: var(--bg-elevated); border-radius: 12px; border: 1px solid var(--border-color); padding: 1.5rem; }
    .question-header { margin-bottom: 1rem; }
    .question-header h1 { margin: 0 0 0.5rem; font-size: 1.5rem; color: var(--text-main); }
    .meta { display: flex; gap: 1rem; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem; flex-wrap: wrap; }
    .btn-danger { padding: 0.4rem 0.8rem; background: var(--danger, #e74c3c); color: white; border: none; border-radius: 6px; font-size: 0.85rem; cursor: pointer; }
    .btn-danger:hover { background: #c0392b; }
    .question-body { padding: 1rem 0; border-bottom: 1px solid var(--border-color); line-height: 1.6; color: var(--text-main); white-space: pre-wrap; }
    .answers-section { margin-top: 1.5rem; }
    .answers-section h3 { margin: 0 0 1rem; font-size: 1.15rem; color: var(--text-main); }
    .empty-section { color: var(--text-muted); font-size: 0.9rem; padding: 1rem 0; }
    .answer { display: flex; gap: 0.65rem; padding: 1rem; background: var(--bg-main); border-radius: 8px; margin-bottom: 0.75rem; border-left: 3px solid var(--border-color); }
    .answer.accepted { border-left-color: #2e7d32; background: rgba(46, 125, 50, 0.08); }
    .answer-body { margin-bottom: 0.6rem; line-height: 1.5; color: var(--text-main); white-space: pre-wrap; }
    .answer-meta { display: flex; align-items: center; gap: 0.75rem; font-size: 0.8rem; color: var(--text-muted); flex-wrap: wrap; }
    .accepted-badge { background: #2e7d32; color: white; padding: 0.15rem 0.45rem; border-radius: 6px; font-size: 0.75rem; font-weight: 500; }
    .btn-accept { padding: 0.3rem 0.6rem; background: var(--accent-color); color: white; border: none; border-radius: 6px; font-size: 0.75rem; cursor: pointer; }
    .btn-accept:hover { background: var(--accent-hover, #3a5ce5); }
    .btn-edit { padding: 0.3rem 0.6rem; background: transparent; color: var(--accent-color); border: 1px solid var(--accent-color); border-radius: 6px; font-size: 0.75rem; cursor: pointer; }
    .btn-edit:hover { background: var(--accent-color); color: white; }
    .answer-edit { margin-bottom: 0.6rem; }
    .edit-actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
    .question-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem; }
    .edit-title-input { width: 100%; padding: 0.6rem 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; font-size: 1.2rem; font-weight: 600; box-sizing: border-box; font-family: inherit; background: var(--bg-main); color: var(--text-main); margin-bottom: 0.5rem; }
    .edit-title-input:focus { outline: none; border-color: var(--accent-color); box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-color) 15%, transparent); }
    .question-body-edit { padding: 1rem 0; border-bottom: 1px solid var(--border-color); }
    .question-content { display: flex; gap: 0.75rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color); }
    .question-body-col { flex: 1; min-width: 0; }
    .question-body { padding: 0; line-height: 1.6; color: var(--text-main); white-space: pre-wrap; border-bottom: none; }
    .answer-body-col { flex: 1; min-width: 0; }
    .vote-col { display: flex; flex-direction: column; align-items: center; gap: 0.15rem; min-width: 36px; padding-top: 0.15rem; }
    .vote-btn { background: none; border: none; cursor: pointer; padding: 0; font-size: 1rem; line-height: 1; color: var(--text-muted); width: 28px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 4px; }
    .vote-btn:hover:not(:disabled) { background: var(--bg-elevated); }
    .vote-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    .vote-btn.upvote.voted { color: #e74c3c; }
    .vote-btn.downvote.voted { color: #3498db; }
    .vote-count { font-size: 0.8rem; font-weight: 700; color: var(--text-main); line-height: 1; }
    .your-answer { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-color); }
    .your-answer h4 { margin: 0 0 0.5rem; color: var(--text-main); }
    textarea { width: 100%; padding: 0.6rem 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.95rem; box-sizing: border-box; resize: vertical; font-family: inherit; margin-bottom: 0.75rem; background: var(--bg-main); color: var(--text-main); }
    textarea:focus { outline: none; border-color: var(--accent-color); box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-color) 15%, transparent); }
    .answer-actions { display: flex; gap: 0.5rem; align-items: center; }
    .btn-draft { padding: 0.6rem 1.25rem; border: 1px solid var(--border-color, #ddd); border-radius: 8px; background: transparent; color: var(--text-secondary, #666); cursor: pointer; font-size: 0.95rem; }
    .btn-draft:hover { background: var(--hover-bg, #f5f5f5); }
    .btn-primary { padding: 0.6rem 1.25rem; background: var(--accent-color); color: white; border: none; border-radius: 8px; font-size: 0.95rem; font-weight: 600; cursor: pointer; }
    .btn-primary:hover:not(:disabled) { background: var(--accent-hover, #3a5ce5); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .your-answer-mobile { display: none; }
    .btn-toggle-answer { display: none; }

    @media (max-width: 767px) {
      .container { margin: 1rem auto; }
      .detail { padding: 1rem; border-radius: 0; border-left: none; border-right: none; }
      .question-header h1 { font-size: 1.2rem; }
      .meta { gap: 0.5rem; font-size: 0.8rem; }
      .question-body { font-size: 0.9375rem; }
      .answer { padding: 0.75rem; border-left-width: 8px; }
      .answer-meta { gap: 0.5rem; font-size: 0.75rem; }
      .vote-col { min-width: 28px; }
      .vote-btn { font-size: 0.85rem; height: 20px; width: 24px; }
      .vote-count { font-size: 0.75rem; }
      .btn-accept, .btn-edit { width: 100%; text-align: center; }
      .your-answer-desktop { display: none; }
      .your-answer-mobile { display: block; }
      .btn-toggle-answer { display: block; width: 100%; padding: 0.75rem; border: 2px dashed var(--border-color); background: transparent; color: var(--text-muted); border-radius: 8px; font-size: 0.95rem; font-weight: 600; cursor: pointer; }
      textarea { font-size: 16px; }
      .answer-actions { flex-direction: column; gap: 0.5rem; }
      .answer-actions .btn-primary,
      .answer-actions .btn-draft { width: 100%; text-align: center; }
    }
  `]
})
export class QuestionDetailComponent implements OnInit {
  question: QuestionResponse | null = null;
  answerBody = '';
  showAnswerForm = false;
  loading = false;
  submitting = false;
  error = '';
  editingAnswerId: string | null = null;
  editBody = '';
  isEditingQuestion = false;
  qEditTitle = '';
  qEditBody = '';
  timeAgo = timeAgo;
  private questionId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private qnaService: QnaService,
    private anonymousBrowsingService: AnonymousBrowsingService
  ) {}

  ngOnInit(): void {
    this.questionId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.questionId) { this.error = 'Question not found.'; return; }
    this.loadQuestion();
  }

  loadQuestion(): void {
    this.loading = true;
    this.error = '';
    this.qnaService.getQuestion(this.questionId).subscribe({
      next: (q) => { this.question = q; this.loading = false; },
      error: () => { this.error = 'Failed to load question.'; this.loading = false; }
    });
  }

  saveAnswerDraft(): void {
    if (!this.anonymousBrowsingService.interceptAction()) return;
    if (!this.answerBody.trim()) return;
    this.submitting = true;
    this.qnaService.answerQuestion(this.questionId, { body: this.answerBody, saveAsDraft: true }).subscribe({
      next: () => { this.answerBody = ''; this.submitting = false; },
      error: () => { this.error = 'Failed to save draft.'; this.submitting = false; }
    });
  }

  submitAnswer(): void {
    if (!this.anonymousBrowsingService.interceptAction()) return;
    if (!this.answerBody.trim()) return;
    this.submitting = true;
    this.qnaService.answerQuestion(this.questionId, { body: this.answerBody }).subscribe({
      next: () => { this.answerBody = ''; this.loadQuestion(); this.submitting = false; },
      error: () => { this.error = 'Failed to post answer.'; this.submitting = false; }
    });
  }

  acceptAnswer(answerId: string): void {
    this.qnaService.acceptAnswer(this.questionId, answerId).subscribe({
      next: () => this.loadQuestion(),
      error: () => this.error = 'Failed to accept answer.'
    });
  }

  deleteQuestion(): void {
    if (!confirm('Delete this question?')) return;
    this.qnaService.deleteQuestion(this.questionId).subscribe({
      next: () => this.router.navigate(['/questions']),
      error: () => this.error = 'Failed to delete question.'
    });
  }

  deleteAnswer(answerId: string): void {
    if (!confirm('Delete this answer?')) return;
    this.qnaService.deleteAnswer(this.questionId, answerId).subscribe({
      next: () => {
        if (this.question) {
          this.question.answers = this.question.answers.filter(a => a.id !== answerId);
        }
      },
      error: () => this.error = 'Failed to delete answer.'
    });
  }

  startEditQuestion(): void {
    if (!this.question) return;
    this.isEditingQuestion = true;
    this.qEditTitle = this.question.title;
    this.qEditBody = this.question.body;
  }

  cancelEditQuestion(): void {
    this.isEditingQuestion = false;
    this.qEditTitle = '';
    this.qEditBody = '';
  }

  saveEditQuestion(): void {
    if (!this.question) return;
    this.qnaService.updateQuestion(this.questionId, this.qEditTitle, this.qEditBody).subscribe({
      next: (updated) => {
        if (this.question) {
          this.question.title = updated.title;
          this.question.body = updated.body;
        }
        this.cancelEditQuestion();
      },
      error: () => this.error = 'Failed to save question.'
    });
  }

  voteQuestion(direction: number): void {
    if (!this.question) return;
    this.qnaService.voteQuestion(this.questionId, direction).subscribe({
      next: (res) => {
        if (this.question) {
          this.question.voteCount = res.voteCount;
          this.question.currentUserVote = res.currentUserVote;
        }
      },
      error: () => this.error = 'Failed to vote.'
    });
  }

  voteOnAnswer(answerId: string, direction: number): void {
    this.qnaService.voteAnswer(this.questionId, answerId, direction).subscribe({
      next: (res) => {
        const answer = this.question?.answers.find(a => a.id === answerId);
        if (answer) {
          answer.voteCount = res.voteCount;
          answer.currentUserVote = res.currentUserVote;
        }
      },
      error: () => this.error = 'Failed to vote.'
    });
  }

  renderMarkdown(text: string): string {
    return marked.parse(text || '', { breaks: true }) as string;
  }

  startEditAnswer(answer: AnswerResponse): void {
    this.editingAnswerId = answer.id;
    this.editBody = answer.body;
  }

  cancelEditAnswer(): void {
    this.editingAnswerId = null;
    this.editBody = '';
  }

  saveEditAnswer(answerId: string): void {
    this.qnaService.updateAnswer(this.questionId, answerId, { body: this.editBody }).subscribe({
      next: (updated) => {
        if (this.question) {
          const idx = this.question.answers.findIndex(a => a.id === answerId);
          if (idx !== -1) {
            this.question.answers[idx] = updated;
          }
        }
        this.cancelEditAnswer();
      },
      error: () => this.error = 'Failed to save answer.'
    });
  }
}
