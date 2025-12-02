import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ThemeSwitcherComponent } from './components/ui/theme-switcher/theme-switcher.component';

@Component({
  selector: 'ngx-root',
  imports: [RouterLink, RouterOutlet, ThemeSwitcherComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  title = 'purchase';
}
