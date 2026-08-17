# SonoMusa Playground — CONCEPT

> **Status:** source-of-truth product/architecture concept for implementation planning.
>
> **Audience:** coding agents and developers.
>
> **Primary goal:** build an evolving, modular, maintainable gallery of SonoMusa projects without coupling the gallery to the visual or technical implementation of any individual project.

---

# 0. How to Read This Document

The keywords below are intentional:

- **MUST** = non-negotiable requirement.
- **SHOULD** = strong default; deviate only with a clear technical reason.
- **MAY** = optional / implementation-dependent.
- Examples are illustrative unless explicitly marked **MUST**.

When generating an implementation plan from this file:

1. preserve the architectural invariants;
2. prefer simple, composable abstractions;
3. avoid project-specific code in shared gallery components;
4. avoid premature infrastructure that does not serve the requirements;
5. explicitly identify any proposed deviation from a **MUST** requirement.

---

# 1. Product Definition

**SonoMusa Playground** is an evolving digital gallery for creative work, experiments, prototypes, interactive pieces, software, audiovisual work, 3D, sound, creative coding, games, visual systems, and future project types not known yet.

It is not intended to be:

- a traditional portfolio;
- a SaaS landing page;
- a simple vertical feed;
- a fixed collection of hand-authored cards;
- a visually homogeneous showcase where every project is forced into the same aesthetic.

The product is best described as:

> **An evolving, immersive digital gallery that curates heterogeneous projects inside a refined editorial system while allowing every project to retain its own identity.**

The work comes first. SonoMusa is the curatorial frame.

---

# 2. Core Product Principles

## 2.1 Precision × Wonder

The experience combines:

- **Precision:** structure, typography, hierarchy, spacing, consistency, maintainability, predictable interaction.
- **Wonder:** discovery, movement, live previews, depth, experimentation, surprise.

Neither side should dominate.

---

## 2.2 Editorial Shell, Immersive Core

This is the most important visual and architectural rule.

### SonoMusa owns

- navigation;
- typography;
- spacing;
- metadata presentation;
- project numbering;
- gallery interactions;
- transitions;
- controls;
- neutral framing;
- accessibility;
- responsive behavior.

### Individual projects own

- visual language;
- colors;
- sound;
- rendering technology;
- interaction model;
- internal typography;
- animation style;
- technical implementation.

> **SonoMusa MUST curate projects without visually homogenizing them.**

---

## 2.3 Evolution Is a First-Class Requirement

The system MUST be designed for a project collection that continuously changes.

It must work with:

- 3 projects;
- 10 projects;
- 50 projects;
- many more later.

The system MUST tolerate:

- new project categories;
- new preview technologies;
- new metadata fields;
- new presentation needs;
- projects that are no longer online;
- projects hosted externally;
- projects that need an iframe;
- projects implemented directly inside the repository;
- projects that only have screenshots;
- projects whose visual identity is radically different from all previous work.

A future project SHOULD be addable without redesigning the gallery or editing shared UI logic.

---

# 3. Non-Negotiable Architectural Invariants

The following are **MUST** requirements.

## 3.1 Single Project Contract

Every project displayed anywhere in the Playground MUST conform to one common, versioned project contract.

The gallery MUST NOT consume arbitrary project-specific objects.

The contract MUST be:

- statically typed;
- runtime validated;
- versionable;
- extensible;
- serializable wherever practical;
- documented;
- independent from a specific UI component.

---

## 3.2 Single Source of Truth

A project's manifest MUST be the primary source used to derive:

- gallery entries;
- project index entries;
- routes;
- SEO metadata;
- screenshots;
- preview mode;
- project status;
- featured state;
- tags/categories;
- ordering;
- external links.

The same metadata MUST NOT be duplicated manually in multiple unrelated files.

---

## 3.3 No Project-Specific Branches in Shared Gallery UI

Shared gallery components MUST NOT contain logic such as:

```ts
if (project.slug === 'morphwave') { ... }

if (project.slug === 'musai') { ... }
```

Adding a project MUST NOT require modifying:

- the carousel implementation;
- the project index component;
- common project cards;
- generic route logic;
- navigation logic.

Exceptions are allowed only for explicitly isolated custom project modules.

---

## 3.4 Runtime Validation

Static TypeScript types are not sufficient.

Project manifests MUST be validated at runtime.

**Zod is the preferred baseline library.**

Validation SHOULD happen:

