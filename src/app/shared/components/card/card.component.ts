import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="overflow-hidden rounded-xl bg-white shadow" [class]="containerClass()">
      @if (title()) {
        <div class="border-b border-gray-200 px-5 py-4 sm:px-8">
          <h3 class="text-lg font-medium leading-6 text-gray-900">{{ title() }}</h3>
        </div>
      }
      <div [class]="padding() ? 'px-5 py-6 sm:p-8' : ''">
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
