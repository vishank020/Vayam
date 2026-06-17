import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PostResponse {
  id: string;
  title: string;
  content: string;
  postType: 'GENERAL' | 'ACHIEVEMENT' | 'PROJECT' | 'JOB';
  authorId: string | null;
  authorUsername: string | null;
  authorDisplayName: string | null;
  authorAvatarUrl: string | null;
  isAnonymous: boolean;
  communityId: string | null;
  communityName: string | null;
  communitySlug: string | null;
  createdAt: string;
  updatedAt: string;
  upvoteCount?: number;
  downvoteCount?: number;
  userVote?: number;
  mediaUrls?: string[];
  isSaved?: boolean;
  isPinned?: boolean;
  status?: string;
  tagId?: string | null;
  tagName?: string | null;
  tagColor?: string | null;
}

export interface FeedPostResponse {
  id: string;
  title: string;
  content: string;
  postType: 'GENERAL' | 'ACHIEVEMENT' | 'PROJECT' | 'JOB';
  authorUsername: string | null;
  authorDisplayName: string | null;
  authorAvatarUrl: string | null;
  isAnonymous: boolean;
  communityId: string | null;
  communityName: string | null;
  communitySlug: string | null;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
  upvoteCount?: number;
  downvoteCount?: number;
  userVote?: number;
  mediaUrls?: string[];
  isSaved?: boolean;
  isPinned?: boolean;
  status?: string;
  tagId?: string | null;
  tagName?: string | null;
  tagColor?: string | null;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  postType: 'GENERAL' | 'ACHIEVEMENT' | 'PROJECT' | 'JOB';
  communityId?: string | null;
  isAnonymous: boolean;
  mediaUrls?: string[];
  scheduledAt?: string;
  saveAsDraft?: boolean;
  tagId?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PostService {
  private apiUrl = `${environment.apiUrl}/posts`;

  constructor(private http: HttpClient) {}

  getFeed(page: number = 0, size: number = 20): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?page=${page}&size=${size}`);
  }

  getPost(id: string): Observable<PostResponse> {
    return this.http.get<PostResponse>(`${this.apiUrl}/${id}`);
  }

  createPost(request: CreatePostRequest): Observable<PostResponse> {
    return this.http.post<PostResponse>(this.apiUrl, request);
  }

  updatePost(id: string, request: CreatePostRequest): Observable<PostResponse> {
    return this.http.put<PostResponse>(`${this.apiUrl}/${id}`, request);
  }

  deletePost(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getCommunityFeed(communityId: string, page: number = 0, size: number = 20, tagId?: string | null): Observable<any> {
    let url = `${this.apiUrl}/communities/${communityId}/posts?page=${page}&size=${size}`;
    if (tagId) {
      url += `&tagId=${tagId}`;
    }
    return this.http.get<any>(url);
  }

  votePost(id: string, direction: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/vote`, { direction });
  }

  getUserPosts(userId: string, page: number = 0, size: number = 20): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/user/${userId}?page=${page}&size=${size}`);
  }

  getDrafts(page: number = 0, size: number = 20): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/drafts?page=${page}&size=${size}`);
  }

  getUserSavedPosts(userId: string, page: number = 0, size: number = 20): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/user/${userId}/saved?page=${page}&size=${size}`);
  }

  getUserUpvotedPosts(userId: string, page: number = 0, size: number = 20): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/user/${userId}/upvoted?page=${page}&size=${size}`);
  }

  savePost(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/save`, {});
  }

  unsavePost(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/save`);
  }

  pinPost(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/pin`, {});
  }

  unpinPost(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/unpin`, {});
  }

  reportPost(id: string, reason: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/report`, { reason });
  }
}