- when content is loaded;
- during development;
- during CI/build;
- through a dedicated validation command.

Invalid project content SHOULD fail loudly before deployment.

Recommended command:

```bash
bun run validate:content
```

---

## 3.5 Versioned Content Schema

The project contract MUST contain a schema version.

Example:

```ts
schemaVersion: 1
```

This enables future schema changes without silently breaking old project definitions.

When the schema evolves, the architecture SHOULD support:

- migration;
- adapters;
- backwards-compatible parsing;
- explicit rejection of unsupported versions.

Avoid assuming the first project schema will remain unchanged forever.

---

# 4. Technology Baseline

The project MUST use:

- **Next.js — latest stable release available when implementation begins**
- **App Router**
- **TypeScript**
- **Bun** as runtime and package manager

Recommended commands:

```bash
bun install
bun dev
bun run build
bun start
```

TypeScript SHOULD run in strict mode.

The implementation SHOULD follow current Next.js App Router conventions rather than legacy Pages Router patterns.

---

# 5. Library Philosophy

The project SHOULD use focused libraries when they materially improve correctness, maintainability, accessibility, or interaction quality.

Avoid both extremes:

- rebuilding every solved problem manually;
- adding large dependency stacks without a concrete need.

## 5.1 Runtime Validation

Preferred:

```text
zod
```

Use cases:

- project manifests;
- preview configuration;
- environment variables;
- API payloads if introduced later;
- parsed external content.

---

## 5.2 Environment Validation

Environment variables SHOULD be validated at startup/build time.

This MAY use:

- Zod directly;
- a thin environment helper built around Zod;
- a mature Next.js environment-validation library.

Do not access unvalidated environment variables throughout the codebase.

---

## 5.3 Motion

A mature animation library MAY be used for:

- carousel transitions;
- enter/exit states;
- layout transitions;
- reduced-motion-aware interactions.

The library SHOULD support clean React composition and accessibility.

Do not introduce WebGL solely to make the navigation feel advanced.

---

## 5.4 Carousel / Gesture Infrastructure

A dedicated carousel/gesture library MAY be used if it provides:

- robust dragging;
- pointer/touch support;
- momentum;
- accessibility;
- predictable snapping.

However, the visual model is custom.

The product MUST NOT inherit a generic "carousel look" simply because a library is used underneath.

---

## 5.5 State Machines

A state-machine library MAY be introduced if preview lifecycle or gallery interaction becomes sufficiently complex.

Do not introduce one preemptively.

For simple state, prefer local React state/reducers.

---

# 6. Clean Design Patterns

The architecture MUST optimize for comprehension by future humans and coding agents.

Prefer:

- composition over inheritance;
- small focused modules;
- pure domain functions where practical;
- explicit data boundaries;
- dependency inversion around project loading;
- adapters for variant behavior;
- discriminated unions for preview modes;
- centralized validation;
- shared design tokens;
- feature-oriented organization.

Avoid:

- giant "god components";
- deeply nested prop drilling;
- scattered `switch` statements for preview behavior;
- duplicated project metadata;
- hard-coded project arrays inside UI components;
- hidden side effects;
- premature generalized frameworks;
- abstractions with only one accidental use case.

---

# 7. Recommended Domain Separation

The conceptual layers should remain distinct.

```text
Project Content
      ↓
Validation / Parsing
      ↓
Project Domain Model
      ↓
Project Registry / Repository
      ↓
Selectors / Queries
      ↓
Gallery / Index / Routes / SEO
      ↓
Preview Renderer Adapters
```

The domain model SHOULD NOT depend on React rendering details.

Shared UI SHOULD consume validated domain objects.

---

# 8. Project Registry

The application SHOULD expose one central project registry/repository API.

Conceptually:

```ts
interface ProjectRepository {
  getAll(): Promise<Project[]>
  getBySlug(slug: string): Promise<Project | null>
  getFeatured(): Promise<Project[]>
}
```

The exact API may differ.

The purpose is to prevent project discovery/loading logic from being duplicated throughout the app.

The registry SHOULD be responsible for:

- discovering project manifests;
- validating them;
- normalizing defaults;
- sorting;
- exposing stable queries.

---

# 9. Common Project Format

A project MUST be representable using a common manifest.

A recommended initial contract:

