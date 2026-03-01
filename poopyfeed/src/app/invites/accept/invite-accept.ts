import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { SharingService } from '../../services/sharing.service';

interface ChildInfo {
  id: number;
  name: string;
}

@Component({
  selector: 'app-invite-accept',
  templateUrl: './invite-accept.html',
  styleUrl: './invite-accept.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InviteAccept implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private sharingService = inject(SharingService);

  token = signal<string | null>(null);
  child = signal<ChildInfo | null>(null);
  isProcessing = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    const token = this.route.snapshot.paramMap.get('token');
    if (token) {
      this.token.set(token);
      this.acceptInvite(token);
    } else {
      this.error.set('Invalid invite link');
      this.isProcessing.set(false);
    }
  }

  acceptInvite(token: string) {
    this.isProcessing.set(true);
    this.error.set(null);

    this.sharingService.acceptInvite(token).subscribe({
      next: (response) => {
        const childInfo =
          response.child ?? {
            id: (response as unknown as { id: number }).id,
            name: (response as unknown as { name: string }).name,
          };
        this.child.set(childInfo);
        this.isProcessing.set(false);

        // Auto-redirect after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/children']);
        }, 3000);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.isProcessing.set(false);
      },
    });
  }

  navigateToChildren() {
    this.router.navigate(['/children']);
  }
}
