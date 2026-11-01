import fieldMap from './legacy-field-map.json';
import { SiteContent, validateContent } from './site-content';

/** Migrate old exports or database rows, preserving the original named defaults. */
export function readContent(value: unknown, defaults: SiteContent): SiteContent {
  if (!Array.isArray(value)) {
    const document = structuredClone(value);
    // Upgrade earlier version 2 percentage-based skills without discarding other edits.
    if (document && typeof document === 'object' && 'resume' in document) {
      const resume = (document as { resume?: { skills?: unknown[]; skillsNote?: string } }).resume;
      let upgraded = false;
      if (Array.isArray(resume?.skills)) {
        resume.skills = resume.skills.map(skill => {
          if (!skill || typeof skill !== 'object' || !('percentage' in skill) || 'experience' in skill) return skill;
          const { percentage: _percentage, ...record } = skill as Record<string, unknown>;
          upgraded = true;
          return { ...record, experience: '3 years', personalAcademicProjects: true,
            professionalExperience: record['name'] === 'Java' || record['name'] === 'Python', summary: '', projectUrl: '' };
        });
        if (upgraded && resume.skillsNote?.startsWith('Percentages')) resume.skillsNote = defaults.resume.skillsNote;
      }
    }
    validateContent(document);
    return document;
  }
  const result = structuredClone(defaults);
  const map: Record<string, string> = fieldMap;
  // Retired percentage values are not translated into experience claims.
  for (const field of value) {
    if (!field || typeof field.key !== 'string' || typeof field.value !== 'string') continue;
    const path = Object.hasOwn(map, field.key) ? map[field.key] : undefined;
    if (!path || path.endsWith('.percentage') || path === 'resume.skillsNote') continue;
    const parts = path.split('.');
    let parent: Record<string, unknown> = result as unknown as Record<string, unknown>;
    for (const part of parts.slice(0, -1)) parent = parent[part] as Record<string, unknown>;
    const key = parts[parts.length - 1];
    parent[key] = path === 'profile.aliases' ? field.value.split(',').map((name: string) => name.trim()).filter(Boolean)
      : path.endsWith('.percentage') ? Number(field.value.replace('%', '')) : field.value;
  }
  validateContent(result);
  return result;
}
