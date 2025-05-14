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

export interface ProcurementOrderItem {
  id: string;
  material_request: {
    quantity: number;
    material: {
      id: string;
      name: string;
      unit: string;
      unit_price: number;
    };
    branch: {
      id: string;
      name: string;
    };
  };
}

export interface MiniProcurementOrderItem {
  id: string;
  order_id: string;
  quantity: string;
  name: string;
  unit: string;
}

export interface ProcurementOrder {
  id: string;
  status: "pending" | "supplied" | "approved";
  created_at: string;
  updated_at: string;
  items: ProcurementOrderItem[];
}

const ProcurementOrders = () => {
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

  // Fetch procurement orders
  const { data, isLoading } = useQuery({
    queryKey: [
      "procurement-orders",
      page,
      statusFilter,
      timeframe,
      selectedBranchId,
    ],
    queryFn: async () => {
      const from = (page - 1) * PAGE_LIMIT;
      const to = from + PAGE_LIMIT - 1;

      let query = supabase
        .from("procurement_orders")
        .select(
          `
          *,
          items:procurement_order_items(
            material_request:material_requests(quantity, 
              material:materials(id, name, unit, unit_price),
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
        orders: data,
        hasNextPage: count ? to + 1 < count : false,
      };
    },
    placeholderData: (previousData) => previousData,
  });

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Procurement Orders",
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
        <h2 className="text-2xl font-semibold">Procurement Orders</h2>
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

        {/* Select for Time Period */}
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

        {/* Select for Branch */}
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
                    itemAcc +
                    item.material_request.quantity *
                      item.material_request.material.unit_price
                  );
                }, 0)
                .toLocaleString("en-US", {
                  minimumSignificantDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
            </h2>
            <h1>Date: {new Date().toLocaleDateString()}</h1>
            <h1>Time: {new Date().toLocaleTimeString()}</h1>
            <p>Branch: {order.items[0]?.material_request?.branch?.name}</p>
            <p>Manager: {order.items[0]?.material_request?.branch?.manager}</p>
            <p>Phone: {order.items[0]?.material_request?.branch?.phone}</p>
            <p>Branch Address: {order.items[0]?.material_request?.branch?.address}</p>
          </div>
        ))}

        {/* Table for Procurement Orders */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Date Created</TableHead>
              <TableHead>Date Updated</TableHead>
            </TableRow>
          </TableHeader>
          {data?.orders?.length && !isLoading ? (
            <TableBody>
              {data.orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>
                    <Badge status={order.status}>{order.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {order.items[0]?.material_request?.material?.name}
                  </TableCell>
                  <TableCell>
                    {order.items[0]?.material_request?.quantity}{" "}
                    {order.items[0]?.material_request?.material?.unit}
                  </TableCell>
                  <TableCell>
                    ₦
                    {(
                      order.items[0]?.material_request?.quantity *
                      order.items[0]?.material_request?.material?.unit_price
                    ).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {order.items[0]?.material_request?.branch?.name}
                  </TableCell>
                  <TableCell>
                    {new Date(order.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(order.updated_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          ) : (
            <TableBody>
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  {isLoading ? "Loading..." : "No procurement orders found."}
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

export default ProcurementOrders;