```ts
type Project = {
  schemaVersion: 1

  slug: string
  title: string

  year?: number
  description?: string
  shortDescription?: string

  status: 'live' | 'prototype' | 'archive' | 'wip'

  tags: string[]
  categories?: string[]

  featured?: boolean
  order?: number

  media: {
    poster: string
    thumbnail?: string
    screenshots?: string[]
  }

  preview:
    | {
        kind: 'static'
        src?: string
      }
    | {
        kind: 'video'
        src: string
        poster?: string
      }
    | {
        kind: 'iframe'
        src: string
        sandbox?: string[]
      }
    | {
        kind: 'component'
        componentId: string
      }
    | {
        kind: 'external'
        url: string
      }

  links?: {
    live?: string
    source?: string
    repository?: string
  }

  technologies?: string[]

  credits?: Array<{
    label: string
    value: string
    url?: string
  }>

  presentation?: {
    preferredAspectRatio?: string
    focalPoint?: {
      x: number
      y: number
    }
  }
}
```

This is an initial design, not an immutable final schema.

The important characteristics are:

- one stable core;
- optional extensions;
- preview as a discriminated union;
- explicit versioning;
- limited presentation hints;
- no arbitrary project CSS leaking into the SonoMusa shell.

---

# 10. Zod Schema

The actual project domain contract SHOULD be implemented from a runtime schema.

Conceptually:

```ts
import { z } from 'zod'

const PreviewSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('static'),
    src: z.string().optional(),
  }),

  z.object({
    kind: z.literal('video'),
    src: z.string(),
    poster: z.string().optional(),
  }),

  z.object({
    kind: z.literal('iframe'),
    src: z.string().url(),
    sandbox: z.array(z.string()).optional(),
  }),

  z.object({
    kind: z.literal('component'),
    componentId: z.string(),
  }),

  z.object({
    kind: z.literal('external'),
    url: z.string().url(),
  }),
])

const ProjectSchemaV1 = z.object({
  schemaVersion: z.literal(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  status: z.enum(['live', 'prototype', 'archive', 'wip']),
  tags: z.array(z.string()).default([]),
  preview: PreviewSchema,
  // ...
})

type Project = z.infer<typeof ProjectSchemaV1>
```

The final implementation may refine this.

The key rule is:

> **The runtime schema should be the canonical definition of valid project content.**

Avoid maintaining a handwritten TypeScript type that can drift away from runtime validation.

---

# 11. `defineProject(...)`

A small helper SHOULD be considered.

Example:

```ts
export const project = defineProject({
  schemaVersion: 1,
  slug: 'morphwave',
  title: 'Morphwave',
  // ...
})
```

`defineProject()` may:

- validate with Zod;
- apply defaults;
- preserve type inference;
- provide consistent error messages.

This creates a simple and predictable project-authoring workflow.

---

# 12. Preferred Project Folder Convention

A project SHOULD be self-contained.

Recommended convention:

```text
src/
  content/
    projects/
      morphwave/
        project.ts
        poster.webp
        thumbnail.webp
        screenshots/
          01.webp
          02.webp

      liminal-station/
        project.ts
        poster.webp

      musai/
        project.ts
        poster.webp
```

Optional custom implementations MAY live beside the manifest or inside a dedicated feature module.

For example:

```text
morphwave/
  project.ts
  preview.tsx
  poster.webp
```

The exact filesystem layout may change, but the authoring experience MUST remain predictable.

---

# 13. Adding a Project Must Be Easy

This is a core success criterion.

For a normal project, adding it SHOULD require only:

1. create a project directory;
2. add `project.ts`;
3. add a poster/screenshot;
4. optionally configure a live preview;
5. optionally add a custom project route/body;
6. run validation;
7. deploy.

The developer SHOULD NOT need to manually register the new project in multiple unrelated arrays.

Ideal workflow:

```bash
bun run validate:content
bun dev
```

The new project should then automatically appear wherever its manifest says it belongs.

---

# 14. Optional Project Scaffolding

A small project generator MAY be added later.

Example:

```bash
bun run project:new morphwave
```

It could generate:

```text
src/content/projects/morphwave/project.ts
src/content/projects/morphwave/poster.webp
```

This is optional, but it would reinforce the common project contract as the collection grows.

---

# 15. Preview Architecture

Preview behavior MUST be modular.

Do not implement preview rendering as project-specific code scattered through the gallery.

Use a renderer/adaptor model.

Conceptually:

```ts
const previewRenderers = {
  static: StaticPreview,
  video: VideoPreview,
  iframe: IframePreview,
  component: ComponentPreview,
  external: ExternalPreview,
}
```

