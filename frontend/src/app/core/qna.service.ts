import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface VoteResponse {
  targetId: string;
  voteCount: number;
  currentUserVote: number | null;
}

export interface QuestionResponse {
  id: string;
  title: string;
  body: string;
  authorId: string;
  authorUsername: string;
  answerCount: number;
  isAuthor: boolean;
  voteCount: number;
  currentUserVote: number | null;
  answers: AnswerResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface AnswerResponse {
  id: string;
  questionId: string;
  body: string;
  authorId: string;
  authorUsername: string;
  isAccepted: boolean;
  isAuthor: boolean;
  voteCount: number;
  currentUserVote: number | null;
  createdAt: string;
  updatedAt: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class QnaService {
  private apiUrl = `${environment.apiUrl}/questions`;

  constructor(private http: HttpClient) {}

  askQuestion(data: { title: string; body: string }): Observable<QuestionResponse> {
    return this.http.post<QuestionResponse>(this.apiUrl, data);
  }

  listQuestions(page: number = 0, size: number = 20, q?: string, filter?: string): Observable<any> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (q) params = params.set('q', q);
    if (filter) params = params.set('filter', filter);
    return this.http.get<any>(this.apiUrl, { params });
  }

  getQuestion(id: string): Observable<QuestionResponse> {
    return this.http.get<QuestionResponse>(`${this.apiUrl}/${id}`);
  }

  answerQuestion(questionId: string, data: { body: string; saveAsDraft?: boolean }): Observable<AnswerResponse> {
    return this.http.post<AnswerResponse>(`${this.apiUrl}/${questionId}/answers`, data);
  }

  updateAnswer(questionId: string, answerId: string, data: { body: string; saveAsDraft?: boolean }): Observable<AnswerResponse> {
    return this.http.put<AnswerResponse>(`${this.apiUrl}/${questionId}/answers/${answerId}`, data);
  }

  acceptAnswer(questionId: string, answerId: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${questionId}/answers/${answerId}/accept`, {});
  }

  getAnswerDrafts(page: number = 0, size: number = 20): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/answers/drafts?page=${page}&size=${size}`);
  }

  updateQuestion(id: string, title: string, body: string): Observable<QuestionResponse> {
    return this.http.put<QuestionResponse>(`${this.apiUrl}/${id}`, { title, body });
  }

  voteQuestion(questionId: string, direction: number): Observable<VoteResponse> {
    return this.http.post<VoteResponse>(`${this.apiUrl}/${questionId}/vote`, { direction });
  }

  voteAnswer(questionId: string, answerId: string, direction: number): Observable<VoteResponse> {
    return this.http.post<VoteResponse>(`${this.apiUrl}/${questionId}/answers/${answerId}/vote`, { direction });
  }

  deleteAnswer(questionId: string, answerId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${questionId}/answers/${answerId}`);
  }

  deleteQuestion(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
