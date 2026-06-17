import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CommunityResponse {
  id: string;
  name: string;
  description: string;
  visibility: 'PUBLIC' | 'RESTRICTED' | 'PRIVATE';
  ownerId: string;
  ownerUsername: string;
  memberCount: number;
  isMember: boolean;
  role: 'OWNER' | 'ADMIN' | 'MOD' | 'MEMBER' | 'NONE';
  avatarUrl: string | null;
  bannerUrl: string | null;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityMemberResponse {
  id: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  role: 'OWNER' | 'ADMIN' | 'MOD' | 'MEMBER';
  joinedAt: string;
}

export interface InviteResponse {
  id: string;
  communityId: string;
  inviterId: string;
  inviterUsername: string;
  inviteeId: string;
  inviteeUsername: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  createdAt: string;
}

export interface CommunityRuleResponse {
  id: string;
  communityId: string;
  title: string;
  description: string | null;
  position: number;
  createdAt: string;
}

export interface JoinRequestResponse {
  id: string;
  communityId: string;
  userId: string;
  username: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface InviteLinkResponse {
  id: string;
  communityId: string;
  code: string;
  createdById: string;
  createdByUsername: string;
  expiresAt: string | null;
  maxUses: number | null;
  useCount: number;
  active: boolean;
  createdAt: string;
}

export interface CreateCommunityRequest {
  name: string;
  description?: string;
  visibility?: string;
  slug?: string;
}

export interface UpdateCommunityRequest {
  name?: string;
  description?: string;
  visibility?: string;
  avatarUrl?: string;
  bannerUrl?: string;
}

export interface CreateRuleRequest {
  title: string;
  description?: string;
  position: number;
}

export interface CreateInviteLinkRequest {
  expiresAt?: string;
  maxUses?: number;
}

export interface UpdateMemberRoleRequest {
  role: string;
}

export interface CommunityTagRequest {
  name: string;
  color?: string;
}

export interface CommunityTagResponse {
  id: string;
  communityId: string;
  name: string;
  color: string;
}

export interface BanRequest {
  reason?: string;
  duration?: string;
}

export interface BanResponse {
  id: string;
  communityId: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  bannedById: string;
  bannedByUsername: string;
  reason: string | null;
  duration: string | null;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
}

export interface CommunityAnalyticsResponse {
  totalMembers: number;
  totalPosts: number;
  totalComments: number;
  activeAuthors: number;
}

export interface ModLogResponse {
  id: string;
  communityId: string;
  actorId: string;
  actorUsername: string;
  action: string;
  targetId: string | null;
  targetType: string | null;
  details: string | null;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class CommunityService {
  private apiUrl = `${environment.apiUrl}/communities`;

  constructor(private http: HttpClient) {}

  create(request: CreateCommunityRequest): Observable<CommunityResponse> {
    return this.http.post<CommunityResponse>(this.apiUrl, request);
  }

  listPublic(page: number = 0, size: number = 20): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}?page=${page}&size=${size}`);
  }

  getById(id: string): Observable<CommunityResponse> {
    return this.http.get<CommunityResponse>(`${this.apiUrl}/${id}`);
  }

  getBySlug(slug: string): Observable<CommunityResponse> {
    return this.http.get<CommunityResponse>(`${this.apiUrl}/by-slug/${slug}`);
  }

  update(id: string, request: UpdateCommunityRequest): Observable<CommunityResponse> {
    return this.http.put<CommunityResponse>(`${this.apiUrl}/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  join(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/join`, {});
  }

  leave(id: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/leave`, {});
  }

  invite(communityId: string, userId: string): Observable<InviteResponse> {
    return this.http.post<InviteResponse>(`${this.apiUrl}/${communityId}/invite`, { userId });
  }

  acceptInvite(communityId: string, inviteId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${communityId}/invites/${inviteId}/accept`, {});
  }

  declineInvite(communityId: string, inviteId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${communityId}/invites/${inviteId}/decline`, {});
  }

  getMembers(id: string, search?: string, role?: string): Observable<CommunityMemberResponse[]> {
    let params = new URLSearchParams();
    if (search) params.set('search', search);
    if (role) params.set('role', role);
    const qs = params.toString();
    return this.http.get<CommunityMemberResponse[]>(`${this.apiUrl}/${id}/members${qs ? '?' + qs : ''}`);
  }

  getInvites(id: string): Observable<InviteResponse[]> {
    return this.http.get<InviteResponse[]>(`${this.apiUrl}/${id}/invites`);
  }

  getMyCommunities(): Observable<CommunityResponse[]> {
    return this.http.get<CommunityResponse[]>(`${this.apiUrl}/my`);
  }

  getMyInvites(): Observable<InviteResponse[]> {
    return this.http.get<InviteResponse[]>(`${this.apiUrl}/invites`);
  }

  transferOwnership(communityId: string, userId: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${communityId}/transfer-ownership/${userId}`, {});
  }

  updateMemberRole(communityId: string, userId: string, request: UpdateMemberRoleRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${communityId}/members/${userId}/role`, request);
  }

  getRules(id: string): Observable<CommunityRuleResponse[]> {
    return this.http.get<CommunityRuleResponse[]>(`${this.apiUrl}/${id}/rules`);
  }

  createRule(id: string, request: CreateRuleRequest): Observable<CommunityRuleResponse> {
    return this.http.post<CommunityRuleResponse>(`${this.apiUrl}/${id}/rules`, request);
  }

  updateRule(id: string, ruleId: string, request: Partial<CreateRuleRequest>): Observable<CommunityRuleResponse> {
    return this.http.put<CommunityRuleResponse>(`${this.apiUrl}/${id}/rules/${ruleId}`, request);
  }

  deleteRule(id: string, ruleId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/rules/${ruleId}`);
  }

  getJoinRequests(id: string): Observable<JoinRequestResponse[]> {
    return this.http.get<JoinRequestResponse[]>(`${this.apiUrl}/${id}/join-requests`);
  }

  getMyJoinRequest(id: string): Observable<JoinRequestResponse | null> {
    return this.http.get<JoinRequestResponse | null>(`${this.apiUrl}/${id}/my-join-request`);
  }

  approveJoinRequest(id: string, requestId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/join-requests/${requestId}/approve`, {});
  }

  rejectJoinRequest(id: string, requestId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/join-requests/${requestId}/reject`, {});
  }

  createInviteLink(id: string, request: CreateInviteLinkRequest): Observable<InviteLinkResponse> {
    return this.http.post<InviteLinkResponse>(`${this.apiUrl}/${id}/invite-links`, request);
  }

  getInviteLinks(id: string): Observable<InviteLinkResponse[]> {
    return this.http.get<InviteLinkResponse[]>(`${this.apiUrl}/${id}/invite-links`);
  }

  revokeInviteLink(id: string, linkId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/invite-links/${linkId}`);
  }

  joinByLink(code: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/join-by-link/${code}`, {});
  }

  removeMember(id: string, userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/members/${userId}`);
  }

  banMember(id: string, userId: string, request: BanRequest): Observable<BanResponse> {
    return this.http.post<BanResponse>(`${this.apiUrl}/${id}/bans`, request);
  }

  unbanMember(id: string, userId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/unban/${userId}`, {});
  }

  getBans(id: string): Observable<BanResponse[]> {
    return this.http.get<BanResponse[]>(`${this.apiUrl}/${id}/bans`);
  }

  getModLog(id: string): Observable<ModLogResponse[]> {
    return this.http.get<ModLogResponse[]>(`${this.apiUrl}/${id}/mod-log`);
  }

  getAnalytics(id: string): Observable<CommunityAnalyticsResponse> {
    return this.http.get<CommunityAnalyticsResponse>(`${this.apiUrl}/${id}/analytics`);
  }

  getTags(id: string): Observable<CommunityTagResponse[]> {
    return this.http.get<CommunityTagResponse[]>(`${this.apiUrl}/${id}/tags`);
  }

  createTag(id: string, request: CommunityTagRequest): Observable<CommunityTagResponse> {
    return this.http.post<CommunityTagResponse>(`${this.apiUrl}/${id}/tags`, request);
  }

  deleteTag(id: string, tagId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/tags/${tagId}`);
  }
}
