# Miguel Campbell personal site
Angular application preserving the BootstrapMade design, images, project detail pages, resume PDF, and custom domain. The original root index.html is retained as the migration source; Angular builds src/index.html.

## Develop
Use Node.js 22.12+ (Node 22 LTS recommended), then `npm ci` and `npm start`. Run `npm run build` for production output in `dist/personal-site/browser`.

## Edit content without code
Open `/#admin`. Without a database, the editor can export content.json; replacing public/content.json and deploying publishes the exported content. With Supabase configured, sign in and select a section, edit its fields, and click Publish changes. Visitors receive published content on their next page load. The editor can add, remove, and reorder projects, education, jobs, skills, stories, interests, links, and tools. Layout changes still require template changes. Images can be hosted externally or referenced using existing asset paths; the editor does not upload files.

## Connect Supabase (one-time setup)
1. Create a Supabase project. Run supabase/schema.sql in its SQL editor once.
2. Create an email/password user in Authentication > Users. Insert that user's UUID into public.site_editors using the commented INSERT at the end of the SQL file. Membership must be granted through the SQL editor; ordinary users cannot grant themselves editing rights. Disable public signups if you do not need them.
3. Put the project URL and **publishable** key in public/content-config.json. Never put a service-role key, secret key, or database password in this repository.
4. Deploy, visit /#admin, sign in, and Publish changes to seed the database with the bundled content.
5. Verify an anonymous visitor can read the site, your editor can publish, and a different authenticated user cannot publish. Database access has not been verified until you complete this setup.

The public site falls back to bundled public/content.json if database reads fail. A blank configuration works entirely without Supabase. All stored text uses Angular interpolation and attribute bindings, not raw HTML rendering. Invalid remote content falls back to the bundled document.

## Deploy to GitHub Pages
In repository Settings > Pages, choose GitHub Actions as the build source. The included workflow builds pushes to main and deploys the Angular output. It preserves CNAME (www.miggledev.com), the resume PDF, existing assets, and project detail pages. No deployment is performed by the local migration itself. If your default branch differs, update the workflow trigger. For a GitHub project URL under /repository/ instead of the custom domain, build with `npm run build -- --base-href /repository/` and update the base path in the workflow accordingly. Hash navigation, including #admin, works without server rewrites.

## Maintenance
public/content.json is a version 2 document with named profile, resume, projects, and other section records. src/app/models/site-content.ts defines the schema used for TypeScript types, validation, and the form editor. The original migration helper is retired. BootstrapMade attribution is preserved. Existing portfolio detail documents remain static.

## Angular structure
- src/main.ts bootstraps the application.
- src/app/app.component.* loads content and selects the public page or admin editor.
- src/app/components/ contains Header, About, Resume, Projects, Contact, Services, Footer, Page, and Admin components, each with its own template. Section hosts use display: contents to retain the original template layout.
- src/app/services/content.service.ts owns content loading, Supabase authentication, publishing, and export.
- src/app/services/page-interactions.service.ts initializes legacy vendor interactions after the page components render.
- src/app/models/site-content.ts defines the shared structured content schema and types.

## Structured content and draft editing
The editor at /#admin uses named sections and list controls instead of numbered fields. Text, color, checkbox, and choice controls match the content type. Language cards show an optional experience description, independent Personal/Academic Projects and Professional Experience labels, an optional summary, and a project link. Older percentage-based imports migrate to the new format. Project platform/status choices control filtering.

Edits live in an isolated draft until Publish changes succeeds. Export content downloads a validated version 2 content.json; Import content accepts version 2 documents and old numbered-field exports. Without Supabase, export before refreshing or leaving to retain your work, then replace public/content.json and redeploy. Discard draft restores the last loaded or published content. Publishing validates the whole document before sending it; invalid imports preserve the existing draft. Image fields accept asset paths or external image URLs; uploads and project detail page editing are not included.

## Existing Supabase projects
If you already applied the previous database schema, run supabase/migrations/002_structured_content.sql once before publishing with this version. It preserves existing rows and access policies while permitting version 2 documents in the existing fields column. The app migrates old numbered-field content on load; your next Publish saves the structured document. New Supabase projects should run schema.sql only. Live database authorization still needs verification after connection.

## Checks
Use Node 22.12+. Run npm run build, then npm test. Browser tests require Playwright Chromium (`npx playwright install chromium`); to use an installed Chrome instead, set PLAYWRIGHT_CHANNEL=chrome. Tests cover legacy-content migration, validation, public navigation and filtering, editor list operations and import/export, and invalid-remote fallback. npm run test:model runs model checks only. The test server uses Python 3 on port 4300 and serves the production build.
