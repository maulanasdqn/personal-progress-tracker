import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="overflow-hidden rounded-xl bg-white shadow" [class]="containerClass()">
      @if (title()) {
        <div class="border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
          <h3 class="text-base font-medium leading-6 text-gray-900 sm:text-lg">{{ title() }}</h3>
        </div>
      }
      <div [class]="padding() ? 'px-4 py-4 sm:px-6 sm:py-6' : ''">
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class CardComponent {
  readonly title = input<string>();
  readonly padding = input<boolean>(true);
  readonly containerClass = input<string>('');
}
