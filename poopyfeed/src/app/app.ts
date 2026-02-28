import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { Toast } from './components/toast/toast';
import { TimezoneBanner } from './components/timezone-banner/timezone-banner';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, Toast, TimezoneBanner],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly title = signal('poopyfeed');
}
