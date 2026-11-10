import { Component, signal } from '@angular/core';
import type { NgxSubmitSettledEvent } from 'ngx-vest-forms';
import type { ZodSchemaDemoModel } from '../../models/zod-schema-demo.model';
import { AlertPanel } from '../../ui/alert-panel/alert-panel.component';
import { ExampleCardsComponent } from '../../ui/example-cards/example-cards.component';
import { FormStateCardComponent } from '../../ui/form-state/form-state.component';
import {
  IntroItemComponent,
  IntroSectionComponent,
} from '../../ui/intro-section';
import { PageTitle } from '../../ui/page-title/page-title.component';
import { zodSchemaContent } from './zod-schema-demo.content';
import { ZodSchemaDemoFormBody } from './zod-schema-demo.form';
import { zodSchemaDemoSuite } from './zod-schema-demo.validations';

@Component({
  selector: 'ngx-zod-schema-demo-page',
  imports: [
    AlertPanel,
    ExampleCardsComponent,
    FormStateCardComponent,
    PageTitle,
    IntroSectionComponent,
    IntroItemComponent,
    ZodSchemaDemoFormBody,
  ],
  templateUrl: './zod-schema-demo.page.html',
  styleUrl: './zod-schema-demo.page.scss',
})
export class ZodSchemaDemoPageComponent {
  protected readonly formValue = signal<ZodSchemaDemoModel>({});

  protected readonly suite = zodSchemaDemoSuite;

  protected readonly exampleContent = zodSchemaContent;

  protected readonly outcome = signal<'success' | 'invalid' | null>(null);

  protected onSubmit(event: NgxSubmitSettledEvent<ZodSchemaDemoModel>): void {
    this.outcome.set(event.valid ? 'success' : 'invalid');
  }
}
