import { defineExampleContent } from '../../shared/example-content';

export const asyncUsernameContent = defineExampleContent({
  demonstrates: {
    icon: '🌐',
    title: 'What this demonstrates',
    points: [
      'An async Vest test that validates a username against a remote endpoint',
      'Cheap synchronous rules (required, length, pattern) gating the network call via skipWhen',
      'vest/memo keying the async test on the username so it only re-runs when the value changes',
      'Aborting the in-flight request through the Vest-provided AbortSignal when the user keeps typing',
      'Pending state surfaced calmly inline and kept separate from submission state',
      'Submits that land while the check is in flight wait for validation to settle instead of being dropped',
    ],
  },
  learn: {
    title: "What you'll learn",
    sections: [
      {
        title: 'The async validation pattern',
        points: [
          'How skipWhen with res.hasErrors() skips the remote check while a sync rule fails, without repeating the rules',
          'Why memo([username]) prevents redundant requests as other fields change',
          'How takeUntil(fromEvent(signal, "abort")) cancels a stale request on new input',
        ],
      },
      {
        title: 'Surfacing async UI state',
        points: [
          'Debouncing the field with validationOptions so the endpoint is called once typing pauses',
          "Renaming the wrapper's pending message with NGX_PENDING_LABEL (the same token translates it app-wide)",
          'Timing it with [pendingDebounce] and mirroring it with createDebouncedPendingState so the success hint never shows next to it',
          'Waiting for pending() to settle on submit so a mid-flight check never swallows the submission',
          'Deriving a success hint from validated fields plus an empty error list',
          'Keeping the suite a plain Vest spec — the service is injected via a factory',
        ],
      },
    ],
    nextStep: {
      label: 'Next: Custom controls',
      route: 'custom-controls',
    },
  },
});
