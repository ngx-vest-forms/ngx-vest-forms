---
name: form-arrays
description: Repeating rows in an ngx-vest-forms form (phone numbers, addresses, line items) with `arrayToObject`, `objectToArray`, `ngModelGroup` per row, add/remove, and Vest `each()`. Read it for any list the user can grow or shrink.
---

# ngx-vest-forms form arrays

Template-driven forms address controls by name, so a list lives in the Form Model as an object keyed by index (`{ 0: …, 1: … }`), not as an array. The Field Path of an item is dotted: `phones.values.0`, `addresses.1.street`.

## Wire a list

1. **Load:** convert API arrays with `arrayToObject(list)` (one level) or `deepArrayToObject(value)` (every nested array) before setting the `formValue` signal.
2. **Render:** iterate with `@for (item of formValue().phones?.values | keyvalue: byNumericKey; track item.key)` inside an `ngModelGroup`, and give each control `name="{{ item.key }}"`, or wrap each row in `ngModelGroup="{{ item.key }}"` when a row has several fields. `keyvalue` sorts keys as strings, so pass a numeric comparator or row `10` renders before row `2`:

   ```ts
   const byNumericKey = (
     a: KeyValue<string, unknown>,
     b: KeyValue<string, unknown>
   ) => Number(a.key) - Number(b.key);
   ```

3. **Add or remove:** build the new list from `Object.values(current)`, push or filter, and write `arrayToObject(next)` back through the model signal (or an output the parent applies). Re-keying keeps indices contiguous. The input for a new row that is not yet part of the model binds with `[ngModelOptions]="{ standalone: true }"`.
4. **Clean up removed rows:** re-keying shifts every row after the removed one, so call `removeField()` on the `FormDirective` for each old path from the removed index to the old last index (removing row 3 of 6: `phones.values.3` through `phones.values.5`), then `triggerFormValidation()` so the remaining rows are validated under their new paths.
5. **Validate:** iterate the same values in the suite with `each()` and name each test with the item's Field Path:

   ```ts
   const phones = Object.values(model.phones?.values ?? {});
   test('phones', 'Add at least one phone number', () => {
     enforce(phones.length).greaterThan(0);
   });
   each(phones, (phone, index) => {
     test(`phones.values.${index}`, 'Enter a phone number', () => {
       enforce(phone).isNotBlank();
     });
   });
   ```

6. **Save:** convert back with `objectToArray(formValue, ['values', 'addresses', 'phones'])`, listing every key that holds a converted list at any depth. An emptied list `{}` comes back as `[]`.

Errors for items arrive under dotted keys (`errors['phones.values.0']`). A list-level rule such as "at least one" belongs on the list's own path (`phones`), shown by an `<ngx-form-group-wrapper>` around the list.

## Rows in a child component

A row or list component follows the child-components rules: `viewProviders: [vestFormsViewProviders]`, the full path prefix passed in, and ids derived from the prefix and key so repeated rows stay unique. See [`../child-components/SKILL.md`](../child-components/SKILL.md).

## References

- [`arrayToObject` / `objectToArray` reference](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/packages/ngx-vest-forms/src/lib/utils/README.md#arrayobject-conversion)
- Example: [`phonenumbers.component`](https://github.com/ngx-vest-forms/ngx-vest-forms/tree/master/apps/examples/src/app/ui/phonenumbers) and its suite [`phonenumber.validations.ts`](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/apps/examples/src/app/shared/validations/phonenumber.validations.ts)
