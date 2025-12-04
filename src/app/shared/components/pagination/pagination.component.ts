import { Component, inject, input, output } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-pagination',
  imports: [],
  templateUrl: './pagination.component.html',
})
export class PaginationComponent {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  pages = input.required<number>();
  currentPage = input.required<number>();

  pageChange = output<number>();

  onPageChange(page: number) {
    if (page < 1 || page > this.pages() || page === this.currentPage()) {
      return;
    }

    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { page: page },
      queryParamsHandling: 'merge',
    });
  }

  nextPage() {
    const next = this.currentPage() + 1;
    if (next <= this.pages()) {
      this.onPageChange(next);
    }
  }

  previousPage() {
    const prev = this.currentPage() - 1;
    if (prev >= 1) {
      this.onPageChange(prev);
    }
  }
}
