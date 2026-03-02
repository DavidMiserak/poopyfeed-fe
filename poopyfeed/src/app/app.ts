import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { Toast } from './components/toast/toast';
import { TimezoneBanner } from './components/timezone-banner/timezone-banner';
import { UpdateBanner } from './components/update-banner/update-banner';
import { NetworkBanner } from './components/network-banner/network-banner';
import { LastChildService } from './services/last-child.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer, Toast, TimezoneBanner, UpdateBanner, NetworkBanner],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private lastChildService = inject(LastChildService);
  protected readonly title = signal('poopyfeed');
}
