import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterModule,
  RouterOutlet,
} from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { NgxThemeSwitcherComponent } from './ui/theme-switcher.component';

@Component({
  selector: 'ngx-root',
  imports: [NgxThemeSwitcherComponent, RouterOutlet, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  private router = inject(Router);

  // Extract page title from router events
  private pageTitle$ = this.router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    map(() => {
      let route = this.router.routerState.root;
      while (route.firstChild) {
        route = route.firstChild;
      }
      return route.snapshot.title || 'Form Example';
    }),
  );

  // Convert to signal for use in template
  private pageTitle = toSignal(this.pageTitle$, {
    initialValue: 'Simple Form Example',
  });

  getPageTitle(): string {
    return this.pageTitle() || 'Form Example';
  }
}
