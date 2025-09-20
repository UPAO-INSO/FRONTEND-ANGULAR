import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SideMenuComponent } from 'src/app/shared/components/side-menu/side-menu.component';
import { NavbarComponent } from 'src/app/shared/components/navbar/navbar.component';

@Component({
  selector: 'app-kitchen-layout',
  imports: [RouterOutlet],
  templateUrl: './kitchen-layout.component.html',
})
export class KitchenLayoutComponent {}
