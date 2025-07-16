import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { NgxThemeSwitcherComponent } from './ui/theme-switcher.component';

@Component({
  selector: 'ngx-root',
  imports: [NgxThemeSwitcherComponent, RouterOutlet, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'ngx-vest-forms Examples';
}
