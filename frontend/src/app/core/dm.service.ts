import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ConversationResponse {
  id: string;
  otherParticipantId: string;
  otherParticipantUsername: string;
  otherParticipantDisplayName: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  createdAt: string;
}

export interface MessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  body: string;
  sentAt: string;
  readAt: string | null;
}

export interface CreateConversationRequest {
  participantIds: string[];
}

@Injectable({ providedIn: 'root' })
export class DmService {
  private apiUrl = `${environment.apiUrl}/conversations`;

  constructor(private http: HttpClient) {}

  createConversation(request: CreateConversationRequest): Observable<ConversationResponse> {
    return this.http.post<ConversationResponse>(this.apiUrl, request);
  }

  getConversations(): Observable<ConversationResponse[]> {
    return this.http.get<ConversationResponse[]>(this.apiUrl);
  }

  getMessages(conversationId: string, page: number = 0, size: number = 50): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${conversationId}/messages?page=${page}&size=${size}`);
  }

  sendMessage(conversationId: string, body: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/${conversationId}/messages`, { body });
  }

  markAsRead(conversationId: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${conversationId}/read`, {});
  }
}
