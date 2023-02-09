import { ActiveDescendantKeyManager } from '@angular/cdk/a11y';
import {
  AfterViewInit,
  ContentChildren,
  Directive,
  EventEmitter,
  Output,
  QueryList,
} from '@angular/core';
import { ListItemComponent } from '../components/list-item.component';
import { KeyCode } from '../models/key-code.model';
import { ListItem } from '../models/list-item.model';

@Directive({
  selector: '[keyMapper]',
  standalone: true,
})
export class KeyManagerDirective implements AfterViewInit {
  @ContentChildren(ListItemComponent) items: QueryList<
    ListItemComponent<ListItem>
  >;
  @Output() onMessage = new EventEmitter<{ command: string; text: string }>();

  private keyManager: ActiveDescendantKeyManager<ListItemComponent<ListItem>>;

  keyMap = {
    [KeyCode.j]: this.setNextItemActive.bind(this),
    [KeyCode.k]: this.setPreviousItemActive.bind(this),
    [KeyCode.n]: this.createBranch.bind(this),
    [KeyCode.D]: this.deleteBranch.bind(this),
    [KeyCode.Enter]: this.checkout.bind(this),
  };

  ngAfterViewInit(): void {
    this.keyManager = new ActiveDescendantKeyManager(this.items).withWrap();
    setTimeout(() => this.keyManager.setFirstItemActive(), 500);
    this.items.first.focus();
  }

  onKeydown(event: KeyboardEvent): void {
    if (!this.keyMap[event.key]) {
      return this.keyManager.onKeydown(event);
    }

    this.keyMap[event.key]();
  }

  getLabel(): string {
    return this.keyManager.activeItem.item.label;
  }

  setNextItemActive(): void {
    this.keyManager.setNextItemActive();
  }

  setPreviousItemActive(): void {
    this.keyManager.setPreviousItemActive();
  }

  checkout(): void {
    this.onMessage.emit({ command: 'checkout', text: this.getLabel() });
  }

  createBranch(): void {
    this.onMessage.emit({ command: 'new', text: 'New Branch' });
  }

  deleteBranch(): void {
    this.onMessage.emit({ command: 'delete', text: this.getLabel() });
  }
}
