import { Component, Input, forwardRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Schema, defaultValue } from '../../models/site-content';

@Component({
  selector: 'site-content-editor',
  standalone: true,
  imports: [FormsModule, forwardRef(() => ContentEditorComponent)],
  templateUrl: './content-editor.component.html',
  styleUrl: './content-editor.component.css',
})
export class ContentEditorComponent {
  @Input({ required: true }) schema!: Schema;
  // Values are checked against the schema at the import and publishing boundaries.
  @Input({ required: true }) value!: any;
  @Input() path = '';

  get properties(): [string, Schema][] {
    return this.schema.kind === 'object' ? Object.entries(this.schema.properties).filter(([, schema]) => !['id', 'version'].includes(schema.kind)) : [];
  }
  get itemSchema(): Schema { return this.schema.kind === 'list' ? this.schema.item : this.schema; }
  get options(): readonly string[] { return this.schema.kind === 'choice' ? this.schema.options : []; }
  get minimum(): number | null { return this.schema.kind === 'number' ? this.schema.min : null; }
  get maximum(): number | null { return this.schema.kind === 'number' ? this.schema.max : null; }
  label(key: string): string {
    if (key === 'personalAcademicProjects') return 'Personal/Academic Projects';
    if (key === 'professionalExperience') return 'Professional Experience';
    return key.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().replace(/^./, letter => letter.toUpperCase());
  }
  title(item: any, index: number): string {
    return (item && typeof item === 'object' && (item.name || item.title || item.label)) || `Entry ${index + 1}`;
  }
  childPath(key: string | number): string { return this.path ? `${this.path}.${key}` : String(key); }
  set(key: string | number, value: unknown): void { this.value[key] = value; }
  add(): void { this.value.push(defaultValue(this.itemSchema)); }
  remove(index: number): void { this.value.splice(index, 1); }
  move(index: number, delta: number): void {
    const target = index + delta;
    if (target < 0 || target >= this.value.length) return;
    [this.value[index], this.value[target]] = [this.value[target], this.value[index]];
  }
}
