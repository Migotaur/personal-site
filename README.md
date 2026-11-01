# Miguel Campbell personal site
Angular application preserving the BootstrapMade design, images, project detail pages, resume PDF, and custom domain. The original root index.html is retained as the migration source; Angular builds src/index.html.

## Develop
Use Node.js 22.12+ (Node 22 LTS recommended), then `npm ci` and `npm start`. Run `npm run build` for production output in `dist/personal-site/browser`.

## Edit content without code
Open `/#admin`. Without a database, the editor can export content.json; replacing public/content.json and deploying publishes the exported content. With Supabase configured, sign in and select a section, edit its fields, and click Publish changes. Visitors receive published content on their next page load. Layout changes and adding/removing project cards still require template changes. Images can be hosted externally or referenced using existing asset paths; the editor does not upload files.

## Connect Supabase (one-time setup)
1. Create a Supabase project. Run supabase/schema.sql in its SQL editor once.
2. Create an email/password user in Authentication > Users. Insert that user's UUID into public.site_editors using the commented INSERT at the end of the SQL file. Membership must be granted through the SQL editor; ordinary users cannot grant themselves editing rights. Disable public signups if you do not need them.
3. Put the project URL and **publishable** key in public/content-config.json. Never put a service-role key, secret key, or database password in this repository.
4. Deploy, visit /#admin, sign in, and Publish changes to seed the database with the bundled content.
5. Verify an anonymous visitor can read the site, your editor can publish, and a different authenticated user cannot publish. Database access has not been verified until you complete this setup.

The public site falls back to bundled public/content.json if database reads fail. A blank configuration works entirely without Supabase. All stored text uses Angular interpolation and attribute bindings, not raw HTML rendering.

## Deploy to GitHub Pages
In repository Settings > Pages, choose GitHub Actions as the build source. The included workflow builds pushes to main and deploys the Angular output. It preserves CNAME (www.miggledev.com), the resume PDF, existing assets, and project detail pages. No deployment is performed by the local migration itself. If your default branch differs, update the workflow trigger. For a GitHub project URL under /repository/ instead of the custom domain, build with `npm run build -- --base-href /repository/` and update the base path in the workflow accordingly. Hash navigation, including #admin, works without server rewrites.

## Maintenance
public/content.json contains editable fields extracted from the original page. src/page.html binds them by stable keys. Do not rerun scripts/migrate.mjs after editing templates or database content: it is a one-time migration helper and regenerates those keys. BootstrapMade attribution is preserved. Existing portfolio detail documents remain static.