A project declares **what kind of preview it has**.

The gallery decides **how that preview kind is rendered**.

This separation makes future preview types possible.

For example, a future schema might add:

```text
webgpu
remote-stream
audio
canvas
```

without redesigning the complete project model.

---

# 16. Component Preview Registry

For locally implemented interactive previews, avoid storing React components directly inside serializable metadata.

Prefer a stable identifier:

```ts
preview: {
  kind: 'component',
  componentId: 'morphwave-preview'
}
```

Then resolve it through an isolated component registry.

Conceptually:

```ts
const componentPreviewRegistry = {
  'morphwave-preview': lazy(() => import(...)),
}
```

This keeps:

- metadata serializable;
- project definitions clean;
- dynamic imports centralized;
- heavy code lazy-loaded.

---

# 17. Heavy Preview Isolation

A project MUST NOT be able to compromise the performance or stability of the gallery.

Heavy previews SHOULD use:

- lazy loading;
- explicit activation;
- sandboxed iframes;
- separate deployments;
- dynamic imports;
- posters before activation;
- unloading when inactive.

The initial homepage MUST NOT eagerly initialize every project preview.

---

# 18. Preview Lifecycle

The architecture SHOULD explicitly model preview state.

Typical states:

```text
idle
loading
ready
active
error
unloaded
```

Shared UI should understand these states generically.

Project-specific code should not redefine the lifecycle.

Errors MUST degrade gracefully to a poster or fallback state.

---

# 19. Static Fallback Is Mandatory

Every project SHOULD provide a poster or screenshot.

A project MUST remain presentable when:

- JavaScript preview fails;
- an external URL is unavailable;
- WebGL/WebGPU is unsupported;
- the user prefers reduced motion;
- mobile performance is insufficient;
- the preview has not yet loaded.

The gallery must never depend on live rendering to communicate that a project exists.

---

# 20. Gallery Concept

The homepage is approximately:

> **70% immersive / 30% informational**

The primary interaction is a **curated depth carousel / spatial gallery**, not a generic row of cards.

At any moment:

- one project is primary;
- neighboring projects remain partially visible;
- hierarchy is expressed with scale, position, opacity, framing, and typography;
- motion is subtle;
- project media remains the visual focus.

The interaction may support:

- wheel;
- trackpad;
- drag;
- touch swipe;
- keyboard arrows;
- explicit previous/next controls.

The implementation MUST remain usable without gesture input.

---

# 21. The Gallery Is Not the Data Model

The project content architecture MUST NOT be designed around one specific carousel.

The same `Project` objects should be usable by:

- immersive homepage gallery;
- project index;
- search;
- filters;
- related-project widgets;
- project routes;
- metadata generation;
- future alternate gallery layouts.

This is critical for evolution.

---

# 22. Revisited Project Cards

Cards should behave as neutral exhibition frames.

The shared frame may control:

- project number;
- title;
- status;
- tags;
- preview viewport;
- navigation affordance;
- frame proportions;
- metadata hierarchy.

The project content itself may be:

- colorful;
- monochrome;
- photographic;
- 3D;
- game-like;
- text-heavy;
- minimal;
- noisy;
- cinematic;
- UI-based.

The shared card MUST NOT force all projects into a fluid/neon/generative aesthetic.

---

# 23. Visual Brand Direction

The visual tone is:

> **Professional + refined + creative + technology-aware, without looking overtly “tech”.**

Approximate balance:

- 35% professional / credible;
- 25% premium / refined;
- 25% creative;
- 15% technological.

Avoid making the shell look like:

- a cyberpunk dashboard;
- an AI startup;
- a gaming interface;
- a WebGL tech demo;
- a generic creative-developer template.

---

# 24. Visual System

Suggested neutral foundation:

- Obsidian: `#0A0A0A`
- Soft Black: `#151515`
- Bone / warm white: approximately `#F0EFEA`
- Steel grey: approximately `#8A8A8A`
- Graphite surfaces
- one optional restrained accent

Accent color is punctuation, not atmosphere.

It may appear in:

- active indicator;
- tiny dot;
- underline;
- focus state;
- navigation selection;
- subtle interaction feedback.

It SHOULD NOT become:

- full-screen gradients;
- glowing fog;
- repeated neon decoration.

---

# 25. Identity Through System, Not Effects

SonoMusa should become recognizable through:

