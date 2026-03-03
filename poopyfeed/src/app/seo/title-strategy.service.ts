import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/core';
import {
  TitleStrategy,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from '@angular/router';

const DEFAULT_DESCRIPTION =
  'PoopyFeed helps families and caregivers track feedings, diapers, and naps in one simple app. Stay coordinated and reduce guesswork.';

@Injectable({ providedIn: 'root' })
export class PoopyFeedTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const title = this.buildTitle(snapshot);
    if (title) {
      this.title.setTitle(title);
    }
    const leaf = this.getLeafRoute(snapshot.root);
    const description =
      (leaf?.data?.['description'] as string) ?? DEFAULT_DESCRIPTION;
    this.updateMetaDescription(description);
    this.updateCanonical(snapshot);
  }

  private updateMetaDescription(description: string): void {
    const selector = 'meta[name="description"]';
    const existing = this.document.querySelector(selector);
    if (existing) {
      existing.setAttribute('content', description);
    } else {
      this.meta.addTag({ name: 'description', content: description });
    }
  }

  private getLeafRoute(
    route: ActivatedRouteSnapshot | null
  ): ActivatedRouteSnapshot | null {
    let r: ActivatedRouteSnapshot | null = route;
    while (r?.firstChild) r = r.firstChild;
    return r;
  }

  private updateCanonical(snapshot: RouterStateSnapshot): void {
    const path = snapshot.url;
    const canonicalPath = path.split('?')[0] || '/';
    const origin =
      typeof this.document.defaultView?.location?.origin === 'string'
        ? this.document.defaultView.location.origin
        : null;
    if (!origin) return;
    const canonicalUrl = canonicalPath.startsWith('http')
      ? canonicalPath
      : `${origin}${canonicalPath.startsWith('/') ? '' : '/'}${canonicalPath}`;
    const selector = 'link[rel="canonical"]';
    let link = this.document.querySelector(selector) as HTMLLinkElement | null;
    if (link) {
      link.setAttribute('href', canonicalUrl);
    } else {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', canonicalUrl);
      this.document.head.appendChild(link);
    }
  }
}
