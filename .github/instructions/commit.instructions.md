# Copilot Commit Instructions

## Commit Messages

### 1. Adhere to the Conventional Commits Specification

#### a. Structure

- `<type>(<scope>): <description> [optional body] [optional footer]`

#### b. Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, whitespace, etc.)
- **refactor**: Code restructuring (no functional changes)
- **test**: Test-related changes (adding, modifying, or removing tests)
- **chore**: Miscellaneous tasks (build, dependencies, configuration changes)
- **build**: Changes related to the build system or dependencies (e.g., `package.json`, `Dockerfile`, `.vscode/*`)
- **ci**: Changes related to Continuous Integration/Continuous Deployment pipelines
- **perf**: Performance improvements
- **revert**: Revert a previous commit

#### c. Scope

- Context of the change. Use a concise, lowercase name related to the relevant part of the codebase. Preferably based on the project structure.
- **Examples**:
  - `user-authentication`
  - `product-page`
  - `api`
  - `vonnis/raadplegen`
  - `ui/button`
- Use the `project.json` name or a small part of the domain/folder structure for consistency and easy searching.

#### d. Description (Summary)

- Concise and clear, under 80 characters.
- Written in the imperative mood (e.g., "Add login form", "Fix button alignment").
- Completes the sentence: "This commit will..." (e.g., "This commit will add disabled button styling").
- Use a single line for the summary. If you need to provide more details, use the body section.

#### e. Body

- Provide a more detailed explanation of the changes.
- Explain the "why" and "how."
- Use multiple paragraphs if needed.
- Can include code snippets or examples.
- Don't do this per file, but per functionality. For example, if you change the button and the input field, use `ui/button` as scope and describe both changes in the description.

#### f. Footer

- References to issues (e.g., `Closes #123`, `See #456 for more details`).
- Pull request links.
- Breaking changes (use `BREAKING CHANGE:` prefix followed by a clear description of the impact, e.g., `BREAKING CHANGE: API endpoint renamed from /users to /customers`).

---

### 2. Keep Commit Messages Concise

#### a. Summary

- Maximum 80 characters. Focus on the core change.

#### b. Body

- Use the body for any additional details that don't fit in the concise summary.

---

### 3. Use the Imperative Mood

#### a. Summary

- Always use the imperative mood (e.g., "Add feature", "Fix bug", "Refactor code").

#### b. Body

- While the imperative mood is generally preferred, the past tense can be used in the body to describe actions that have already been taken as part of the change. Maintain a consistent tone within the body.

---

### 4. Provide Context and Details

#### a. Scope

- Use scopes to clearly identify the affected area of the codebase. This helps with searching, filtering, and understanding the impact of changes.

#### b. Body

- Explain the reasoning behind the changes, any alternative solutions considered, and any trade-offs made.

#### c. Footer

- Link to relevant issues, pull requests, or related documentation.

---

### 5. Separate Subject and Body

- Always include a blank line between the summary (first line) and the body. This improves readability.

---

### 6. Format Messages for Readability

#### a. Line Length

- Keep lines under 72 characters (including in the body and footer) to avoid wrapping in terminals and other tools.

#### b. Lists/Bullet Points

- Use lists or bullet points in the body to organize multiple changes or points. This makes the body easier to scan and understand.

#### c. Paragraphs

- Separate paragraphs with blank lines for better readability, especially in longer commit messages.

---

### LLM-Specific Guidelines

- Generate commit messages based on the changes made in the code.
- Ensure the message is concise, clear, and follows the Conventional Commits format.
- Link to relevant issues or pull requests in the footer when applicable.
- Use the body to explain the "why" and "how" of the changes, especially for complex updates.
