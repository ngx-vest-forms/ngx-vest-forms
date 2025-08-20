import { Component, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import {
  NavigationEnd,
  Router,
  RouterModule,
  RouterOutlet,
} from '@angular/router';
import { filter, map } from 'rxjs';
import { NgxThemeSwitcherComponent } from './ui/theme-switcher.component';

@Component({
  selector: 'ngx-root',
  imports: [NgxThemeSwitcherComponent, RouterOutlet, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  private router = inject(Router);
  private title = inject(Title);

  protected readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.#currentRouteTitle()),
    ),
    { initialValue: this.#currentRouteTitle() },
  );

  #currentRouteTitle(): string {
    let route = this.router.routerState.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.snapshot.title || 'Examples';
  }

  // Keep the browser tab title in sync with the current route title
  // eslint-disable-next-line no-unused-private-class-members -- allowed for effect()
  #syncTitle = effect(() => {
    const t = this.pageTitle();
    if (t) this.title.setTitle(t);
  });
}
