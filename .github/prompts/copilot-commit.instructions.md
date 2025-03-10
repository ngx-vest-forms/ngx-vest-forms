# Copilot Commit Message Instructions

This file provides guidelines for writing effective and conventional commit messages when using GitHub Copilot. Following these instructions ensures clear, consistent, and easily understandable commit history, especially when working in collaborative projects. We adhere to the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification, as commonly used in projects like Angular.

## Why Conventional Commits?

Conventional Commits provide a standardized format for commit messages. This structure offers several benefits:

* **Automated Changelogs:** Enables automatic generation of changelogs.
* **Semantic Versioning:** Facilitates semantic versioning based on commit types.
* **Improved Readability:** Enhances the clarity and readability of commit history for developers.
* **Better Collaboration:** Promotes consistency and understanding among team members.

## Conventional Commit Message Structure (Angular Style)

A commit message consists of a **header**, **body**, and **footer**. The header is mandatory and has a specific format. The body and footer are optional.

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 1. Header: `<type>(<scope>): <subject>`

The header line is crucial and follows this structure:

* **`<type>` (Required):** Describes the category of the commit. Choose from the following types:
  * **`feat`**: A new feature.
  * **`fix`**: A bug fix.
  * **`docs`**: Documentation only changes.
  * **`style`**: Changes that do not affect the meaning of the code (white-space, formatting, missing semicolons, etc).
  * **`refactor`**: A code change that neither fixes a bug nor adds a feature.
  * **`perf`**: A code change that improves performance.
  * **`test`**: Adding missing tests or correcting existing tests.
  * **`build`**: Changes that affect the build system or external dependencies (example scopes: gulp, npm, webpack).
  * **`ci`**: Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs).
  * **`chore`**: Other changes that don't modify src or test files.
  * **`revert`**: Reverts a previous commit.

* **`<scope>` (Optional):** Provides context to the commit by specifying the area of the codebase affected. This could be a module, component, route, etc. If the commit impacts the entire application or is not easily scoped, you can omit it.
  * *Example scopes:* `auth`, `user-profile`, `api`, `components/button`, `services/data`.

* **`<subject>` (Required):** A concise description of the change in imperative, present tense.
  * Use lowercase and no dot (.) at the end.
  * Keep it short and to the point (ideally under 50 characters).
  * *Examples:*
    * `feat(auth): implement user login functionality`
    * `fix(user-profile): resolve issue with avatar upload`
    * `docs: update README with installation instructions`

### 2. Body (Optional)

The body provides a more detailed explanation of the commit. Use the body to describe:

* **The motivation for the change.**
* **What was changed and why.**
* **Any details that are too long for the subject.**

Separate the body from the header with a blank line. You can use multiple paragraphs in the body.

### 3. Footer (Optional)

The footer can be used to convey **breaking changes** and **issue references**.

* **Breaking Changes:** If the commit introduces a breaking change, indicate it in the footer with `BREAKING CHANGE:` followed by a description of the breaking change, justification, and migration instructions.

    ```
    BREAKING CHANGE: The API endpoint for user authentication has been changed from /auth to /api/v1/auth.

    Migration instructions: Update all clients to use the new API endpoint /api/v1/auth.
    ```

* **Issue References:** Reference issues related to the commit using keywords like `Closes`, `Fixes`, `Resolves` followed by the issue number.

    ```
    Fixes #123
    Closes #456, #789
    ```

Separate the footer from the body with a blank line.

## Common Mistakes to Avoid

* **No Type or Scope:** Lacks type and scope, making it difficult to understand the category and context of the change.
* **Unclear Subject:** Vague descriptions like "updated code" or "fixed bug" don't provide specific information about what was changed or fixed.
* **No Body or Footer:** Missing details about the change and no issue reference.

## Template

Use the following template to ensure your commit messages follow the correct format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

## Examples

**Good Example:**

```
fix(user-profile): resolve issue with avatar upload

The avatar upload functionality was failing intermittently due to a race condition in the image processing service.

This commit implements a queueing mechanism to ensure images are processed sequentially, resolving the race condition and ensuring reliable avatar uploads.

Fixes #55
```

**Bad Example (Non-Conventional & Unclear):**

```
updated code

fixed bug
```

**Why the Bad Example is Bad:**

* **No Type or Scope:** Lacks type and scope, making it difficult to understand the category and context of the change.
* **Unclear Subject:** "updated code" and "fixed bug" are vague and don't provide specific information about what was changed or fixed.
* **No Body or Footer:** Missing details about the bug and the fix, and no issue reference.

By following these instructions, you can write commit messages that are both Copilot-assisted and adhere to the Conventional Commits specification, leading to a more organized and informative project history.

## Resources

* [Write your Git commits with GitHub Copilot](https://code.visualstudio.com/docs/copilot/copilot-customization)
* [Conventional Commits Specification](https://www.conventionalcommits.org/en/v1.0.0/#summary)
