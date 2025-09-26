import { TitleCasePipe } from '@angular/common';
import { Component, input, signal } from '@angular/core';
import { User } from '@auth/interfaces/user.interfaces';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-side-menu-header',
  imports: [TitleCasePipe],
  templateUrl: './side-menu-header.component.html',
})
export class SideMenuHeaderComponent {
  envs = environment;

  authStatus = input.required();
  user = input<User | null>();
}
