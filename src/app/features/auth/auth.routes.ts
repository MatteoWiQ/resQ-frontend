import { Routes } from '@angular/router';

import { LoginComponent } from './pages/login/login.component';
import { Register } from './pages/register/register';

export const authRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: Register }
];