import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Hero } from './sections/hero/hero';
import { Features } from './sections/features';
import { Benefits } from './sections/benefits';
import { Cta } from './sections/cta';
import { Footer } from './sections/footer';

@Component({
  selector: 'app-landing',
  imports: [Hero, Features, Benefits, Cta, Footer],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landing {}
