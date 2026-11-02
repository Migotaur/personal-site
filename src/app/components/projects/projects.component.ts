import { Component, inject } from '@angular/core';
import { ContentService } from '../../services/content.service';

@Component({
  selector: 'site-projects',
  standalone: true,
  templateUrl: './projects.component.html',
  styles: [':host { display: contents; }'],
})
export class ProjectsComponent {
  private readonly content = inject(ContentService);

  get site() { return this.content.document; }
}
