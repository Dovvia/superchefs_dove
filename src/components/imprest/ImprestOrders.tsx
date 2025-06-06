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
import { Badge } from "@/components/ui/badge";
import type { ImprestOrder } from "@/types/imprest";
import PaginationComponent from "@/components/pagination";
import { PAGE_LIMIT } from "@/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const ImprestOrders = () => {
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

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      "imprest-orders",
      page,
      statusFilter,
      timeframe,
      selectedBranchId,
    ],
    queryFn: async () => {
      const from = (page - 1) * PAGE_LIMIT;
      const to = from + PAGE_LIMIT - 1;

      let query = supabase
        .from("imprest_orders")
        .select(
          `
          *,
          items:imprest_order_items (
            *,
            imprest:imprest_requests (
              id, name, quantity, unit, unit_price,
              branch:branches(id, name, address, manager, phone)
            )
          )
        `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .range(from, to)
        .eq("status", statusFilter);

      // Filter by branch if a branch is selected
      if (selectedBranchId) {
        query = query.eq("branch_id", selectedBranchId);
      }

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        orders: data as unknown as ImprestOrder[],
        hasNextPage: count ? to + 1 < count : false,
      };
    },
    placeholderData: (prevData) => prevData,
  });

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Imprest Orders",
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
        description: "Print completed successfully",
      });
    },
  });

  const loading = isLoading || isFetching;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Imprest Orders</h2>
        <div className="flex justify-between items-center space-x-4">
          <Button onClick={() => handlePrint()}>Print Orders</Button>
        </div>
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
            <RadioGroupItem value="supplied" id="supplied" disabled={loading} />
            <label htmlFor="supplied" className="text-sm font-medium">
              Supplied
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="approved" id="approved" disabled={loading} />
            <label htmlFor="approved" className="text-sm font-medium">
              Approved
            </label>
          </div>
        </RadioGroup>

        {/* Select for Time Period */}
        <Select
          value={timeframe}
          onValueChange={(value) =>
            setTimeframe(value as "weekly" | "monthly" | "yearly")
          }
          disabled={loading}
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

        {/* Select for Branch */}
        <Select
          value={selectedBranchId || "all"}
          onValueChange={(value) =>
            setSelectedBranchId(value === "all" ? "" : value)
          }
          disabled={loading}
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
        {data?.orders?.map((order) => (
          <div
            key={order.id}
            className="flex justify-between mb-4 items-center bg-green-100 p-4 rounded-md shadow-sm"
          >
            <h2>
              Total cost:{" "}
              {`₦${order.items
                ?.reduce((itemAcc, item) => {
                  return (
                    itemAcc + item.imprest.quantity * item.imprest.unit_price
                  );
                }, 0)
                .toLocaleString("en-US", {
                  minimumSignificantDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
            </h2>
            <h1>Date: {new Date().toLocaleDateString()}</h1>
            <h1>Time: {new Date().toLocaleTimeString()}</h1>
            <p>Branch: {order.items[0]?.imprest?.branch?.name}</p>
            <p>Manager: {order.items[0]?.imprest?.branch?.manager}</p>
            <p>Phone: {order.items[0]?.imprest?.branch?.phone}</p>
            <p>Branch Address: {order.items[0]?.imprest?.branch?.address}</p>
          </div>
        ))}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <input
                  type="checkbox"
                  checked={true}
                  className="h-4 w-4 disabled:cursor-not-allowed"
                  disabled={true}
                />
              </TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Date Created</TableHead>
              <TableHead>Date Updated</TableHead>
            </TableRow>
          </TableHeader>
          {data?.orders?.length && !loading ? (
            <TableBody>
              {data?.orders?.map((order) => (
                <TableRow key={order?.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={true}
                      className="h-4 w-4 disabled:cursor-not-allowed"
                      disabled={true}
                    />
                  </TableCell>
                  <TableCell>{order?.id}</TableCell>
                  <TableCell>
                    <Badge status={order?.status}>{order?.status}</Badge>
                  </TableCell>
                  {/* <TableCell>
                    <ul className="list-disc list-inside">
                      {order.items?.map((item) => (
                        <li key={item.id}>
                          {capitalize(item?.imprest?.name)} -{" "}
                          {item?.imprest?.quantity} {item?.imprest?.unit} for{" "}
                          {item?.imprest?.branch?.name}
                        </li>
                      ))}
                    </ul>
                  </TableCell> */}
                  <TableCell className="capitalize">
                    {order?.items[0]?.imprest?.name}
                  </TableCell>
                  <TableCell>{`${
                    order?.items[0]?.imprest?.quantity
                  } (${order?.items[0]?.imprest?.unit?.toLowerCase()})`}</TableCell>
                  <TableCell>
                    {order?.items[0]?.imprest?.branch?.name}
                  </TableCell>
                  <TableCell>
                    {new Date(order?.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(order?.updated_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          ) : !data?.orders?.length && !loading ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No imprest order
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading, please wait...
                </TableCell>
              </TableRow>
            </TableBody>
          )}
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

export default ImprestOrders;
