import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full">
      @if (showLabel()) {
        <div class="mb-1 flex justify-between text-sm">
          <span class="text-gray-600">Progress</span>
          <span class="font-medium text-gray-900">{{ percentage() }}%</span>
        </div>
      }
      <div
        class="h-2 w-full overflow-hidden rounded-full bg-gray-200"
        role="progressbar"
        [attr.aria-valuenow]="percentage()"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div class="h-full rounded-full transition-all duration-300" [class]="barColor()" [style.width.%]="percentage()"></div>
      </div>
    </div>
  `,
})
export class ProgressBarComponent {
  readonly percentage = input.required<number>();
  readonly showLabel = input<boolean>(true);

  protected barColor = computed(() => {
    const p = this.percentage();
    if (p >= 100) return 'bg-green-500';
    if (p >= 75) return 'bg-blue-500';
    if (p >= 50) return 'bg-yellow-500';
    return 'bg-gray-400';
  });
}
