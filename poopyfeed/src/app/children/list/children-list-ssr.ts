import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-children-list-ssr',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        class="backdrop-blur-lg rounded-3xl shadow-xl p-6 border-2 border-slate-200 bg-gradient-to-br from-white/80 to-slate-50/60 animate-pulse"
      >
        <div class="h-24 bg-gradient-to-r from-slate-200 to-slate-300 rounded-2xl mb-4"></div>
        <div class="h-6 bg-gradient-to-r from-slate-200 to-slate-300 rounded mb-2"></div>
        <div class="h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-2/3"></div>
      </div>
      <div
        class="backdrop-blur-lg rounded-3xl shadow-xl p-6 border-2 border-slate-200 bg-gradient-to-br from-white/80 to-slate-50/60 animate-pulse"
      >
        <div class="h-24 bg-gradient-to-r from-slate-200 to-slate-300 rounded-2xl mb-4"></div>
        <div class="h-6 bg-gradient-to-r from-slate-200 to-slate-300 rounded mb-2"></div>
        <div class="h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-2/3"></div>
      </div>
      <div
        class="backdrop-blur-lg rounded-3xl shadow-xl p-6 border-2 border-slate-200 bg-gradient-to-br from-white/80 to-slate-50/60 animate-pulse"
      >
        <div class="h-24 bg-gradient-to-r from-slate-200 to-slate-300 rounded-2xl mb-4"></div>
        <div class="h-6 bg-gradient-to-r from-slate-200 to-slate-300 rounded mb-2"></div>
        <div class="h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-2/3"></div>
      </div>
    </div>
  `,
})
export class ChildrenListSsr {}
