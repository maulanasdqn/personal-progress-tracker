import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'app-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
  template: `
    @if (open()) {
      <div class="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
        <div class="flex min-h-screen items-center justify-center p-4">
          <!-- Backdrop -->
          <div
            class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            (click)="onBackdropClick()"
            aria-hidden="true"
          ></div>

          <!-- Dialog panel -->
          <div
            class="relative w-full transform overflow-hidden rounded-lg bg-white shadow-xl transition-all sm:max-w-lg"
            [class]="sizeClass()"
          >
            <!-- Header -->
            <div class="border-b border-gray-200 px-4 py-4 sm:px-6">
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-medium text-gray-900">{{ title() }}</h3>
                <button
                  type="button"
                  class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  (click)="close.emit()"
                  aria-label="Close dialog"
                >
                  <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Content -->
            <div class="px-4 py-5 sm:p-6">
              <ng-content></ng-content>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class DialogComponent {
  readonly open = input.required<boolean>();
  readonly title = input.required<string>();
  readonly size = input<'sm' | 'md' | 'lg' | 'xl'>('md');

  readonly close = output<void>();

  protected sizeClass(): string {
    const sizes = {
      sm: 'sm:max-w-sm',
      md: 'sm:max-w-lg',
      lg: 'sm:max-w-2xl',
      xl: 'sm:max-w-4xl',
    };
    return sizes[this.size()];
  }

  protected onBackdropClick(): void {
    this.close.emit();
  }

  protected onEscape(): void {
    if (this.open()) {
      this.close.emit();
    }
  }
}
