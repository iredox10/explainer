# Agent Guidelines: Explainer

Welcome to the **Explainer** codebase. This is a visual journalism platform built with **Astro**, **React**, and **Appwrite**. It specializes in "Scrollytelling"—combining deep reporting with cinematic, motion-driven interactive experiences.

---

## 🧞 Essential Commands

All commands should be run using `bun` (preferred) or `npm`.

| Command | Action |
| :--- | :--- |
| `bun dev` | Starts local development server at `localhost:4321` |
| `bun run build` | Builds the production site to `./dist/` |
| `bun run preview` | Previews the production build locally |
| `bun astro check` | Runs type-checking and diagnostics on Astro files |
| `bun scripts/<script>.js` | Runs maintenance/setup scripts (e.g., `setup-appwrite.js`) |

### Testing & Linting
Currently, there are no dedicated test or lint scripts in `package.json`.
- **Linting**: Adhere to existing patterns. Use `bun astro check` for Astro-specific validation.
- **Testing**: No test framework (Vitest/Jest) is integrated. Prioritize manual verification of UI and data flows.
- **Validation Scripts**: Use scripts in `scripts/` (e.g., `check-stories.js`) to verify data integrity in Appwrite.
- **Verification**: After significant changes, run `bun run build` to ensure SSR and type-checking pass.

---

## 🏗️ Project Structure

- `src/pages/`: Astro routes. Follows file-based routing.
- `src/components/`:
    - `admin/`: React-based dashboard for content management and story editing.
    - `ui/`: Reusable, atomic components (Astro and React).
    - `templates/`: Layout-specific story templates (**Standard** vs **Scrolly**).
- `src/lib/`: Core logic and services.
    - `appwrite.js`: Client-side Appwrite configuration.
    - `server-appwrite.js`: Server-side Appwrite (Node SDK) for SSR.
    - `services.js`: Centralized data fetching layer (use this instead of direct SDK calls).
- `src/layouts/`: Global page layouts (e.g., `MainLayout.astro`).
- `scripts/`: Initialization, migration, and maintenance scripts.
- `public/`: Static assets, including fonts and branding icons.

---

## 🎨 Code Style & Conventions

### 1. General Formatting
- **Indentation**: **4 spaces**. (Crucial for consistency across Astro, JS, and JSX files).
- **Quotes**: Single quotes (`'`) for JS/JSX strings; double quotes (`"`) for HTML/Astro attributes.
- **Semicolons**: Always include semicolons.
- **Trailing Commas**: Use in multi-line objects and arrays.

### 2. Naming Conventions
- **Components**: `PascalCase` (e.g., `StoryEditor.jsx`, `MainLayout.astro`).
- **Logic/Services**: `camelCase` (e.g., `appwrite.js`, `authStore.js`).
- **Variables/Functions**: `camelCase`.
- **Constants**: `SCREAMING_SNAKE_CASE` (e.g., `DB_ID`, `COLLECTIONS`).
- **CSS**: Tailwind utility classes are the primary styling mechanism.

### 3. Imports
- Use **relative paths** (e.g., `../../lib/services`).
- Grouping Order:
    1. React/Astro core.
    2. External Libraries (Framer Motion, Lucide).
    3. Internal Services/Store (`@lib`, `@components`).
    4. Local components/assets.

### 4. TypeScript & Types
- Even in `.jsx` files, prioritize defensive typing and clear prop structures.
- In `.astro` files, define interfaces for data structures in the frontmatter.
- Use optional chaining (`?.`) and nullish coalescing (`??`) extensively.

### 5. Error Handling
- Wrap all async operations in `try/catch` blocks.
- Log errors with context: `console.error("[CONTEXT] Description:", error)`.
- **Fail-Safe UI**: Ensure components handle empty states or `null` data gracefully (e.g., `data || []`).

---

## ⚙️ Architectural Patterns

### Appwrite Services
- **SSR vs CSR**: Use `lib/server-appwrite.js` for server-side logic (Astro frontmatter, Middleware) and `lib/services.js` for client-side React components.
- **Sanitization**: Appwrite often fails on empty strings for URL/Email fields. Always sanitize data before saving:
  ```javascript
  if (!data.urlField) delete data.urlField;
  ```

### Scrollytelling Engine
- **Stack**: `react-scrollama` for triggers + `framer-motion` for physics-based animations.
- **Sticky Visuals**: Complex visuals (Maps/Charts) are often "Sticky Islands" that react to the `currentStepIndex` from Scrollama.
- **Maps**: Uses `react-simple-maps` with D3-geo projections. Coordinates are `[Longitude, Latitude]`.
- **Physics**: Map transitions use **Framer Motion Springs** (`damping: 20`, `stiffness: 100`) to create a cinematic "gliding" effect. Avoid abrupt CSS transitions for geographic pans/zooms.

### Astro + React (Islands)
- Use `client:load` for persistent UI (navigation, audio).
- Use `client:only="react"` for complex interactive editors or components that rely on browser-only APIs.
- Pass data from Astro (server) to React (client) via props to minimize redundant client-side fetching.

---

## 🎨 Visual Identity & UI

- **Brand Color**: **Vox Yellow** (`#FAFF00`). Use it for highlights, buttons, and call-to-actions.
- **Typography**: Heavily features Serif headings (`font-serif-display`) and clean Sans body text.
- **Animations**: Prefer **Framer Motion Springs** for a cinematic, weighted feel. Avoid abrupt transitions.
- **Icons**: Use **Lucide React** for all iconography.
- **Tailwind Patterns**:
    - Focus states: `group-focus-within:text-black`.
    - Hover states: `hover:bg-gray-50`.
    - Gradients: `bg-gradient-to-r from-yellow-300 to-yellow-300`.

---

## 📄 Story Data & Schema

When working with story documents in Appwrite, adhere to this structure:

- **Metadata**:
    - `headline`: String (Required)
    - `subhead`: String
    - `slug`: String (URL-safe, auto-generated if missing)
    - `category`: String (e.g., "Politics", "Technology")
    - `status`: "Draft" or "Published"
    - `layout`: "standard" or "scrolly"
    - `heroImage`: URL (Appwrite Storage)
    - `videoUrl`: URL (Direct MP4 link for Hero loops)

- **Content Blocks**:
    Stories are stored as a JSON array of blocks:
    - `p`: Standard paragraph.
    - `heading`: Section divider.
    - `quote`: Blockquote with optional attribution.
    - `callout`: Highlighted info box.
    - `scrolly`: (Only for Scrolly layout) Contains "Steps" for triggers.
    - `center`: `[Lon, Lat]` for map steps.
    - `zoom`: `1-20` for map steps.

---

## 🤖 Agent Safety & Proactivity

- **Secrets**: NEVER commit `.env` files. Update `.env.example` if you introduce new environment variables.
- **Modifications**: Preserve existing comment styles. Use comments to explain *why* complex logic exists, not *what* it does.
- **Proactivity**: If you modify a service in `src/lib/services.js`, check its usage in `src/components/admin` and `src/pages` to ensure no breaking changes.
- **Scripts**: Always check for required environment variables before running any script in `scripts/`.

---

*This document is for internal agents. Maintain consistency to ensure seamless visual journalism.*
