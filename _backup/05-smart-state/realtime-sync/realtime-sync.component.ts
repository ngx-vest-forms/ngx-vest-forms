import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ngx-realtime-sync',
  template: `
    <section class="prose max-w-none">
      <h2>Realtime Sync (Smart State + Zod + Wrapper)</h2>
      <p>
        Goal: Demonstrate realtime collaboration using smart state, Zod schema,
        and ngx-control-wrapper.
      </p>
      <ul>
        <li>WebSocket/polling simulated external updates</li>
        <li>[formSchema] with Zod</li>
        <li>Conflict resolution UI hints</li>
        <li>Optimistic updates with rollback</li>
      </ul>
      <p class="text-sm text-gray-500">Scaffold only — implement next.</p>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RealtimeSyncComponent {
  readonly note = 'Scaffold placeholder — implement next.';
}
