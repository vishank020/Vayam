import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import { Observable } from 'rxjs';
import { first } from 'rxjs/operators';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';
import { DmService } from './dm.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private client: Client;
  private connected = false;
  private connectResolver: (() => void) | null = null;

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private dmService: DmService
  ) {
    this.client = new Client({
      brokerURL: environment.wsUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    this.client.onConnect = () => {
      this.connected = true;
      if (this.connectResolver) {
        this.connectResolver();
        this.connectResolver = null;
      }
      this.client.subscribe('/user/queue/messages', (msg: IMessage) => {
        this.dmService.fetchUnreadCount();
      });
    };

    this.client.onDisconnect = () => {
      this.connected = false;
    };

    this.client.onStompError = (frame) => {
      const errMsg = frame.headers?.['message'] || '';
      if (errMsg.toLowerCase().includes('auth')) {
        this.authService.getAccessToken().pipe(first()).subscribe(token => {
          if (token) {
            this.client.connectHeaders = { Authorization: `Bearer ${token}` };
          }
        });
      }
    };
  }

  connect(): void {
    if (this.connected) return;
    this.authService.getAccessToken().pipe(first()).subscribe(token => {
      if (token) {
        this.client.connectHeaders = { Authorization: `Bearer ${token}` };
      }
      this.client.activate();
    });
  }

  private ensureConnected(): Promise<void> {
    if (this.connected) return Promise.resolve();
    return new Promise(resolve => {
      this.connectResolver = resolve;
      this.connect();
    });
  }

  subscribeToConversation(conversationId: string): Observable<any> {
    return new Observable(observer => {
      let stompSub: any = null;
      this.ensureConnected().then(() => {
        stompSub = this.client.subscribe(`/topic/chat/${conversationId}`, (msg: IMessage) => {
          observer.next(JSON.parse(msg.body));
        });
      });
      return () => {
        if (stompSub) stompSub.unsubscribe();
      };
    });
  }

  subscribeToNotifications(): Observable<any> {
    return new Observable(observer => {
      let stompSub: any = null;
      this.ensureConnected().then(() => {
        stompSub = this.client.subscribe('/user/queue/notifications', (msg: IMessage) => {
          observer.next(JSON.parse(msg.body));
        });
      });
      return () => {
        if (stompSub) stompSub.unsubscribe();
      };
    });
  }

  disconnect(): void {
    if (this.connected) {
      this.client.deactivate();
      this.connected = false;
    }
  }
}
