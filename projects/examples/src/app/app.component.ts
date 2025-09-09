import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { PurchaseFormComponent } from './components/smart/purchase-form/purchase-form.component';

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'purchase';
}
