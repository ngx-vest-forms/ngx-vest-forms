import { Component, signal } from '@angular/core';
import type { NgxSubmitSettledEvent } from 'ngx-vest-forms';
import type { NativeSchemaDemoModel } from '../../models/native-schema-demo.model';
import { AlertPanel } from '../../ui/alert-panel/alert-panel.component';
import { ExampleCardsComponent } from '../../ui/example-cards/example-cards.component';
import { FormStateCardComponent } from '../../ui/form-state/form-state.component';
import {
  IntroItemComponent,
  IntroSectionComponent,
} from '../../ui/intro-section';
import { PageTitle } from '../../ui/page-title/page-title.component';
import { nativeSchemaContent } from './native-schema-demo.content';
import { NativeSchemaDemoFormBody } from './native-schema-demo.form';
import { nativeSchemaDemoSuite } from './native-schema-demo.validations';

@Component({
  selector: 'ngx-native-schema-demo-page',
  imports: [
    AlertPanel,
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

  protected readonly outcome = signal<'success' | 'invalid' | null>(null);

  protected onSubmit(
    event: NgxSubmitSettledEvent<NativeSchemaDemoModel>
  ): void {
    this.outcome.set(event.valid ? 'success' : 'invalid');
  }
}
