import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";

interface PaginationProps {
  page: number;
  setPage: (page: number) => void;
  hasNextPage: boolean;
  className?: string;
}

const PaginationComponent = ({
  page,
  setPage,
  hasNextPage,
  className,
}: PaginationProps) => {
  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => page > 1 && setPage(page - 1)}
            className={page === 1 ? "opacity-50 cursor-not-allowed" : ""}
          />
        </PaginationItem>
        <PaginationItem>
          <span className="font-medium">Page {page}</span>
        </PaginationItem>
        <PaginationItem>
          <PaginationNext
            onClick={() => hasNextPage && setPage(page + 1)}
            className={!hasNextPage ? "opacity-50 cursor-not-allowed" : ""}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default PaginationComponent;
