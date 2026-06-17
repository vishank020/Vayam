import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AnonymousBrowsingService {
  private readonly STORAGE_KEY = 'cc-anonymous-browsing';
  private anonymousModeSubject = new BehaviorSubject<boolean>(this.getStoredState());
  
  public isAnonymousMode$ = this.anonymousModeSubject.asObservable();
  
  // Subject to trigger the exit modal from anywhere
  private exitPromptSubject = new Subject<void>();
  public exitPrompt$ = this.exitPromptSubject.asObservable();

  constructor() {}

  get isAnonymousMode(): boolean {
    return this.anonymousModeSubject.value;
  }

  setAnonymousMode(enabled: boolean): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(enabled));
    this.anonymousModeSubject.next(enabled);
  }

  toggleAnonymousMode(): void {
    this.setAnonymousMode(!this.isAnonymousMode);
  }

  private getStoredState(): boolean {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : false;
  }

  /**
   * Components should call this when a user attempts an identity-required action
   * while in anonymous mode. Returns true if the action should proceed (user is not anon),
   * false if it was blocked (shows prompt).
   */
  interceptAction(): boolean {
    if (this.isAnonymousMode) {
      this.exitPromptSubject.next();
      return false; // Action blocked
    }
    return true; // Action allowed
  }
}
