# Frontend Conventions

### Imports
- Use aliases: `@/`, `@features/`, `@shared/`, `@pages/`, `@config/`, `@context/`
- Prefer feature/shared root imports for normal consumption
- Avoid deep relative imports like `../../../`
- Be careful with barrel imports in startup-critical files such as route config, context providers, and shared layout components
- If a file participates in app startup, prefer direct imports over barrel imports to avoid circular dependencies

### File Naming
- Components: `PascalCase.tsx` (e.g. `ButtonVoiceRoom.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g. `useLiveKit.ts`)
- Context: keep one clear naming pattern and use it consistently across the project
- Services: keep one clear naming pattern and use it consistently across the project
- Folders: use one folder naming style consistently across the project

### Pages
- Route screens live in `src/pages/`
- Organize pages by area:
  - `src/pages/public/`
  - `src/pages/admin/`
  - `src/pages/user/`
- Pages should stay thin and mostly compose `@features/*` and `@shared/*`
- Do not put heavy business logic directly in page files unless it is route-specific

### Adding a New Page
1. Create the page file under the correct `src/pages/[area]/` folder
2. Export it from `src/pages/index.ts`
3. Add its path constant to `src/config/routes.manifest.ts`
4. Register it in `src/config/routes.config.tsx`
5. If needed, add/update its sidebar entry in `src/config/menu.config.tsx`

### Page Shell
- Keep page structure consistent across pages
- Standard page order should be:
  1. page shell
  2. page header
  3. page content area
- Reuse shared layout primitives such as `PageHeader` and shared content containers
- Even placeholder pages should use the same shell as fully built pages

### Adding New Features
1. Create folder: `src/features/[feature-name]/`
2. Add `index.ts` as the public API
3. Export only what other modules should use
4. Keep internal files private and imported directly only inside the feature

### Adding Shared Code
- UI components → `src/shared/ui/`
- Layout components → `src/shared/layout/`
- Types → `src/shared/types/`
- Utilities/constants/mocks → `src/shared/lib/`

### Routing
- `src/config/routes.manifest.ts` is the source of truth for route paths
- `src/config/routes.config.tsx` maps paths to page components
- `src/pages/index.ts` is the public export layer for page components

### Sidebar
- Sidebar entries are configured in `src/config/menu.config.tsx`
- Shared sidebar UI belongs in `src/shared/layout/` and related shared UI files
- Keep admin and user menu configs separate when their navigation differs