- logo;
- custom typography;
- spacing;
- project numbering;
- framing;
- line weight;
- transition rhythm;
- metadata hierarchy;
- concise writing;
- navigation behavior.

The brand MUST NOT become dependent on:

- fluid waves;
- particles;
- purple glow;
- generative noise;
- a specific 3D shader.

Those may belong to individual projects.

They do not define SonoMusa.

---

# 26. Project Index

The immersive gallery MUST have a scalable rational counterpart.

The **Project Index** should be able to expose all projects.

It may progressively support:

- thumbnails;
- compact list view;
- search;
- tags;
- categories;
- years;
- statuses;
- filters;
- sort.

Do not overbuild taxonomy when the collection is small.

The architecture SHOULD make these capabilities easy to add later.

---

# 27. Filtering and Derived Data

Filter/category logic SHOULD use derived selectors over validated project data.

Do not manually maintain:

```ts
const audioProjects = [...]
const visualProjects = [...]
const featuredProjects = [...]
```

when those groups can be derived from project metadata.

Example:

```ts
getProjectsByTag('audio')
getProjectsByStatus('live')
getFeaturedProjects()
```

Keep derived-data logic centralized and testable.

---

# 28. Project Routes

Each project SHOULD have a stable slug route.

Recommended:

```text
/projects/[slug]
```

Examples:

```text
/projects/morphwave
/projects/liminal-station
/projects/musai
```

A project route may include:

- hero media;
- live experience;
- screenshots;
- description;
- process;
- technical notes;
- credits;
- links;
- related projects.

The route MUST tolerate sparse project data.

Not every project needs every section.

---

# 29. Content vs Custom Project Pages

Two levels of project page should be possible.

## Standard project

Generated from common content blocks and metadata.

## Custom project

A project may optionally provide a custom implementation when the work itself requires a unique presentation.

The custom route must still consume the common validated project metadata.

This preserves both:

- consistency;
- creative freedom.

---

# 30. Server / Client Boundary

Use **Server Components by default**.

Good Server Component candidates:

- project loading;
- metadata;
- index;
- static copy;
- initial project shells;
- SEO.

Use Client Components only where necessary:

- carousel interaction;
- gesture handling;
- active preview lifecycle;
- animated transitions;
- pointer interaction.

Do not convert the entire application into a client-rendered SPA because the gallery is interactive.

---

# 31. Performance Invariants

Performance is architectural, not a final optimization phase.

MUST:

- avoid eagerly mounting all heavy previews;
- lazy-load off-screen media;
- lazy-load custom preview components;
- optimize images;
- provide poster fallbacks;
- avoid unnecessary hydration.

SHOULD:

- prefetch only likely next/previous projects;
- unload inactive heavy previews;
- keep gallery navigation independent from preview runtime;
- use responsive media;
- keep bundle boundaries per preview/project where practical.

---

# 32. Responsive Design

Mobile is not a compressed desktop layout.

Desktop MAY use:

- partial neighboring project visibility;
- spatial composition;
- more generous depth.

Mobile MAY reinterpret this as:

- swipeable full-width frames;
- snap navigation;
- simpler depth;
- fewer simultaneously rendered previews;
- vertical or hybrid navigation.

The conceptual identity must remain:

> **curated gallery, not social feed.**

---

# 33. Accessibility

Experimental design MUST NOT compromise basic accessibility.

MUST support:

- semantic markup;
- keyboard navigation;
- visible focus;
- non-hover interactions;
- accessible project names;
- reasonable contrast;
- touch input;
- reduced-motion behavior.

Live preview controls should communicate state to assistive technologies where appropriate.

---

# 34. Reduced Motion

Respect:

```css
prefers-reduced-motion
```

When enabled:

- large spatial transitions should simplify;
- autoplay movement should be reduced;
- essential state changes remain visible;
- navigation remains complete.

Motion is enhancement, not structure.

---

# 35. Error Boundaries and Resilience

Experimental previews are inherently failure-prone.

Preview failures MUST NOT crash the whole gallery.

Use appropriate:

- React/Next error boundaries;
- iframe isolation;
- fallback posters;
- loading/error states.

The site shell must remain navigable even when an individual project fails.

---

# 36. Validation Pipeline

The project should have an explicit content validation pipeline.

Recommended scripts:

```json
{
  "scripts": {
    "dev": "...",
    "build": "...",
    "typecheck": "...",
    "lint": "...",
    "validate:content": "..."
  }
}
```

