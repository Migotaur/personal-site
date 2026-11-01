import { test, expect } from '@playwright/test';
import defaults from '../public/content.json';
import legacy from '../scripts/fixtures/content-v1.json';
import fieldMap from '../src/app/models/legacy-field-map.json';
import { validateContent, defaultValue, siteSchema } from '../src/app/models/site-content';
import { readContent } from '../src/app/models/content-migration';

// Model validation protects the public page from malformed remote content.
test('all existing content survives the legacy migration', () => {
  validateContent(defaults);
  const migrated = readContent(legacy, defaults);
  expect(migrated).toEqual(defaults);
  expect(Object.keys(fieldMap)).toHaveLength(222);
});
test('legacy customizations migrate into named records', () => {
  validateContent(defaults);
  const changed = structuredClone(legacy);
  changed.find(field => field.key === 'field_163')!.value = 'Renamed project';
  changed.find(field => field.key === 'field_99')!.value = '42';
  const result = readContent(changed, defaults);
  expect(result.projects.items[0].name).toBe('Renamed project');
  expect(result.resume.skills[0].experience).toBe('3 years');
  expect(result.resume.skills[0]).not.toHaveProperty('percentage');
  expect(defaults.projects.items[0].name).toBe('miggledev.com');
});
test('version 2 supports new, removed, reordered, and empty lists', () => {
  validateContent(defaults);
  const draft = structuredClone(defaults);
  draft.projects.items.reverse();
  draft.resume.experience = [];
  const item = defaultValue(siteSchema.properties.projects.properties.items.item) as typeof draft.projects.items[number];
  item.name = 'New project';
  draft.projects.items.push(item);
  expect(readContent(draft, defaults)).toEqual(draft);
});
test('malformed remote documents, duplicate IDs, and invalid usage labels are rejected', () => {
  expect(() => validateContent({ version: 2 })).toThrow();
  const draft = structuredClone(defaults);
  (draft.resume.skills[0] as unknown as Record<string, unknown>).professionalExperience = 'yes';
  expect(() => validateContent(draft)).toThrow(/true or false/);
  draft.resume.skills[0].professionalExperience = true;
  draft.projects.items[1].id = draft.projects.items[0].id;
  expect(() => validateContent(draft)).toThrow(/duplicate/);
});
test('unsafe links and image protocols are rejected', () => {
  const draft = structuredClone(defaults);
  draft.projects.items[0].links[0].url = 'javascript:alert(1)';
  expect(() => validateContent(draft)).toThrow(/protocol/);
  draft.projects.items[0].links[0].url = 'https://example.com/';
  draft.profile.portrait = 'data:image/svg+xml,unsafe';
  expect(() => validateContent(draft)).toThrow(/protocol/);
});

test('percentage-based version 2 imports migrate without losing resume edits', () => {
  validateContent(defaults);
  const old = structuredClone(defaults) as unknown as Record<string, any>;
  old.resume.skills = old.resume.skills.map((skill: { name: string }) => ({ name: skill.name, percentage: 75 }));
  old.resume.education[0].title = 'Updated degree';
  const result = readContent(old, defaults);
  expect(result.resume.education[0].title).toBe('Updated degree');
  expect(result.resume.skills).toEqual(defaults.resume.skills);
});
