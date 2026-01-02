# Agent Guidelines: Explainer

Welcome to the **Explainer** codebase. This is a visual journalism platform built with **Astro**, **React**, and **Appwrite**. It specializes in "Scrollytelling"—combining deep reporting with cinematic, motion-driven interactive experiences.

---

## 🧞 Essential Commands

All commands should be run using `bun` (preferred) or `npm`.

| Command | Action |
| :--- | :--- |
| `bun dev` | Starts local development server at `localhost:4321` |
| `bun run build` | Builds the production site to `./dist/` (Checks types & SSR) |
| `bun run preview` | Previews the production build locally |
| `bun astro check` | Runs type-checking and diagnostics on Astro files |
| `bun scripts/<script>.js` | Runs maintenance scripts (see Scripts section below) |

### Testing & Verification
There is currently **no automated test framework** (Vitest/Jest) integrated.
- **Manual Verification**: Test UI interactions and data flows manually in the browser.
- **Build Check**: Always run `bun run build` before committing significant changes to ensure SSR and type-checking pass.
- **Data Integrity**: Use maintenance scripts in `scripts/` (e.g., `check-stories.js`) to verify Appwrite collection health.
- **Astro Diagnostics**: Use `bun astro check` to catch prop-type mismatches in Astro components.

---

## 🏗️ Project Structure

- `src/pages/`: Astro routes. Follows file-based routing.
- `src/components/`:
    - `admin/`: React-based dashboard for content management.
    - `ui/`: Reusable, atomic components (Astro and React).
    - `templates/`: Layout-specific story templates (**Standard** vs **Scrolly**).
- `src/lib/`: Core logic and services.
    - `appwrite.js`: Client-side Appwrite SDK configuration.
    - `server-appwrite.js`: Server-side Appwrite (Node SDK) for SSR.
    - `services.js`: Centralized data fetching layer (preferred over direct SDK calls).
- `src/layouts/`: Global page layouts (e.g., `MainLayout.astro`).
- `scripts/`: Initialization, migration, and maintenance scripts.
- `public/`: Static assets, including fonts and branding icons.

---

## 🎨 Code Style & Conventions

### 1. Formatting
- **Indentation**: **4 spaces**. Strict adherence is required for consistency across Astro, JS, and JSX files.
- **Quotes**: Single quotes (`'`) for JS/JSX strings; double quotes (`"`) for HTML/Astro attributes.
- **Semicolons**: Always include semicolons.
- **Trailing Commas**: Required in multi-line objects and arrays.

### 2. Naming Conventions
- **Components**: `PascalCase` (e.g., `StoryEditor.jsx`, `MainLayout.astro`).
- **Logic/Services**: `camelCase` (e.g., `appwrite.js`, `authStore.js`).
- **Service Instances**: `camelCase` (e.g., `storyService`, `serverStoryService`).
- **Constants**: `SCREAMING_SNAKE_CASE` (e.g., `DB_ID`, `COLLECTIONS`).
- **Styles**: Tailwind utility classes are the primary styling mechanism.

### 3. Imports
- **Relative Paths Only**: No path aliases are configured. Use `../../lib/services`, not `@lib/services`.
- **Grouping Order**:
    1. React/Astro core imports.
    2. External Libraries (Framer Motion, Lucide, etc.).
    3. Internal Services/Store (from `src/lib`).
    4. Local components/assets.

### 4. TypeScript & Types
- **Astro**: Define `interface` for props and data structures in the frontmatter.
- **React**: Even in `.jsx`, use descriptive prop names and defensive null checks.
- **Defensive Coding**: Use optional chaining (`?.`) and nullish coalescing (`??`) extensively.

### 5. Error Handling
- Wrap all async operations (Appwrite calls, file I/O) in `try/catch` blocks.
- Log errors with context: `console.error("[SERVICE_NAME] Description:", error)`.
- **Graceful Degeneracy**: Ensure UI handles empty/null data: `const list = data || [];`.

---

## ⚙️ Architectural Patterns

### Appwrite Services
- **SSR vs CSR**: Use `lib/server-appwrite.js` for server-side logic (Astro frontmatter, Middleware) and `lib/services.js` for client-side React components.
- **Data Sanitization**: Appwrite rejects empty strings for certain field types. Sanitize before saving:
  ```javascript
  const cleanData = { ...data };
  if (!cleanData.url) delete cleanData.url;
  ```

### Scrollytelling Engine
- **Stack**: `react-scrollama` for triggers + `framer-motion` for animations.
- **Sticky Visuals**: Complex interactive elements (Maps/Charts) should be implemented as "Sticky Islands" responding to `currentStepIndex`.
- **Map Transitions**: Use **Framer Motion Springs** (`damping: 20`, `stiffness: 100`) for geographic pans. Avoid jumpy CSS transitions.

### Astro + React (Islands)
- Use `client:load` for persistent UI (navigation, audio).
- Use `client:only="react"` for complex interactive editors or components that rely on browser-only APIs.
- Pass data from Astro (server) to React (client) via props to minimize redundant client-side fetching.

---

## 🛠️ Maintenance Scripts

The `scripts/` directory contains critical maintenance and setup utilities:
- `setup-appwrite.js`: Initializes collections and attributes in Appwrite.
- `seed-articles.js`: Populates the database with initial mock content.
- `check-stories.js`: Validates the integrity of story documents and their JSON content.
- `fix-schema.js`: Migrates documents to new schema versions.
- `create-admin.js`: Utility for creating new administrative users.

Always run these scripts using `bun scripts/<name>.js` and ensure `.env` is properly configured.

---

## 📄 Story Data & Schema

When working with story documents in Appwrite, adhere to this structure:
- **Metadata**: `headline`, `subhead`, `slug`, `category`, `status` ("Draft"|"Published"), `layout` ("standard"|"scrolly").
- **Content Blocks**: Stored as a JSON array of objects with `type`:
    - `p`: Standard paragraph.
    - `heading`: Section divider.
    - `quote`: Blockquote with optional `author` attribution.
    - `image`: Visual asset with `url` and optional `caption`.
    - `callout`: Highlighted info box with `title` and `text`.
    - `beforeAfter`: Image comparison with `leftImage`, `rightImage`, and labels.
- **Scrolly Sections**: JSON array containing visual triggers:
    - `type`: "map", "chart", or "text".
    - `center`: `[Lon, Lat]` for map steps.
    - `zoom`: `1-20` for map steps.
    - `highlight`: Geographic ID for map highlights.
    - `text`: Narrative content displayed during this step.

---

## 🎨 Visual Identity

- **Brand Color**: **Vox Yellow** (`#FAFF00`).
- **Typography**: Serif headings (`font-serif-display`) + Sans body text.
- **Icons**: Always use **Lucide React**.
- **Tailwind**: Use `group` and `peer` classes for complex hover/focus states.
- **Animations**: Prefer `framer-motion` for transitions. Use `animate-in` for entering elements.

---

## 🤖 Agent Safety & Proactivity

- **Secrets**: NEVER commit `.env`. Add new variables to `.env.example`.
- **Scope**: If modifying a service in `src/lib/services.js`, check all consumers in `src/components/admin` and `src/pages`.
- **Documentation**: Update `WRITING_EXPLAINERS.md` if changing the story JSON schema.

---

*This document is for internal agents. Maintain consistency to ensure seamless visual journalism.*
