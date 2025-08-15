# ngx-vest-forms/core

This is the **core entry point** for ngx-vest-forms. It provides the essential form directive and core functionality, and is re-exported by the main package (`ngx-vest-forms`).

- For documentation, usage examples, and migration instructions, see the [main README](../../../../README.md).
- For migration from v1, see the [Migration Guide](../../../../docs/MIGRATION_GUIDE_V2.md) and [Breaking Changes Overview](../../../../docs/BREAKING_CHANGES_PUBLIC_API.md).

---

**Note:** Most users should import from `ngx-vest-forms` or `ngx-vest-forms/core` for core features. Use secondary entry points for advanced features (schemas, smart state, control wrapper).

Dev-time template checks with `_shape`:

- If you wrap a plain object using `ngxModelToStandardSchema`, the schema includes a private `_shape` copy of the template. In development, the form directive can leverage this to detect typos in `ngModel`/`ngModelGroup` names.
- Standard Schema libraries (Zod, Valibot, ArkType) don’t include `_shape`; submit-time validation is unaffected.
- See `ngx-vest-forms/schemas` README for details and v1 migration notes.
