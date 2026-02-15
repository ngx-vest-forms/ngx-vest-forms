---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics.
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work - the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, Angular) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Angular Component Patterns

When building Angular components:
- Use **standalone components** (default in Angular 21)
- Use **signals** (`signal()`, `computed()`) for reactive state
- Use `@let` in templates for local variables
- Use `host` metadata for root element styling instead of wrapper divs
- Use `ChangeDetectionStrategy.OnPush` for performance
- Use CSS `:host` for component-level styling
- Use **Tailwind v4** with CSS-first config (`@theme`, `@utility`, `@import 'tailwindcss'`)

## Modern CSS Techniques

Leverage the 2025/2026 baseline:
- **Container queries** (`@container`) for component-level responsiveness
- **oklch colors** for perceptually uniform palettes with wide gamut
- **CSS layers** (`@layer`) for specificity control
- **Native `<dialog>`** for modals (no z-index management)
- **Popover API** for tooltips and non-modal overlays
- **View Transitions API** for smooth route/page transitions
- **Anchor positioning** for tooltips (progressive enhancement)
- **`color-scheme: light dark`** for native dark mode primitives

## Frontend Aesthetics Guidelines

Focus on:
- **Typography**: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics; unexpected, characterful font choices. Pair a distinctive display font with a refined body font.
- **Color & Theme**: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- **Motion**: Use animations for effects and micro-interactions. Prioritize CSS-only solutions (transitions, keyframes, View Transitions API). For Angular, use CSS animations rather than `@angular/animations` (deprecated). Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.
- **Spatial Composition**: Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.
- **Backgrounds & Visual Details**: Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

NEVER use generic AI-generated aesthetics like overused font families (Inter, Roboto, Arial, system fonts), cliched color schemes (particularly purple gradients on white backgrounds), predictable layouts and component patterns, and cookie-cutter design that lacks context-specific character.

Interpret creatively and make unexpected choices that feel genuinely designed for the context. No design should be the same. Vary between light and dark themes, different fonts, different aesthetics. NEVER converge on common choices (Space Grotesk, for example) across generations.

** Note
If there are already pre-existing design assets, typography, branding, or style guides, use those as a starting point but still push for creative interpretation and unexpected choices within that framework. Don't just copy existing styles - elevate them with your own design sensibility. But make sure to honor any established design language and maintain cohesion with existing assets. And if there are Figma files, use them as true inspiration. Don't just copy the styles - understand the design intent and reimagine it in your own way that fits the context and requirements.

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

Remember: Claude, Gemini and GPT are capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.
