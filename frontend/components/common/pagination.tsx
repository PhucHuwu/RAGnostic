import { Button } from "@/components/common/button";

type PaginationProps = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
};

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  return (
    <nav className="pagination" aria-label="Pagination">
      <Button variant="ghost" onClick={() => onChange(page - 1)} disabled={page <= 1}>
        Prev
      </Button>
      <span>
        {page} / {Math.max(totalPages, 1)}
      </span>
      <Button variant="ghost" onClick={() => onChange(page + 1)} disabled={page >= totalPages}>
        Next
      </Button>
    </nav>
  );
}
