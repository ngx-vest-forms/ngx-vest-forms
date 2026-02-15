import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet, isActive } from '@angular/router';
import { ThemeSwitcherComponent } from './ui/theme-switcher/theme-switcher.component';

@Component({
  selector: 'ngx-root',
  imports: [RouterLink, RouterOutlet, ThemeSwitcherComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  title = 'purchase';
  private readonly router = inject(Router);

  protected readonly menuItems = [
    { label: 'Purchase Form', link: 'purchase' },
    { label: 'Business Hours Form', link: 'business-hours' },
    { label: 'Validation Config Demo', link: 'validation-config-demo' },
    { label: 'Multi-Form Wizard', link: 'wizard' },
    { label: 'Display Modes Demo', link: 'display-modes-demo' },
  ].map((item) => ({
    ...item,
    isActive: isActive('/' + item.link, this.router, {
      paths: 'subset',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored',
    }),
  }));
}
