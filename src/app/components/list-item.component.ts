import { Component, ElementRef, inject, Input } from '@angular/core';

import { Highlightable } from '@angular/cdk/a11y';
import { DatePipe, NgIf } from '@angular/common';

@Component({
  selector: 'list-item',
  standalone: true,
  imports: [NgIf, DatePipe],
  template: `
    <div [class.active]="item.isActive" [class.disabled]="disabled">
      <p [class.active]="item.current">
        <span *ngIf="item.current">💲</span>
        {{ item.label }}
      </p>
      <span *ngIf="item?.description">{{ item.description }}</span>
      <span *ngIf="item?.date">{{ item.date | date }}</span>
    </div>
  `,
  styles: [
    `
      div {
        padding: 0.15rem 1rem;
      }

      .disabled {
        color: grey;
      }

      p {
        font-size: 1.1rem;
      }

      span {
        font-size: 0.9rem;
      }
    `,
  ],
})
export class ListItemComponent<
  T extends {
    label: string;
    isActive: boolean;
    description?: string;
    date?: Date;
  }
> implements Highlightable
{
  @Input() item: T;
  @Input() disabled = false;

  private readonly host = inject(ElementRef);

  setActiveStyles(): void {
    this.item.isActive = true;
  }

  setInactiveStyles(): void {
    this.item.isActive = false;
  }

  getLabel(): string {
    return this.item.label;
  }

  focus(): void {
    this.host.nativeElement.focus();
  }
}
