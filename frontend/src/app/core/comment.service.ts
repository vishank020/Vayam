import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Page<T> {
  content: T[];
  pageable: any;
  last: boolean;
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface CommentResponse {
  id: string;
  postId: string;
  parentId?: string;
  authorId: string;
  authorUsername: string;
  authorDisplayName: string | null;
  authorAvatarUrl: string | null;
  content: string;
  isAnonymous: boolean;
  isAuthor: boolean;
  createdAt: string;
  updatedAt: string;
  upvoteCount?: number;
  downvoteCount?: number;
  userVote?: number;
  replies?: CommentResponse[];
}

@Injectable({ providedIn: 'root' })
export class CommentService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getComments(postId: string): Observable<CommentResponse[]> {
    return this.http.get<CommentResponse[]>(`${this.apiUrl}/posts/${postId}/comments`);
  }

  createComment(postId: string, content: string, parentId?: string): Observable<CommentResponse> {
    return this.http.post<CommentResponse>(`${this.apiUrl}/posts/${postId}/comments`, { content, parentId });
  }

  deleteComment(postId: string, commentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/posts/${postId}/comments/${commentId}`);
  }

  updateComment(postId: string, commentId: string, content: string): Observable<CommentResponse> {
    return this.http.put<CommentResponse>(`${this.apiUrl}/posts/${postId}/comments/${commentId}`, { content });
  }

  voteComment(postId: string, commentId: string, direction: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/posts/${postId}/comments/${commentId}/vote`, { direction });
  }

  getUserComments(userId: string, page: number = 0, size: number = 20): Observable<Page<CommentResponse>> {
    return this.http.get<Page<CommentResponse>>(`${this.apiUrl}/users/${userId}/comments?page=${page}&size=${size}`);
  }
}
