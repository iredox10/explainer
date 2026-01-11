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

### ✅ Verification & Testing
There is currently **no automated test framework** (Vitest/Jest) integrated. Agents must verify changes using this workflow:
1.  **Build Check**: Always run `bun run build` before committing. This verifies SSR compatibility and TypeScript definitions.
2.  **Schema Validation**: If modifying content structures, check `src/content.config.ts` and run `bun astro check`.
3.  **Data Integrity**: Use `bun scripts/check-stories.js` to verify Appwrite collection health if modifying data layers.
4.  **Manual Verification**: Test UI interactions manually in the browser, especially scroll triggers and map transitions.

---

## 🏗️ Project Structure

- `src/pages/`: Astro routes. Follows file-based routing.
- `src/content/`: Content collections defined in `src/content.config.ts`.
- `src/components/`:
    - `admin/`: React-based dashboard for content management (`client:only="react"`).
    - `ui/`: Reusable, atomic components (Astro and React).
    - `templates/`: Layout-specific story templates (**Standard** vs **Scrolly**).
- `src/lib/`: Core logic and services.
    - `appwrite.js`: Client-side Appwrite SDK configuration.
    - `server-appwrite.js`: Server-side Appwrite (Node SDK) for SSR.
    - `services.js`: Centralized data fetching layer (preferred over direct SDK calls).
- `src/layouts/`: Global page layouts (e.g., `MainLayout.astro`).
- `scripts/`: Initialization, migration, and maintenance scripts.

---

## 🎨 Code Style & Conventions

### 1. Formatting & Imports
- **Indentation**: **4 spaces**. Strict adherence is required.
- **Quotes**: Single quotes (`'`) for JS/JSX strings; double quotes (`"`) for HTML/Astro attributes.
- **Semicolons**: Always include semicolons.
- **Imports**: Relative paths only (`../../lib/services`). Grouping order:
    1. React/Astro core imports.
    2. External Libraries (Framer Motion, Lucide, etc.).
    3. Internal Services/Store (from `src/lib`).
    4. Local components/assets.

### 2. TypeScript & Types
- **Mixed Environment**: The project uses strict TypeScript for Astro/Content Config (`.ts`) and loose JavaScript/JSX for React components (`.jsx`).
- **Astro**: Define `interface` for props in the frontmatter.
- **React**: Use descriptive prop names and defensive null checks (`?.`, `??`).
- **Schema**: `src/content.config.ts` is the source of truth for story data types.

### 3. Naming & Logic
- **Components**: `PascalCase` (e.g., `StoryEditor.jsx`).
- **Services**: `camelCase` (e.g., `storyService`).
- **Error Handling**: Wrap async operations (Appwrite/IO) in `try/catch`. Log errors with context.
- **Graceful Degeneracy**: UI must handle empty/null data without crashing.

---

## ⚙️ Architectural Patterns

### Appwrite Services
- **SSR vs CSR**: Use `lib/server-appwrite.js` for server-side logic (Astro frontmatter) and `lib/services.js` for client-side React.
- **Data Sanitization**: Sanitize objects before saving to Appwrite (remove empty strings/undefined).

### Scrollytelling Engine
- **Stack**: `react-scrollama` (triggers) + `framer-motion` (animations).
- **Sticky Islands**: Interactive elements (Maps/Charts) must be "Sticky Islands" responding to `currentStepIndex`.
- **Transitions**: Use Framer Motion Springs (`damping: 20`, `stiffness: 100`) for smooth pans.

---

## 🛠️ Maintenance Scripts

The `scripts/` directory contains critical maintenance and setup utilities:
- `setup-appwrite.js`: Initializes collections and attributes.
- `check-stories.js`: Validates story document integrity.
- `seed-articles.js`: Populates database with mock content.

**Usage**: `bun scripts/<name>.js`. Ensure `.env` is configured.

---

## 📄 Story Data & Schema

Reference `src/content.config.ts` for the Zod schema source of truth.
- **Metadata**: `headline`, `slug`, `category`, `status`, `layout`.
- **Content Blocks**: JSON array (`p`, `heading`, `quote`, `image`, `callout`, `beforeAfter`).
- **Scrolly Sections**: JSON array for visual triggers (`map`, `chart`) with coordinates and zoom levels.

---

## 🎨 Visual Identity

- **Brand Color**: **Vox Yellow** (`#FAFF00`).
- **Typography**: Serif headings (`font-serif-display`) + Sans body text.
- **Icons**: **Lucide React**.
- **Tailwind**: Use `group` and `peer` classes for complex states.
- **Animations**: `framer-motion` `animate-in` utilities.

---

## 🤖 Agent Safety & Proactivity

- **Secrets**: NEVER commit `.env`. Add new variables to `.env.example`.
- **Scope**: Check all consumers when modifying `src/lib/services.js`.
- **Docs**: Update `WRITING_EXPLAINERS.md` if changing the story JSON schema.

*This document is for internal agents. Maintain consistency to ensure seamless visual journalism.*
