import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ThemeSwitcherComponent } from './ui/theme-switcher/theme-switcher.component';

@Component({
  selector: 'ngx-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ThemeSwitcherComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  title = 'purchase';

  protected readonly menuItems = [
    { label: 'Purchase Form', link: 'purchase' },
    { label: 'Business Hours Form', link: 'business-hours' },
    { label: 'Validation Config Demo', link: 'validation-config-demo' },
    { label: 'Multi-Form Wizard', link: 'wizard' },
    { label: 'Display Modes Demo', link: 'display-modes-demo' },
    { label: 'Zod Schema Demo', link: 'zod-schema-demo' },
  ];
}
