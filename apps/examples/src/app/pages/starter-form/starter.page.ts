import { Component, computed, viewChild } from '@angular/core';
import { Card } from '../../ui/card/card.component';
import { ExampleCardsComponent } from '../../ui/example-cards/example-cards.component';
import { FormStateCardComponent } from '../../ui/form-state/form-state.component';
import {
  IntroItemComponent,
  IntroSectionComponent,
} from '../../ui/intro-section';
import { PageTitle } from '../../ui/page-title/page-title.component';
import { starterContent } from './starter.content';
import { StarterFormComponent } from './starter.form';

/**
 * Canonical starter contact form — the default "start here" demo.
 *
 * The form itself is the single copyable `StarterFormComponent`; this page
 * only adds chrome around it (intro, form-state card, example cards).
 */
@Component({
  selector: 'ngx-starter-page',
  imports: [
    PageTitle,
    IntroSectionComponent,
    IntroItemComponent,
    Card,
    FormStateCardComponent,
    ExampleCardsComponent,
    StarterFormComponent,
  ],
  templateUrl: './starter.page.html',
})
export class StarterPageComponent {
  protected readonly exampleContent = starterContent;

  private readonly starterForm = viewChild(StarterFormComponent);

  protected readonly feedback = computed(() => this.starterForm()?.feedback);
}