CI SHOULD run at minimum:

```bash
bun run validate:content
bun run typecheck
bun run lint
bun run build
```

A malformed project manifest should prevent a production deployment.

---

# 37. Testing Strategy

Testing should target the architecture's contracts.

High-value tests include:

## Unit

- Zod project schemas;
- schema migrations;
- sorting/selectors;
- project registry;
- preview adapter selection.

## Component

- project frame with different project types;
- loading/error preview states;
- reduced-motion behavior.

## E2E

- gallery navigation;
- keyboard navigation;
- opening a project;
- loading a live preview;
- project index;
- adding a representative project fixture.

The goal is not maximum test count.

The goal is confidence that the modular contract remains stable as the gallery evolves.

---

# 38. SEO and Metadata

Project metadata SHOULD drive route metadata automatically.

Each project SHOULD support:

- title;
- description;
- Open Graph image;
- canonical URL.

Example:

```text
Morphwave — SonoMusa Playground
```

Metadata generation SHOULD consume the same validated manifest.

Do not create separate SEO config per project unless genuinely needed.

---

# 39. Asset Conventions

Project assets SHOULD follow predictable conventions.

Recommended:

```text
poster.webp
thumbnail.webp
screenshots/01.webp
screenshots/02.webp
preview.mp4
```

Naming conventions reduce special-case code and improve agent comprehension.

The media layer SHOULD be abstract enough to support remote assets later.

---

# 40. Future Data Sources

The initial project source may be local files.

The domain architecture SHOULD NOT make local files inseparable from the rest of the app.

A future repository could read from:

- filesystem;
- CMS;
- database;
- API;
- remote object storage.

Shared UI should not care where projects came from.

This is a reason to keep the `ProjectRepository` boundary.

Do not build CMS infrastructure until it is actually required.

---

# 41. Migration Strategy

Content evolution must be explicit.

Example future situation:

```text
schemaVersion: 1
```

becomes:

```text
schemaVersion: 2
```

Possible approach:

```ts
parseProject(input)
  -> detect schema version
  -> validate version-specific schema
  -> migrate to current domain model
```

The UI should ideally consume only the current normalized domain model.

This prevents old project manifests from contaminating presentation logic.

---

# 42. Extension Points

The system SHOULD make these future additions possible without structural rewrites:

- new preview types;
- project collections;
- curated exhibitions;
- search;
- advanced filters;
- project relationships;
- collaborators;
- multilingual content;
- CMS-backed content;
- downloadable releases;
- research notes;
- SonoMusa Studio;
- SonoMusAI;
- installations;
- audio-only work.

Do not implement these now unless required.

Design the boundaries so they remain possible.

---

# 43. Anti-Patterns to Reject

The coding agent SHOULD explicitly avoid these patterns.

## Hard-coded gallery

```ts
const projects = [
  morphwave,
  musai,
  ...
]
```

inside a page component with manual visual placement.

## Duplicated metadata

Title in one file, poster in another config, SEO title elsewhere.

## UI-coupled content format

Project schema containing React nodes or arbitrary JSX everywhere.

## Giant preview switch spread across components

```ts
if (...)
else if (...)
else if (...)
```

in several unrelated files.

## Project-specific CSS in global shell

A project should not mutate global brand styles.

## Premature abstraction

Do not create a plugin framework, CMS, event bus, or dependency-injection container without an actual need.

## Visual homogeneity

Do not apply the same neon/fluid/generative effect to every project simply to create consistency.

Consistency comes from the shell.

---

# 44. Suggested Feature-Oriented Structure

Illustrative structure:

```text
src/
  app/
    page.tsx
    projects/
      [slug]/
        page.tsx
    index/
      page.tsx

  features/
    gallery/
      components/
      hooks/
      lib/

    project-preview/
      components/
      renderers/
      registry/

    project-index/
      components/
      lib/

  domain/
    project/
      schemas/
      migrations/
      repository/
      selectors/
      types/

  content/
    projects/
      ...

  components/
    ui/

  styles/
    tokens/
```

The exact names may change.

The separation of responsibilities should not.

---

# 45. Design Tokens

Brand primitives SHOULD be centralized.

Examples:

```text
color
spacing
typography
radii
border width
motion duration
motion easing
z-index
layout width
```

Avoid scattering arbitrary values throughout project shell components.

Individual project experiences may have their own local design systems.

---

# 46. Animation Tokens

Shared SonoMusa motion SHOULD use a small coherent vocabulary.

