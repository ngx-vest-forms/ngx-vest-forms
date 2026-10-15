import { inject, Service } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

/** Sets the tab title to "<route title> | ngx-vest-forms". */
@Service()
export class ExampleTitleStrategy extends TitleStrategy {
  readonly #title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const pageTitle = this.buildTitle(snapshot);
    this.#title.setTitle(
      pageTitle ? `${pageTitle} | ngx-vest-forms` : 'ngx-vest-forms Examples'
    );
  }
}
