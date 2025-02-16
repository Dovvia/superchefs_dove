import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { toast } from "sonner";
import { useReactToPrint } from "react-to-print";

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

interface ProcurementOrder {
  id: string;
  status: string;
  created_at: string;
  items: ProcurementOrderItem[];
}

const ProcurementOrders = () => {
  const printRef = useRef<HTMLDivElement>(null);

  const { data: orders } = useQuery({
    queryKey: ["procurement-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("procurement_orders")
        .select(`
          *,
          items:procurement_order_items(
            material_request:material_requests(
              material:materials(*),
              branch:branches(*)
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProcurementOrder[];
    },
  });

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: "Procurement Orders",
    onBeforeGetContent: () => {
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
        <Button onClick={handlePrint}>Print Orders</Button>
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
        </Table>
      </div>
    </div>
  );
};

export default ProcurementOrders;