For example:

- fast UI feedback;
- standard transition;
- slow gallery transition;
- standard easing;
- reduced-motion fallback.

Avoid every component inventing different spring values.

Consistency should come from motion rhythm, not visual effects.

---

# 47. Homepage Information Architecture

The initial homepage should contain:

1. restrained global navigation;
2. concise Playground introduction;
3. immersive primary project gallery;
4. clear project navigation;
5. scalable project index / archive entry point;
6. minimal footer / contextual links.

It should not feel like six stacked marketing sections.

---

# 48. Copy Direction

Writing should be concise.

Prefer:

> A gallery of coded experiences.

> Experiments in sound, code and perception.

> Things made to be experienced.

Avoid:

> Cutting-edge AI-powered experiences redefining creativity.

SonoMusa should sound confident, not promotional.

---

# 49. Success Criteria — Product

The product succeeds if:

1. a new normal project can be added mostly through one manifest + media;
2. adding it does not require editing shared gallery code;
3. all project metadata is validated;
4. the same project contract powers gallery, index, routes, and SEO;
5. heterogeneous projects look intentional together;
6. live previews are optional and isolated;
7. the gallery remains fast as project count increases;
8. visual consistency comes from the shell, not forced project styling;
9. schema evolution is possible without rewriting the application;
10. a coding agent can determine exactly where new project functionality belongs.

---

# 50. Success Criteria — Brand

The desired sequence of impressions:

### First
> “This is refined and intentional.”

### Then
> “There are unusual things to explore.”

### During interaction
> “The interface is interesting but does not compete with the projects.”

### Across different projects
> “These works are very different, but they clearly belong to the same curated space.”

### After leaving
> “I remember SonoMusa, not just a visual effect.”

---

# 51. Definition of Done for the Initial Architecture

Before investing heavily in decorative polish, the first implementation SHOULD prove:

- validated project schema;
- schema versioning;
- central project registry;
- content-driven project discovery;
- one standard static project;
- one live/interactive project;
- reusable project frame;
- preview adapters;
- lazy loading;
- project route generation;
- project index;
- gallery navigation;
- desktop/mobile behavior;
- reduced-motion fallback;
- build-time content validation.

A good architectural test is:

> **Can a new project with a completely different visual identity and preview mode be added without touching the gallery's core implementation?**

If the answer is no, the architecture is not modular enough yet.

---

# 52. Recommended Planning Order for a Coding Agent

When deriving the implementation plan, use this order:

## Phase 1 — Domain Contract

Define:

- `ProjectSchemaV1`;
- preview discriminated union;
- normalized `Project` domain type;
- `defineProject()`;
- schema version strategy.

## Phase 2 — Project Source

Implement:

- project directory convention;
- project discovery;
- registry/repository;
- validation pipeline;
- selectors.

## Phase 3 — Preview System

Implement:

- generic preview interface;
- renderer adapters;
- static fallback;
- lazy loading;
- error isolation;
- optional component registry.

## Phase 4 — Shared SonoMusa Shell

Implement:

- design tokens;
- typography;
- navigation;
- project frame primitives;
- responsive foundations;
- accessibility primitives.

## Phase 5 — Gallery

Implement:

- active project model;
- neighboring project rendering;
- gestures/keyboard controls;
- motion;
- reduced-motion behavior.

## Phase 6 — Project Index and Routes

Implement:

- index from project registry;
- `[slug]` route;
- metadata from manifest;
- standard project page.

## Phase 7 — Validation with Real Projects

Use at least:

- one static project;
- one video project;
- one interactive project if available.

Verify that no project-specific branching leaks into shared gallery code.

## Phase 8 — Polish

Only then refine:

- transitions;
- micro-interactions;
- advanced gallery depth;
- project-specific experiences.

---

# 53. Final Architectural Principle

If there is uncertainty between a visually convenient shortcut and a modular content-driven architecture, prefer the modular architecture.

If there is uncertainty between a generic abstraction and a simple explicit module, prefer the simple explicit module.

If there is uncertainty about where project-specific behavior belongs:

> **Keep the SonoMusa shell generic and isolate the behavior behind the project contract or a dedicated adapter.**

---

# 54. One-Sentence Source of Truth

> **SonoMusa Playground is a modular, content-driven, runtime-validated and evolutive gallery system whose shared shell remains stable while projects, preview technologies, metadata, and visual identities can evolve independently.**
