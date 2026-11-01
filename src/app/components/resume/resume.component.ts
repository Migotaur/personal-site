import { Component, inject } from '@angular/core';
import { ContentService } from '../../services/content.service';

@Component({
  selector: 'site-resume',
  standalone: true,
  templateUrl: './resume.component.html',
  styleUrl: './resume.component.css',
  styles: [':host { display: contents; }'],
})
export class ResumeComponent {
  private readonly content = inject(ContentService);

  get site() { return this.content.document; }
}
