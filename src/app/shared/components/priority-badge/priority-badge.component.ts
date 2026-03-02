import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import type { IssuePriority } from '../../../models';

@Component({
  selector: 'app-priority-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      [class]="colorClass()"
    >
      {{ label() }}
    </span>
  `,
})
export class PriorityBadgeComponent {
  readonly priority = input.required<IssuePriority>();

  protected label = computed(() => {
    const p = this.priority();
    return p.charAt(0).toUpperCase() + p.slice(1);
  });

  protected colorClass = computed(() => {
    const colors: Record<IssuePriority, string> = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-red-100 text-red-800',
    };
    return colors[this.priority()];
  });
}
