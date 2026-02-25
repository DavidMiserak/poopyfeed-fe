import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { Toast } from './components/toast/toast';
import { TimezoneBanner } from './components/timezone-banner/timezone-banner';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, Toast, TimezoneBanner],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('poopyfeed');
}
