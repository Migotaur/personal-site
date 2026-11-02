// The schema drives the editor, runtime validation, and TypeScript model together.
const text = (required = false) => ({ kind: 'text' as const, required });
const url = (image = false) => ({ kind: 'url' as const, image });
const object = <P extends Record<string, Schema>>(properties: P) => ({ kind: 'object' as const, properties });
const list = <S extends Schema>(item: S) => ({ kind: 'list' as const, item });
const choice = <const T extends readonly string[]>(options: T) => ({ kind: 'choice' as const, options });
const id = { kind: 'id' as const };
const flag = { kind: 'boolean' as const };
const color = { kind: 'color' as const };
export type Schema =
  | { kind: 'text'; required: boolean }
  | { kind: 'url'; image: boolean }
  | { kind: 'object'; properties: Record<string, Schema> }
  | { kind: 'list'; item: Schema }
  | { kind: 'choice'; options: readonly string[] }
  | { kind: 'number'; min: number; max: number }
  | { kind: 'boolean' | 'color' | 'id' | 'version' };
export type Infer<S extends Schema> =
  S extends { kind: 'object'; properties: infer P extends Record<string, Schema> } ? { [K in keyof P]: Infer<P[K]> } :
  S extends { kind: 'list'; item: infer I extends Schema } ? Infer<I>[] :
  S extends { kind: 'choice'; options: readonly (infer O)[] } ? O :
  S extends { kind: 'number' } ? number :
  S extends { kind: 'boolean' } ? boolean :
  S extends { kind: 'version' } ? 2 : string;
const link = object({ label: text(true), url: url() });
const social = object({ label: text(true), url: url(), icon: text() });
const badge = object({ label: text(true), icon: text(), color });
const paragraph = object({ runs: list(object({ text: text(), strike: flag })) });
const resumeEntry = object({ title: text(true), dates: text(), organization: text(), paragraphs: list(text()), bulletsTitle: text(), bullets: list(text()) });
export const siteSchema = object({
  version: { kind: 'version' },
  profile: object({ aliases: list(text(true)), familyName: text(true), fullName: text(true), tagline: list(object({ text: text(), highlighted: flag })), note: text(), featureLink: link, noteSuffix: text(), portrait: url(true), portraitAlt: text(), intro: text(), location: text(), email: text(), role: text(), biography: text() }),
  navigation: object({ home: text(true), about: text(true), resume: text(true), projects: text(true), contact: text(true) }),
  socialLinks: list(social),
  about: object({ title: text(true), subtitle: text(), locationLabel: text(), emailLabel: text(), roleLabel: text(), stories: list(object({ id, image: url(true), imageAlt: text(), chapters: list(object({ title: text(true), paragraphs: list(paragraph) })) })), interestsTitle: text(), interests: list(badge) }),
  resume: object({ title: text(true), subtitle: text(), download: link, downloadSuffix: text(), educationTitle: text(), education: list(resumeEntry), experienceTitle: text(), experience: list(resumeEntry), skillsTitle: text(), skillsNote: text(), skills: list(object({ name: text(true), experience: text(), personalAcademicProjects: flag, professionalExperience: flag, summary: text(), projectUrl: url() })), frameworksTitle: text(), frameworks: list(badge), toolsTitle: text(), tools: list(badge) }),
  projects: object({ title: text(true), subtitle: text(), filters: object({ all: text(), desktop: text(), mobile: text(), web: text(), completed: text(), development: text() }), items: list(object({ id, image: url(true), imageAlt: text(), name: text(true), description: text(), platform: choice(['desktop', 'mobile', 'web']), status: choice(['completed', 'development']), note: text(), noteColor: color, links: list(object({ label: text(true), url: url(), icon: text(), details: flag })) })) }),
  services: object({ title: text(true), subtitle: text(), items: list(object({ title: text(true), description: text(), icon: text(), url: url() })) }),
  contact: object({ title: text(true), subtitle: text(), socialTitle: text(), socialLinks: list(social), emailTitle: text(), email: text() }),
  footer: object({ prefix: text(), url: url(), label: text(true) }),
});
export type SiteContent = Infer<typeof siteSchema>;
export type Project = SiteContent['projects']['items'][number];

export function defaultValue(schema: Schema): unknown {
  switch (schema.kind) {
    case 'object': return Object.fromEntries(Object.entries(schema.properties).map(([key, value]) => [key, defaultValue(value)]));
    case 'list': return [];
    case 'version': return 2;
    case 'id': return crypto.randomUUID();
    case 'number': return 0;
    case 'boolean': return false;
    case 'choice': return schema.options[0];
    case 'color': return '#18d26e';
    default: return '';
  }
}

export function validateContent(value: unknown): asserts value is SiteContent {
  const errors: string[] = [];
  function check(schema: Schema, value: unknown, path: string): void {
    if (schema.kind === 'object') {
      if (!value || typeof value !== 'object' || Array.isArray(value)) { errors.push(`${path}: expected an object.`); return; }
      for (const [key, child] of Object.entries(schema.properties)) check(child, (value as Record<string, unknown>)[key], path ? `${path}.${key}` : key);
    } else if (schema.kind === 'list') {
      if (!Array.isArray(value)) { errors.push(`${path}: expected a list.`); return; }
      const ids = new Set<string>();
      value.forEach((item, index) => {
        check(schema.item, item, `${path}[${index + 1}]`);
        if (item && typeof item === 'object' && typeof item.id === 'string') {
          if (ids.has(item.id)) errors.push(`${path}: duplicate entry ID.`);
          ids.add(item.id);
        }
      });
    } else if (schema.kind === 'version') {
      if (value !== 2) errors.push('Unsupported content version.');
    } else if (schema.kind === 'number') {
      if (typeof value !== 'number' || !Number.isFinite(value) || value < schema.min || value > schema.max) errors.push(`${path}: enter a number from ${schema.min} to ${schema.max}.`);
    } else if (schema.kind === 'boolean') {
      if (typeof value !== 'boolean') errors.push(`${path}: expected true or false.`);
    } else if (typeof value !== 'string') {
      errors.push(`${path}: expected text.`);
    } else {
      if ((schema.kind === 'id' || (schema.kind === 'text' && schema.required)) && !value.trim()) errors.push(`${path}: cannot be empty.`);
      if (schema.kind === 'choice' && !schema.options.includes(value)) errors.push(`${path}: choose one of ${schema.options.join(', ')}.`);
      if (schema.kind === 'color' && !/^#[0-9a-f]{6}$/i.test(value)) errors.push(`${path}: use a six-digit hex color.`);
      if (schema.kind === 'url' && value) {
        try {
          const protocol = new URL(value, 'https://site.example/').protocol;
          if (!(schema.image ? ['https:', 'http:'] : ['https:', 'http:', 'mailto:', 'tel:']).includes(protocol)) errors.push(`${path}: unsupported URL protocol.`);
        } catch { errors.push(`${path}: invalid URL.`); }
      }
    }
  }
  check(siteSchema, value, '');
  if (errors.length) throw new Error(errors.slice(0, 8).join('\n'));
}
