import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useReactToPrint } from "react-to-print";
import { Plus } from "lucide-react";
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
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCheck } from "@/hooks/use-check";
import { FinalizeOrderDialog } from "@/components/ui/finalize-order";
import { useUserBranch } from "@/hooks/user-branch";
import { useAuth } from "@/hooks/auth";

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
  items: ProcurementOrderItem[];
}

interface FormValues {
  items: MiniProcurementOrderItem[];
}

const ProcurementOrders = () => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { selectedItems, handleSelectAll, resetCheck, toggleCheck } =
    useCheck();
  const userBranch = useUserBranch();
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    data: orders,
    isLoading,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ["procurement-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
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
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as ProcurementOrder[];
    },
  });

  const handleFinalizeOrder = async (values: FormValues) => {
    try {
      setLoading(true);
      const new_items = values?.items?.map((x) => ({
        branch_id: userBranch?.data?.id,
        name: x?.name,
        quantity: Number(x?.quantity),
        status: "supplied" as ProcurementOrder["status"],
        unit: x?.unit,
        material_order_id: x?.order_id,
        material_id: x?.id,
        user_id: user?.id,
      }));

      // insert new items into procurement_supplied
      const { error } = await supabase
        .from("procurement_supplied")
        .insert(new_items);
      if (error) throw error;

      // Get all order IDs that need to be updated
      const orderIds = new_items.map((item) => item.material_order_id);

      // Batch update procurement_orders in a single query
      const { error: updateError } = await supabase
        .from("procurement_orders")
        .update({ status: "supplied" }) // Set new status
        .in("id", orderIds); // Filter all relevant order IDs

      if (updateError) throw updateError;

      // Sequentially update each record
      for (const item of new_items) {
        const { error } = await supabase
          .from("inventory")
          .update({ procurement: item.quantity })
          .eq("material_id", item.material_id);

        if (error) {
          throw new Error(`Failed to update order ${item.material_id}`);
        }
      }

      toast({
        title: "Success",
        description: `You have successfully recorded ${
          values.items?.length > 1 ? "orders" : "order"
        } as supplied`,
      });
      await refetchOrders();
      setIsAddDialogOpen(false);
      resetCheck();
    } catch (error) {
      console.error(
        `Error recording ${
          values.items?.length > 1 ? "orders" : "order"
        } supplied:`,
        error
      );
      toast({
        title: "Error",
        description: `Failed to record ${
          values.items?.length > 1 ? "orders" : "order"
        } supplied`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild id="procurement order">
              <Button disabled={!selectedItems.length || isLoading}>
                <Plus className="ml-2 h-4 w-4" />
                Record Order
              </Button>
            </DialogTrigger>
            <FinalizeOrderDialog
              onOpenChange={setIsAddDialogOpen}
              items={
                orders
                  ?.filter(
                    (order) =>
                      selectedItems.includes(order.id) &&
                      order.status !== "supplied"
                  )
                  ?.map(({ id, items }) => {
                    return selectedItems.includes(id)
                      ? {
                          id: items[0]?.material_request.material.id,
                          order_id: id,
                          name: items[0]?.material_request.material.name,
                          quantity: String(items[0]?.material_request.quantity),
                          unit: items[0]?.material_request.material.unit,
                        }
                      : null;
                  })
                  .filter(Boolean) as unknown as MiniProcurementOrderItem[]
              }
              loading={loading}
              onSubmit={handleFinalizeOrder}
            />
          </Dialog>
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
                  checked={
                    selectedItems.length ===
                      orders?.filter((order) => order.status !== "supplied")
                        ?.length &&
                    orders?.some((order) => order.status !== "supplied")
                  }
                  onChange={() =>
                    handleSelectAll(
                      orders,
                      (order) => order.status !== "supplied"
                    )
                  }
                  className="h-4 w-4 disabled:cursor-not-allowed"
                  disabled={orders?.every(
                    (order) => order.status === "supplied"
                  )}
                />
              </TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          {orders?.length && !isLoading ? (
            <TableBody>
              {orders?.map((order, idx) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={
                        selectedItems.includes(order.id) ||
                        order.status === "supplied"
                      }
                      onChange={() => toggleCheck(order.id)}
                      className="h-4 w-4 disabled:cursor-not-allowed"
                      disabled={order.status === "supplied"}
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

export default ProcurementOrders;
