import { AfterViewInit, Component, inject, signal } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { AboutComponent } from '../about/about.component';
import { ResumeComponent } from '../resume/resume.component';
import { ProjectsComponent } from '../projects/projects.component';
import { ContactComponent } from '../contact/contact.component';
import { ServicesComponent } from '../services/services.component';
import { FooterComponent } from '../footer/footer.component';
import { PageInteractionsService } from '../../services/page-interactions.service';

@Component({
  selector: 'site-page',
  standalone: true,
  imports: [HeaderComponent, AboutComponent, ResumeComponent, ProjectsComponent, ContactComponent, ServicesComponent, FooterComponent],
  templateUrl: './page.component.html',
})
export class PageComponent implements AfterViewInit {
  private readonly interactions = inject(PageInteractionsService);
  readonly error = signal('');

  ngAfterViewInit(): void {
    void this.interactions.initialize().catch(error => this.error.set(String(error)));
  }
}
