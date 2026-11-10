import { Component, signal } from '@angular/core';
import {
  NGX_ERROR_DISPLAY_MODE_TOKEN,
  NGX_WARNING_DISPLAY_MODE_TOKEN,
  type NgxSubmitSettledEvent,
} from 'ngx-vest-forms';
import type { DisplayModesDemoModel } from '../../models/display-modes-demo.model';
import { AlertPanel } from '../../ui/alert-panel/alert-panel.component';
import { ExampleCardsComponent } from '../../ui/example-cards/example-cards.component';
import { FormStateCardComponent } from '../../ui/form-state/form-state.component';
import {
  IntroItemComponent,
  IntroSectionComponent,
} from '../../ui/intro-section';
import { PageTitle } from '../../ui/page-title/page-title.component';
import { displayModesContent } from './display-modes-demo.content';
import { DisplayModesDemoFormBody } from './display-modes-demo.form';
import { displayModesDemoSuite } from './display-modes-demo.validations';

@Component({
  selector: 'ngx-display-modes-demo-page',
  imports: [
    AlertPanel,
    ExampleCardsComponent,
    PageTitle,
    IntroSectionComponent,
    IntroItemComponent,
    FormStateCardComponent,
    DisplayModesDemoFormBody,
  ],
  templateUrl: './display-modes-demo.page.html',
  styleUrl: './display-modes-demo.page.scss',
  providers: [
    {
      provide: NGX_ERROR_DISPLAY_MODE_TOKEN,
      useValue: 'on-submit',
    },
    {
      provide: NGX_WARNING_DISPLAY_MODE_TOKEN,
      useValue: 'on-touch',
    },
  ],
})
export class DisplayModesDemoPageComponent {
  protected readonly exampleContent = displayModesContent;

  protected readonly formValue = signal<DisplayModesDemoModel>({});

  protected readonly suite = displayModesDemoSuite;

  protected readonly outcome = signal<'success' | 'invalid' | null>(null);

  protected onSubmit(
    event: NgxSubmitSettledEvent<DisplayModesDemoModel>
  ): void {
    this.outcome.set(event.valid ? 'success' : 'invalid');
  }
}
