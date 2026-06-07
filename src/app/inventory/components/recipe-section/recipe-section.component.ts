import { Component, input, output } from '@angular/core';
import { RecipeItem } from '../recipe-modal/recipe-modal.component';

@Component({
  selector: 'app-recipe-section',
  templateUrl: './recipe-section.component.html',
})
export class RecipeSectionComponent {
  items  = input.required<RecipeItem[]>();

  openModal   = output<void>();
  removeItem  = output<number>();
}
