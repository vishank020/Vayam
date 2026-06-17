import { Component, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { marked } from 'marked';

@Component({
  selector: 'app-markdown-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="md-editor">
      <div class="md-toolbar">
        <button type="button" class="md-toolbar-btn" (click)="insertBold()" title="Bold (Ctrl+B)" tabindex="-1"><strong>B</strong></button>
        <button type="button" class="md-toolbar-btn" (click)="insertItalic()" title="Italic (Ctrl+I)" tabindex="-1"><em>I</em></button>
        <button type="button" class="md-toolbar-btn" (click)="insertLink()" title="Link" tabindex="-1">&#128279;</button>
        <button type="button" class="md-toolbar-btn" (click)="insertCode()" title="Code" tabindex="-1">&lt;/&gt;</button>
        <button type="button" class="md-toolbar-btn" (click)="insertQuote()" title="Quote" tabindex="-1">&#10077;</button>
        <button type="button" class="md-toolbar-btn" (click)="insertBulletList()" title="Bullet list" tabindex="-1">&bull;</button>
        <button type="button" class="md-toolbar-btn" (click)="insertNumberedList()" title="Numbered list" tabindex="-1">1.</button>
        <div class="md-toolbar-spacer"></div>
        <button type="button" class="md-tab-btn" [class.active]="activeTab === 'write'" (click)="activeTab = 'write'" tabindex="-1">Write</button>
        <button type="button" class="md-tab-btn" [class.active]="activeTab === 'preview'" (click)="activeTab = 'preview'" tabindex="-1">Preview</button>
      </div>

      <div class="md-body" *ngIf="activeTab === 'write'">
        <textarea
          #mdTextarea
          class="md-textarea"
          [value]="value"
          (input)="onInput($event)"
          (keydown)="onKeydown($event)"
          [placeholder]="placeholder"
          [rows]="rows"
        ></textarea>
      </div>

      <div class="md-body md-preview" *ngIf="activeTab === 'preview'">
        <div class="md-preview-empty" *ngIf="!value?.trim()">Nothing to preview</div>
        <div class="md-preview-content" [innerHTML]="previewHtml" *ngIf="value?.trim()"></div>
      </div>
    </div>
  `,
  styles: [`
    .md-editor {
      border: 1px solid var(--border-color);
      border-radius: 8px;
      overflow: hidden;
      background: var(--bg-elevated);
    }
    .md-toolbar {
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 4px 6px;
      background: var(--bg-hover);
      border-bottom: 1px solid var(--border-color);
      flex-wrap: wrap;
    }
    @media (pointer: coarse) {
      .md-toolbar-btn { width: 44px; height: 44px; }
      .md-tab-btn { min-height: 44px; padding: 0.4rem 0.75rem; }
    }
    @media (max-width: 767px) {
      .md-toolbar { gap: 1px; padding: 2px 4px; }
      .md-toolbar-btn { width: 36px; height: 36px; font-size: 0.8rem; }
      .md-textarea { font-size: 0.9rem; }
    }
    .md-toolbar-btn {
      width: 30px;
      height: 28px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .md-toolbar-btn:hover {
      background: var(--border-color);
      color: var(--text-main);
    }
    .md-toolbar-spacer {
      flex: 1;
    }
    .md-tab-btn {
      padding: 2px 10px;
      border: none;
      background: transparent;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.8rem;
      color: var(--text-muted);
      font-weight: 500;
    }
    .md-tab-btn.active {
      background: var(--border-color);
      color: var(--text-main);
    }
    .md-tab-btn:hover:not(.active) {
      color: var(--text-main);
    }
    .md-body {
      border-bottom-left-radius: 8px;
      border-bottom-right-radius: 8px;
    }
    .md-textarea {
      width: 100%;
      border: none;
      outline: none;
      resize: vertical;
      padding: 0.6rem 0.75rem;
      font-size: 0.95rem;
      font-family: inherit;
      line-height: 1.5;
      box-sizing: border-box;
      min-height: 80px;
      background: transparent;
      color: var(--text-main);
    }
    .md-textarea:focus {
      box-shadow: none;
    }
    .md-textarea::placeholder {
      color: var(--text-muted);
      opacity: 0.6;
    }
    .md-preview {
      padding: 0.6rem 0.75rem;
      min-height: 80px;
    }
    .md-preview-empty {
      color: var(--text-muted);
      font-style: italic;
      font-size: 0.9rem;
    }
    .md-preview-content {
      font-size: 0.95rem;
      line-height: 1.6;
      color: var(--text-main);
    }
    .md-preview-content p {
      margin: 0 0 0.75rem;
    }
    .md-preview-content p:last-child {
      margin-bottom: 0;
    }
    .md-preview-content h1, .md-preview-content h2, .md-preview-content h3 {
      margin: 1rem 0 0.5rem;
      font-weight: 600;
    }
    .md-preview-content h1 { font-size: 1.3rem; }
    .md-preview-content h2 { font-size: 1.15rem; }
    .md-preview-content h3 { font-size: 1.05rem; }
    .md-preview-content ul, .md-preview-content ol {
      margin: 0 0 0.75rem;
      padding-left: 1.5rem;
    }
    .md-preview-content li {
      margin-bottom: 0.2rem;
    }
    .md-preview-content code {
      background: var(--bg-hover);
      padding: 0.15rem 0.4rem;
      border-radius: 3px;
      font-size: 0.875rem;
    }
    .md-preview-content pre {
      background: var(--bg-hover);
      padding: 0.75rem;
      border-radius: 6px;
      overflow-x: auto;
      margin: 0 0 0.75rem;
    }
    .md-preview-content pre code {
      background: none;
      padding: 0;
    }
    .md-preview-content blockquote {
      border-left: 3px solid var(--accent-color);
      margin: 0 0 0.75rem;
      padding: 0.25rem 0.75rem;
      color: var(--text-muted);
    }
    .md-preview-content a {
      color: var(--accent-color);
      text-decoration: underline;
    }
    .md-preview-content img {
      max-width: 100%;
      border-radius: 6px;
      margin: 0.5rem 0;
    }
    .md-preview-content hr {
      border: none;
      border-top: 1px solid var(--border-color);
      margin: 1rem 0;
    }
  `]
})
export class MarkdownEditorComponent {
  @Input() value = '';
  @Input() placeholder = 'Write something...';
  @Input() rows = 4;
  @Output() valueChange = new EventEmitter<string>();
  @Output() editorKeydown = new EventEmitter<KeyboardEvent>();

  @ViewChild('mdTextarea') textareaRef?: ElementRef<HTMLTextAreaElement>;

  activeTab: 'write' | 'preview' = 'write';

  get previewHtml(): string {
    return marked.parse(this.value || '', { breaks: true }) as string;
  }

  onInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.value = textarea.value;
    this.valueChange.emit(this.value);
  }

  onKeydown(event: KeyboardEvent): void {
    this.editorKeydown.emit(event);
    if (!event.ctrlKey && !event.metaKey) return;
    if (event.key === 'b') { event.preventDefault(); this.insertBold(); }
    if (event.key === 'i') { event.preventDefault(); this.insertItalic(); }
  }

  private get textarea(): HTMLTextAreaElement | null {
    return this.textareaRef?.nativeElement ?? null;
  }

  get cursorPos(): number {
    return this.textarea?.selectionStart ?? 0;
  }

  focus(): void {
    requestAnimationFrame(() => this.textarea?.focus());
  }

  insertAtCursorPos(text: string): void {
    const ta = this.textarea;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newValue = this.value.substring(0, start) + text + this.value.substring(end);
    this.value = newValue;
    this.valueChange.emit(this.value);

    requestAnimationFrame(() => {
      ta.focus();
      const pos = start + text.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  private insertAtCursor(before: string, after: string, cursorOffset = 0): void {
    const ta = this.textarea;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = this.value.substring(start, end);
    const replacement = before + (selected || 'text') + after;
    const newValue = this.value.substring(0, start) + replacement + this.value.substring(end);
    this.value = newValue;
    this.valueChange.emit(this.value);

    requestAnimationFrame(() => {
      ta.focus();
      const pos = cursorOffset || (selected ? start + replacement.length : start + before.length);
      ta.setSelectionRange(pos, pos);
    });
  }

  insertBold(): void {
    this.insertAtCursor('**', '**');
  }

  insertItalic(): void {
    this.insertAtCursor('*', '*');
  }

  insertLink(): void {
    this.insertAtCursor('[', '](url)', 0);
  }

  insertCode(): void {
    this.insertAtCursor('`', '`');
  }

  insertLinePrefix(prefix: string): void {
    const ta = this.textarea;
    if (!ta) return;
    const start = ta.selectionStart;
    const value = this.value;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const before = value.substring(0, lineStart);
    const after = value.substring(lineStart);
    const newValue = before + prefix + after;
    this.value = newValue;
    this.valueChange.emit(this.value);

    requestAnimationFrame(() => {
      ta.focus();
      const pos = lineStart + prefix.length;
      ta.setSelectionRange(pos, pos);
    });
  }

  insertQuote(): void {
    this.insertLinePrefix('> ');
  }

  insertBulletList(): void {
    this.insertLinePrefix('- ');
  }

  insertNumberedList(): void {
    this.insertLinePrefix('1. ');
  }
}
