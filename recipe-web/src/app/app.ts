import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ProductRow } from './product/ui/product-row/product-row';
import { ProductPage } from './product/ui/product-page/product-page';
import { Header } from './core/ui/header/header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('recepie-book');
}
