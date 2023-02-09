import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { Component, HostListener, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { filter, fromEvent, map, tap } from 'rxjs';
import { ListItemComponent } from './components/list-item.component';
import { KeyManagerDirective } from './directives/key-manager.directive';
import { ListItem } from './models/list-item.model';

interface ViewModelData {
  branches: ListItem[];
  logs: any[];
}

interface ViewModelMessage {
  command: string;
  data: ViewModelData;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    AsyncPipe,
    NgFor,
    NgIf,
    ListItemComponent,
    KeyManagerDirective,
  ],
  template: `
  <ng-container *ngIf="vm$ | async as vm">
    <h1>{{ title }}</h1>
    <section>
      <div keyMapper (onMessage)="postMessage($event)">
        <list-item *ngFor="let branch of vm.branches" [item]="branch" [disabled]="branch.current"/>
      </div>
      <div>
        <list-item *ngFor="let log of vm.logs" [item]="log"/>
      </div>
    </section>
  </ng-container>
    `,
  styles: [
    `
      :host:focus {
        border: 1px solid red;
      }

      section {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
      }
    `,
  ],
})
export class AppComponent {
  @ViewChild(KeyManagerDirective) keyManager: KeyManagerDirective;
  private readonly vscode = acquireVsCodeApi();

  title = '🦆 Quack Git';

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    this.keyManager.onKeydown(event);
  }

  vm$ = fromEvent<MessageEvent<ViewModelMessage>>(window, 'message').pipe(
    map(({ data }) => data),
    tap(console.log),
    filter(({ command }) => command === 'load-data'),
    map(({ data: { branches, logs } }) => ({
      branches: branches.map((c) => ({ ...c, isActive: false })),
      logs: logs.map((l) => ({
        label: l.message,
        description: l.hash,
        isActive: false,
        date: l.commitDate,
      })),
    }))
  );

  ngOnInit(): void {
    this.postMessage({ command: 'load-data', text: 'Loading Data' });
  }

  postMessage(message: { command: string; text: string }): void {
    this.vscode.postMessage(message);
  }
}
