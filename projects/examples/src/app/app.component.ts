import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ThemeSwitcherComponent } from './components/ui/theme-switcher/theme-switcher.component';

@Component({
  selector: 'ngx-root',
  imports: [RouterLink, RouterOutlet, ThemeSwitcherComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'purchase';
}
