import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { SharingService } from '../../services/sharing.service';
import { ChildrenService } from '../../services/children.service';
import { ToastService } from '../../services/toast.service';
import { ChildNavigationService } from '../../services/child-navigation.service';
import {
  ChildShare,
  ShareInvite,
  InviteCreate,
} from '../../models/sharing.model';
import { Child } from '../../models/child.model';
import { ConfirmDialogComponent } from '../../components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-sharing-manage',
  imports: [ReactiveFormsModule, ConfirmDialogComponent],
  templateUrl: './sharing-manage.html',
  styleUrl: './sharing-manage.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharingManage implements OnInit {
  private route = inject(ActivatedRoute);
  private childNav = inject(ChildNavigationService);
  private sharingService = inject(SharingService);
  private childrenService = inject(ChildrenService);
  private toast = inject(ToastService);
  private document = inject(DOCUMENT);

  childId = signal<number | null>(null);
  child = signal<Child | null>(null);
  shares = signal<ChildShare[]>([]);
  invites = signal<ShareInvite[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  isCreatingInvite = signal(false);
  copiedToken = signal<string | null>(null);

  /** Revoke confirmation dialog */
  showRevokeConfirm = signal(false);
  revokeTarget = signal<{ shareId: number; email: string } | null>(null);

  /** Delete invite confirmation dialog */
  showDeleteInviteConfirm = signal(false);
  deleteInviteTarget = signal<number | null>(null);

  inviteForm = new FormGroup({
    role: new FormControl<'co-parent' | 'caregiver'>('co-parent', [
      Validators.required,
    ]),
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('childId');
    if (id) {
      this.childId.set(Number(id));
      this.loadData(Number(id));
    }
  }

  loadData(childId: number) {
    this.isLoading.set(true);
    this.error.set(null);

    forkJoin({
      child: this.childrenService.get(childId),
      shares: this.sharingService.listShares(childId),
      invites: this.sharingService.listInvites(childId),
    }).subscribe({
      next: ({ child, shares, invites }) => {
        // Check if user is owner
        if (child.user_role !== 'owner') {
          this.error.set('Only the owner can manage sharing');
          this.isLoading.set(false);
          return;
        }

        this.child.set(child);
        this.shares.set(shares);
        this.invites.set(invites);
        this.isLoading.set(false);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        this.isLoading.set(false);
      },
    });
  }

  onCreateInvite() {
    if (this.inviteForm.invalid || !this.childId()) {
      return;
    }

    this.isCreatingInvite.set(true);
    this.error.set(null);

    const formValue = this.inviteForm.value;
    const inviteData: InviteCreate = {
      role: formValue.role!,
    };

    this.sharingService
      .createInvite(this.childId()!, inviteData)
      .subscribe({
        next: (invite) => {
          this.isCreatingInvite.set(false);
          // Prepend new invite to list
          this.invites.update((invites) => [invite, ...invites]);
        },
        error: (err: Error) => {
          this.isCreatingInvite.set(false);
          this.error.set(err.message);
        },
      });
  }

  onRevokeShare(shareId: number, email: string) {
    this.revokeTarget.set({ shareId, email });
    this.showRevokeConfirm.set(true);
  }

  onRevokeCancel() {
    this.showRevokeConfirm.set(false);
    this.revokeTarget.set(null);
  }

  onRevokeConfirm() {
    const target = this.revokeTarget();
    this.showRevokeConfirm.set(false);
    this.revokeTarget.set(null);
    if (!target) return;
    const { shareId } = target;
    const childId = this.childId();
    if (!childId) return;
    this.sharingService.revokeShare(childId, shareId).subscribe({
      next: () => {
        this.toast.success('Access revoked');
        this.shares.update((shares) =>
          shares.filter((s) => s.id !== shareId)
        );
      },
      error: (err: Error) => {
        this.error.set(err.message);
      },
    });
  }

  onToggleInvite(inviteId: number, currentStatus: boolean) {
    const childId = this.childId();
    if (!childId) {
      return;
    }

    this.sharingService
      .toggleInvite(childId, inviteId, !currentStatus)
      .subscribe({
        next: (updatedInvite) => {
          // Update invite in list
          this.invites.update((invites) =>
            invites.map((inv) => (inv.id === inviteId ? updatedInvite : inv))
          );
        },
        error: (err: Error) => {
          this.error.set(err.message);
        },
      });
  }

  onDeleteInvite(inviteId: number) {
    this.deleteInviteTarget.set(inviteId);
    this.showDeleteInviteConfirm.set(true);
  }

  onDeleteInviteCancel() {
    this.showDeleteInviteConfirm.set(false);
    this.deleteInviteTarget.set(null);
  }

  onDeleteInviteConfirm() {
    const inviteId = this.deleteInviteTarget();
    this.showDeleteInviteConfirm.set(false);
    this.deleteInviteTarget.set(null);
    if (inviteId == null) return;
    const childId = this.childId();
    if (!childId) return;
    this.sharingService.deleteInvite(childId, inviteId).subscribe({
      next: () => {
        this.toast.success('Invite deleted');
        this.invites.update((invites) =>
          invites.filter((inv) => inv.id !== inviteId)
        );
      },
      error: (err: Error) => {
        this.error.set(err.message);
      },
    });
  }

  onCopyInviteLink(token: string) {
    const inviteUrl = `${this.document.location.origin}/invites/accept/${token}`;
    navigator.clipboard.writeText(inviteUrl).then(
      () => {
        this.copiedToken.set(token);
        // Clear after 2 seconds
        setTimeout(() => {
          this.copiedToken.set(null);
        }, 2000);
      },
      () => {
        this.error.set('Failed to copy invite link');
      }
    );
  }

  goToAdvanced() {
    const childId = this.childId();
    if (childId !== null) this.childNav.goToAdvanced(childId);
  }

  getRoleLabel(role: 'co-parent' | 'caregiver'): string {
    return role === 'co-parent' ? 'Co-parent' : 'Caregiver';
  }

  getRoleBadgeColor(role: 'co-parent' | 'caregiver'): string {
    return role === 'co-parent'
      ? 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300'
      : 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border-emerald-300';
  }

  truncateToken(token: string): string {
    return token.length > 16 ? `${token.substring(0, 16)}...` : token;
  }
}
