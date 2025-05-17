import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useReactToPrint } from "react-to-print";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import PaginationComponent from "@/components/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";

const PAGE_LIMIT = 10;

interface Imprest {
  name: string;
  unit_price: number;
}

interface CumulativeImprest {
  imprest_id: string;
  total_quantity: number;
  total_requests: number;
  imprests: Imprest | Imprest[];
}

export const ImprestSummary = () => {
  const printRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<"supplied" | "approved">(
    "supplied"
  );
  const [timeframe, setTimeframe] = useState<"weekly" | "monthly" | "yearly">(
    "weekly"
  );
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");

  // Fetch branches
  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const { data, error } = await supabase.from("branches").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Fetch cumulative material requests
  const { data, isLoading } = useQuery<{
    items: CumulativeImprest[];
    hasNextPage: boolean;
  }>({
    queryKey: [
      "cumulative_imprest_view",
      page,
      statusFilter,
      timeframe,
      selectedBranchId,
    ],
    queryFn: async () => {
      const from = (page - 1) * PAGE_LIMIT;
      const to = from + PAGE_LIMIT - 1;

      let query = supabase
        .from("cumulative_imprest_view")
        .select(
          `
          imprest_id,
          total_quantity,
          total_requests,
          imprests (
            name,
            unit_price
          )
        `,
          { count: "exact" }
        )
        .order("total_quantity", { ascending: false })
        .range(from, to);
      // .eq("status", statusFilter);

      if (selectedBranchId) {
        query = query.eq("branch_id", selectedBranchId);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        items: data as CumulativeImprest[],
        hasNextPage: count ? to < count : false,
      };
    },
    placeholderData: (previousData) => previousData,
  });

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Procurement Orders Summary",
    onBeforePrint: () => {
      if (!printRef.current) {
        toast({
          title: "Error",
          description: "Print content not ready",
          variant: "destructive",
        });
        return Promise.reject();
      }
      return Promise.resolve();
    },
    onPrintError: () => {
      toast({
        title: "Error",
        description: "Failed to print",
        variant: "destructive",
      });
    },
    onAfterPrint: () => {
      toast({
        title: "Success",
        description: "Print completed",
      });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Procurement Orders Summary</h2>
        <Button onClick={() => handlePrint()}>Print Orders</Button>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        {/* Radio Buttons for Status */}
        <RadioGroup
          value={statusFilter}
          onValueChange={(value) =>
            setStatusFilter(value as "supplied" | "approved")
          }
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="supplied" id="supplied" />
            <label htmlFor="supplied" className="text-sm font-medium">
              Supplied
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="approved" id="approved" />
            <label htmlFor="approved" className="text-sm font-medium">
              Approved
            </label>
          </div>
        </RadioGroup>
        {/* Time Period Selector */}
        <Select
          value={timeframe}
          onValueChange={(value) =>
            setTimeframe(value as "weekly" | "monthly" | "yearly")
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Time Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>

        {/* Branch Selector */}
        <Select
          value={selectedBranchId || "all"}
          onValueChange={(value) =>
            setSelectedBranchId(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="All Branches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {branches?.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div ref={printRef}>
        <h2 className="text-lg font-semibold bg-gray-200 p-4 rounded-md shadow-sm">
          Total Cost:{" "}
          {`₦${data?.items
            ?.reduce((acc, item) => {
              const quantity = item.total_quantity || 0;
              const price = Array.isArray(item.imprests)
                ? item.imprests[0]?.unit_price || 0
                : item.imprests?.unit_price || 0;

              return acc + quantity * price;
            }, 0)
            .toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
        </h2>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total Quantity</TableHead>
              <TableHead>Total Requests</TableHead>
              <TableHead>Unit Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data?.items && data.items.length > 0 ? (
              data.items.map((item) => (
                <TableRow key={item.imprest_id}>
                  <TableCell>
                    {Array.isArray(item.imprests)
                      ? item.imprests[0]?.name || "N/A"
                      : item.imprests?.name || "N/A"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">Approved</Badge>
                  </TableCell>
                  <TableCell>{item.total_quantity || 0}</TableCell>
                  <TableCell>{item.total_requests || 0}</TableCell>
                  <TableCell>
                    ₦
                    {(Array.isArray(item.imprests)
                      ? item.imprests[0]?.unit_price || 0
                      : item.imprests?.unit_price || 0
                    ).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No imprests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationComponent
        className="justify-end"
        page={page}
        setPage={setPage}
        hasNextPage={data?.hasNextPage || false}
      />
    </div>
  );
};

export default ImprestSummary;
