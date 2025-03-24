import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useReactToPrint } from "react-to-print";
import { supabase } from "@/integrations/supabase/client";
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

interface ProcurementOrderItem {
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

interface ImprestOrder {
  id: string;
  status: string;
  created_at: string;
  items: ProcurementOrderItem[];
}

const ImprestOrders = () => {
  const printRef = useRef<HTMLDivElement>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["procurement-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("procurement_orders")
        .select(
          `
          *,
          items:procurement_order_items(
            material_request:material_requests(
              material:materials(*),
              branch:branches(*)
            )
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as ImprestOrder[];
    },
  });

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Procurement Orders",
    onBeforePrint: () => {
      if (!printRef.current) {
        toast.error("Print content not ready");
        return Promise.reject();
      }
      return Promise.resolve();
    },
    onPrintError: () => {
      toast.error("Failed to print");
    },
    onAfterPrint: () => {
      toast.success("Print completed");
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Procurement Orders</h2>
        <Button onClick={() => handlePrint()}>Print Orders</Button>
      </div>

      <div ref={printRef}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          {orders?.length && !isLoading ? (
            <TableBody>
              {orders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>
                    <Badge>{order.status}</Badge>
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell>
                    {new Date(order.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          ) : !orders?.length && !isLoading ? (
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
    </div>
  );
};

export default ImprestOrders;
