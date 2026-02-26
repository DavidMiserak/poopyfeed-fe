import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-terms-of-service',
  imports: [RouterLink],
  templateUrl: './terms-of-service.html',
  styleUrl: './terms-of-service.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsOfService {
  protected readonly lastUpdated = new Date().toLocaleDateString('en-US');
}
