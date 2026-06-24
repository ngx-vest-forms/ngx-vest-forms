import { Component, signal } from '@angular/core';
import {
  NGX_ERROR_DISPLAY_MODE_TOKEN,
  NGX_WARNING_DISPLAY_MODE_TOKEN,
} from 'ngx-vest-forms';
import { DisplayModesDemoModel } from '../../models/display-modes-demo.model';
import { ExampleCardsComponent } from '../../ui/example-cards/example-cards.component';
import { FormStateCardComponent } from '../../ui/form-state/form-state.component';
import { IntroItemComponent, IntroSectionComponent } from '../../ui/intro-section';
import { PageTitle } from '../../ui/page-title/page-title.component';
import { displayModesContent } from './display-modes-demo.content';
import { DisplayModesDemoFormBody } from './display-modes-demo.form';
import { displayModesDemoSuite } from './display-modes-demo.validations';

@Component({
  selector: 'ngx-display-modes-demo-page',
  imports: [
    ExampleCardsComponent,
    PageTitle,
    IntroSectionComponent,
    IntroItemComponent,
    FormStateCardComponent,
    DisplayModesDemoFormBody,
  ],
  templateUrl: './display-modes-demo.page.html',
  styleUrls: ['./display-modes-demo.page.scss'],
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

  protected save(): void {
    // Intentionally no console output in examples to keep CI and demos quiet
  }
}
