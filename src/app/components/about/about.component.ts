import { Component, inject } from '@angular/core';
import { ContentService } from '../../services/content.service';

@Component({
  selector: 'site-about',
  standalone: true,
  templateUrl: './about.component.html',
  styles: [':host { display: contents; }'],
})
export class AboutComponent {
  private readonly content = inject(ContentService);

  get site() { return this.content.document; }
}
