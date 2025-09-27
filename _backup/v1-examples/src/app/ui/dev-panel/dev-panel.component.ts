import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  isDevMode,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'ngx-dev-panel',
  template: `
    <details
      #detailsRoot
      class="dev-panel"
      [attr.aria-label]="panelLabel() + ' panel'"
      [attr.data-open-default]="defaultOpen() ? true : null"
    >
      <summary class="dev-panel__summary" [attr.aria-expanded]="expanded">
        <span class="dev-panel__dot" aria-hidden="true"></span>
        <span class="dev-panel__title">{{ panelLabel() }}</span>
      </summary>
      <div class="dev-panel__body">
        <pre
          class="dev-panel__pre"
          aria-label="Form state JSON"
        ><code>{{ pretty() }}</code></pre>
        <ng-content />
      </div>
    </details>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block dev-panel-host' },
  styles: [
    `
      :host {
        --surface-radius: var(--radius-lg);
      }
      .dev-panel {
        border-radius: var(--surface-radius);
        box-shadow: none;
        font-family:
          ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
          'Liberation Mono', 'Courier New', monospace;
        overflow: hidden;
        position: relative;
        background: var(--color-surface);
        border: 1px solid transparent;
        background:
          linear-gradient(var(--color-surface), var(--color-surface))
            padding-box,
          linear-gradient(
              120deg,
              color-mix(in srgb, var(--accent-6) 55%, transparent) 0%,
              color-mix(in srgb, var(--accent-5) 35%, transparent) 40%,
              color-mix(in srgb, var(--accent-4) 25%, transparent) 70%,
              color-mix(in srgb, var(--accent-3) 15%, transparent) 100%
            )
            border-box;
      }
      .dev-panel:focus-within {
        outline: 2px solid color-mix(in srgb, var(--accent-6) 55%, transparent);
        outline-offset: 2px;
      }
      .dev-panel__summary {
        list-style: none;
        display: flex;
        gap: 0.5rem;
        align-items: center;
        cursor: pointer;
        padding: 0.5rem 0.75rem;
        font-size: 0.65rem;
        letter-spacing: 0.05em;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--color-text-secondary);
      }
      .dev-panel__summary::-webkit-details-marker {
        display: none;
      }
      .dev-panel[open] .dev-panel__summary {
        color: var(--color-text);
      }
      .dev-panel__dot {
        width: 0.5rem;
        height: 0.5rem;
        border-radius: 50%;
        background: radial-gradient(
          circle at 30% 30%,
          var(--accent-6),
          color-mix(in srgb, var(--accent-6) 40%, transparent)
        );
        box-shadow: 0 0 0 1px
          color-mix(in srgb, var(--accent-6) 55%, transparent);
      }
      .dev-panel__body {
        max-height: 480px;
        overflow: auto;
        padding: 0.75rem 0.75rem 1rem;
      }
      .dev-panel__pre {
        margin: 0;
        font-size: 11px;
        line-height: 1.5;
        background: var(
          --color-surface-alt,
          color-mix(in srgb, var(--accent-1) 20%, transparent)
        );
        border: 1px solid var(--color-border);
        padding: 0.75rem;
        border-radius: calc(var(--surface-radius) - 6px);
        color: var(--color-text);
      }
      .dev-panel__pre code {
        font-family: inherit;
      }
      @media (max-width: 640px) {
        .dev-panel__pre {
          font-size: 10px;
        }
      }
      html.dark .dev-panel__pre {
        background: var(
          --color-surface-alt,
          color-mix(in srgb, var(--accent-1) 40%, transparent)
        );
      }
    `,
  ],
})
export class DevelopmentPanelComponent implements AfterViewInit {
  state = input<unknown | null>(null);
  defaultOpen = input<boolean>(false);
  title = input<string>('Form State');
  @ViewChild('detailsRoot', { static: true })
  private readonly detailsEl?: ElementRef<HTMLDetailsElement>;

  // Expose expanded state for template without making element ref public
  protected get expanded(): boolean | null {
    return this.detailsEl?.nativeElement?.open ?? null;
  }

  protected pretty = computed(() => {
    const snapshot = this.state();
    try {
      return JSON.stringify(snapshot, null, 2);
    } catch {
      return '';
    }
  });

  protected panelLabel = computed(() => {
    const base = this.title();
    return isDevMode() ? base + ' (Dev)' : base;
  });

  // Apply default open only once; allow user to toggle freely afterwards.
  ngAfterViewInit(): void {
    if (this.defaultOpen() && this.detailsEl?.nativeElement) {
      this.detailsEl.nativeElement.open = true;
    }
  }
}
