import { Component } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.sass'],
  standalone: true,
  imports: [FlexLayoutModule]
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  constructor() { }

}
