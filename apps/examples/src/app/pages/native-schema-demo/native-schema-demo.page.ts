import { Component, signal } from '@angular/core';
import { NativeSchemaDemoModel } from '../../models/native-schema-demo.model';
import { ExampleCardsComponent } from '../../ui/example-cards/example-cards.component';
import { FormStateCardComponent } from '../../ui/form-state/form-state.component';
import { IntroItemComponent, IntroSectionComponent } from '../../ui/intro-section';
import { PageTitle } from '../../ui/page-title/page-title.component';
import { nativeSchemaContent } from './native-schema-demo.content';
import { NativeSchemaDemoFormBody } from './native-schema-demo.form';
import { nativeSchemaDemoSuite } from './native-schema-demo.validations';

@Component({
  selector: 'ngx-native-schema-demo-page',
  imports: [
    ExampleCardsComponent,
    FormStateCardComponent,
    PageTitle,
    IntroSectionComponent,
    IntroItemComponent,
    NativeSchemaDemoFormBody,
  ],
  templateUrl: './native-schema-demo.page.html',
})
export class NativeSchemaDemoPageComponent {
  protected readonly formValue = signal<NativeSchemaDemoModel>({});

  protected readonly suite = nativeSchemaDemoSuite;

  protected readonly exampleContent = nativeSchemaContent;

  protected save(): void {
    // Intentionally no console output in examples to keep CI and demos quiet
  }
}
