import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-terms-page',
  imports: [CommonModule, RouterModule],
  templateUrl: './terms-page.component.html',
})
export class TermsPageComponent {
  getCurrentDate(): string {
    return new Date().toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
