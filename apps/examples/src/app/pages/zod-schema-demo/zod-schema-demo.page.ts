import { Component, signal } from '@angular/core';
import { ZodSchemaDemoModel } from '../../models/zod-schema-demo.model';
import { ExampleCardsComponent } from '../../ui/example-cards/example-cards.component';
import { FormStateCardComponent } from '../../ui/form-state/form-state.component';
import { IntroItemComponent, IntroSectionComponent } from '../../ui/intro-section';
import { PageTitle } from '../../ui/page-title/page-title.component';
import { zodSchemaContent } from './zod-schema-demo.content';
import { ZodSchemaDemoFormBody } from './zod-schema-demo.form';
import { zodSchemaDemoSuite } from './zod-schema-demo.validations';

@Component({
  selector: 'ngx-zod-schema-demo-page',
  imports: [
    ExampleCardsComponent,
    FormStateCardComponent,
    PageTitle,
    IntroSectionComponent,
    IntroItemComponent,
    ZodSchemaDemoFormBody,
  ],
  templateUrl: './zod-schema-demo.page.html',
  styleUrls: ['./zod-schema-demo.page.scss'],
})
export class ZodSchemaDemoPageComponent {
  protected readonly formValue = signal<ZodSchemaDemoModel>({});

  protected readonly suite = zodSchemaDemoSuite;

  protected readonly exampleContent = zodSchemaContent;

  protected save(): void {
    // Intentionally no console output in examples to keep CI and demos quiet
  }
}
