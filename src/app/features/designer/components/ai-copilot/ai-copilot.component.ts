import { Component, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface CopilotGenerateEvent {
  prompt: string;
}

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

@Component({
  selector: 'app-ai-copilot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .copilot-trigger {
      position: fixed;
      bottom: 28px;
      right: 28px;
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 4px 20px rgba(0,0,0,0.35);
      z-index: 1000;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .copilot-trigger:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 28px rgba(0,0,0,0.45);
    }
    .copilot-panel {
      position: fixed;
      bottom: 92px;
      right: 28px;
      width: 380px;
      background: var(--bg-panel);
      border: 1px solid var(--header-border);
      border-radius: 16px;
      box-shadow: 0 16px 48px rgba(0,0,0,0.4);
      display: flex;
      flex-direction: column;
      z-index: 1000;
      overflow: hidden;
      animation: slide-up 0.2s ease-out;
    }
    @keyframes slide-up {
      from { opacity: 0; transform: translateY(12px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .copilot-header {
      padding: 16px 20px;
      background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: white;
    }
    .copilot-title {
      font-weight: 700;
      font-size: 15px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .copilot-close {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      opacity: 0.8;
      font-size: 20px;
      line-height: 1;
      padding: 0;
    }
    .copilot-close:hover { opacity: 1; }
    .chat-area {
      flex: 1;
      max-height: 300px;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .chat-area:empty::before {
      content: "Describe the pipeline you want to build. I\\'ll generate nodes and connections for you instantly.";
      color: var(--text-muted);
      font-size: 13px;
      line-height: 1.6;
    }
    .msg {
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 13px;
      line-height: 1.5;
      max-width: 85%;
    }
    .msg-user {
      background: var(--accent-primary);
      color: white;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .msg-ai {
      background: var(--icon-bg);
      color: var(--text-main);
      align-self: flex-start;
      border-bottom-left-radius: 4px;
      border: 1px solid var(--header-border);
    }
    .copilot-input-area {
      padding: 12px 16px;
      border-top: 1px solid var(--header-border);
      display: flex;
      gap: 8px;
      align-items: flex-end;
    }
    .copilot-input {
      flex: 1;
      background: var(--form-input-bg);
      border: 1px solid var(--header-border);
      color: var(--text-main);
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 13px;
      font-family: 'Inter', sans-serif;
      resize: none;
      max-height: 80px;
      line-height: 1.4;
    }
    .copilot-input:focus { outline: none; border-color: var(--accent-primary); }
    .copilot-send {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: var(--accent-primary);
      border: none;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.15s;
    }
    .copilot-send:hover { background: var(--accent-secondary); }
    .copilot-send:disabled { opacity: 0.5; cursor: not-allowed; }
    .thinking {
      display: flex;
      gap: 4px;
      padding: 12px 14px;
      align-self: flex-start;
    }
    .thinking span {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: var(--text-muted);
      animation: bounce 1.2s infinite;
    }
    .thinking span:nth-child(2) { animation-delay: 0.2s; }
    .thinking span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes bounce {
      0%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-6px); }
    }
    .hint-chips {
      padding: 0 16px 12px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .chip {
      background: var(--icon-bg);
      border: 1px solid var(--header-border);
      color: var(--text-secondary);
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.15s;
    }
    .chip:hover { border-color: var(--accent-primary); color: var(--accent-primary); }
  `],
  template: `
    <!-- Floating trigger button -->
    <button class="copilot-trigger" (click)="isOpen.set(!isOpen())" [title]="isOpen() ? 'Close AI Copilot' : 'Open AI Copilot'">
      <svg *ngIf="!isOpen()" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10A10 10 0 0 1 2 12 10 10 0 0 1 12 2"/><path d="M12 8v4l2 2"/><circle cx="12" cy="12" r="1" fill="currentColor"/><path d="M9 15l-2 2"/><path d="M15 15l2 2"/><path d="M12 2v2"/><path d="M20.66 7l-1.73 1"/><path d="M3.34 7l1.73 1"/></svg>
      <svg *ngIf="isOpen()" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>

    <!-- Copilot panel -->
    <div class="copilot-panel" *ngIf="isOpen()">
      <div class="copilot-header">
        <div class="copilot-title">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          AI Pipeline Copilot
        </div>
        <button class="copilot-close" (click)="isOpen.set(false)">×</button>
      </div>

      <div class="chat-area" #chatArea>
        <ng-container *ngFor="let msg of messages">
          <div class="msg" [class.msg-user]="msg.role === 'user'" [class.msg-ai]="msg.role === 'ai'">
            {{ msg.text }}
          </div>
        </ng-container>
        <div class="thinking" *ngIf="isThinking()">
          <span></span><span></span><span></span>
        </div>
      </div>

      <div class="hint-chips" *ngIf="messages.length === 0">
        <span class="chip" *ngFor="let hint of hints" (click)="useHint(hint)">{{ hint }}</span>
      </div>

      <div class="copilot-input-area">
        <textarea
          class="copilot-input"
          [(ngModel)]="userInput"
          placeholder="Describe your pipeline..."
          rows="1"
          (keydown.enter)="onEnter($any($event))"
        ></textarea>
        <button class="copilot-send" (click)="onSend()" [disabled]="!userInput.trim() || isThinking()">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  `,
})
export class AiCopilotComponent {
  @Output() generate = new EventEmitter<CopilotGenerateEvent>();

  isOpen = signal(false);
  isThinking = signal(false);
  userInput = '';
  messages: ChatMessage[] = [];

  readonly hints = [
    'API → Transform → S3',
    'Kafka stream to database',
    'SQL extract, mask PII, load to Redshift',
    'File agent → ML inference → notify',
  ];

  useHint(hint: string): void {
    this.userInput = hint;
    this.onSend();
  }

  onEnter(event: KeyboardEvent): void {
    if (!event.shiftKey) {
      event.preventDefault();
      this.onSend();
    }
  }

  onSend(): void {
    const prompt = this.userInput.trim();
    if (!prompt) return;

    this.messages.push({ role: 'user', text: prompt });
    this.userInput = '';
    this.isThinking.set(true);

    // Simulate AI thinking (600ms)
    setTimeout(() => {
      this.generate.emit({ prompt });
      this.messages.push({
        role: 'ai',
        text: `✅ Pipeline generated! I've created nodes based on your description and auto-organized the layout. Check the canvas!`,
      });
      this.isThinking.set(false);
    }, 600);
  }
}
