import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center justify-center" [class]="containerClass()">
      <div
        class="animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"
        [class]="sizeClass()"
        role="status"
        aria-label="Loading"
      ></div>
    </div>
  `,
})
export class LoadingSpinnerComponent {
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly containerClass = input<string>('py-8');

  protected sizeClass(): string {
    const sizes = {
      sm: 'h-4 w-4',
      md: 'h-8 w-8',
      lg: 'h-12 w-12',
    };
    return sizes[this.size()];
  }
}
