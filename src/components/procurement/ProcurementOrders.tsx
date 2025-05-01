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
import { useCheck } from "@/hooks/use-check";
import PaginationComponent from "@/components/pagination";
import { PAGE_LIMIT } from "@/constants";

export interface ProcurementOrderItem {
  id: string;
  material_request: {
    quantity: number;
    material: {
      id: string;
      name: string;
      unit: string;
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
  const { handleSelectAll } = useCheck();
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["procurement-orders", page],
    queryFn: async () => {
      const from = (page - 1) * PAGE_LIMIT;
      const to = from + PAGE_LIMIT - 1;

      // Fetch orders
      // Adjust the range to fetch the next set of orders
      const { data, error, count } = await supabase
        .from("procurement_orders")
        .select(
          `
          *,
          items:procurement_order_items(
            material_request:material_requests(quantity,
              material:materials(id, name, unit, unit_price),
              branch:branches(manager, name)
            )
          )
        `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return {
        orders: data as unknown as ProcurementOrder[],
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

      <div ref={printRef}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <input
                  type="checkbox"
                  checked={true}
                  onChange={() =>
                    handleSelectAll(
                      data?.orders,
                      (order) => order.status !== "supplied"
                    )
                  }
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
          {data?.orders?.length && !isLoading ? (
            <TableBody>
              {data?.orders?.map((order, idx) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={true}
                      className="h-4 w-4 disabled:cursor-not-allowed"
                      disabled={true}
                    />
                  </TableCell>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>
                    <Badge status={order.status}>{order.status}</Badge>
                  </TableCell>
                  {/* <TableCell>
                    <ul className="list-disc list-inside">
                      {order.items?.map((item) => (
                        <li key={item.id}>
                          {item.material_request.material.name} -{" "}
                          {item.material_request.quantity}{" "}
                          {item.material_request.material.unit} for{" "}
                          {item.material_request.branch.name}
                        </li>
                      ))}
                    </ul>
                  </TableCell> */}
                  <TableCell className="capitalize">
                    {order.items[0]?.material_request?.material?.name}
                  </TableCell>
                  <TableCell>{`${
                    order.items[0]?.material_request?.quantity
                  } (${order.items[0]?.material_request?.material?.unit?.toLowerCase()})`}</TableCell>
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
          ) : !data?.orders?.length && !isLoading ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No procurement order
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

export default ProcurementOrders;
