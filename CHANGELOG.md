# Changelog

## Unreleased

- Harden path utilities so malformed field paths are ignored, bracket-notation writes preserve existing arrays, and shape validation treats `Date`, `Map`, `Set`, `RegExp`, `File`, and `Blob` values as opaque leaves.
