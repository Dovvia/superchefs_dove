import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import capitalize from "lodash/capitalize";
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
import type { ImprestOrder, MiniImprestOrderItem } from "@/types/imprest";
import { useUserBranch } from "@/hooks/user-branch";
import { useAuth } from "@/hooks/auth";
import PaginationComponent from "@/components/pagination";
import { PAGE_LIMIT } from "@/constants";

interface FormValues {
  items: MiniImprestOrderItem[];
}

const ImprestOrders = () => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const { selectedItems, handleSelectAll, resetCheck, toggleCheck } =
    useCheck();
  const { toast } = useToast();
  const userBranch = useUserBranch();
  const { user } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["imprest-orders", page],
    queryFn: async () => {
      const from = (page - 1) * PAGE_LIMIT;
      const to = from + PAGE_LIMIT - 1;

      const { data, error, count } = await supabase
        .from("imprest_orders")
        .select(
          `
          *,
          items:imprest_order_items (
            *,
            imprest:imprest_requests (
              id, name, quantity, unit, unit_price,
              branch:branches(name, manager)
            )
          )
        `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return {
        orders: data as unknown as ImprestOrder[],
        hasNextPage: count ? to + 1 < count : false,
      };
    },
    placeholderData: (prevData) => prevData,
  });

  const handleFinalizeOrder = async (values: FormValues) => {
    try {
      setLoading(true);
      const new_items = values?.items?.map((x) => ({
        branch_id: userBranch?.data?.id,
        name: x?.name,
        quantity: Number(x?.quantity),
        status: "supplied" as ImprestOrder["status"],
        unit: x?.unit,
        imprest_order_id: x?.id,
        user_id: user?.id,
      }));

      // insert new items into procurement_supplied
      const { error } = await supabase
        .from("imprest_supplied")
        .insert(new_items);
      if (error) throw error;

      // Get all order IDs that need to be updated
      const orderIds = new_items.map((item) => item.imprest_order_id);

      // Batch update procurement_orders in a single query
      const { error: updateError } = await supabase
        .from("imprest_orders")
        .update({ status: "supplied" }) // Set new status
        .in("id", orderIds); // Filter all relevant order IDs

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: `You have successfully recorded ${
          values.items?.length > 1 ? "orders" : "order"
        } as supplied`,
      });
      await refetch();
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Imprest Orders</h2>
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
                data?.orders
                  ?.filter(
                    (order) =>
                      selectedItems.includes(order.id) &&
                      order.status !== "supplied"
                  )
                  ?.map(({ id, items }) => {
                    return selectedItems.includes(id)
                      ? {
                          id: id,
                          name: items[0]?.imprest.name,
                          quantity: String(items[0]?.imprest.quantity),
                          unit: items[0]?.imprest.unit,
                        }
                      : null;
                  })
                  .filter(Boolean) as unknown as MiniImprestOrderItem[]
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
                      data?.orders?.filter(
                        (order) => order.status !== "supplied"
                      )?.length &&
                    data?.orders?.some((order) => order.status !== "supplied")
                  }
                  onChange={() =>
                    handleSelectAll(
                      data?.orders,
                      (order) => order.status !== "supplied"
                    )
                  }
                  className="h-4 w-4 disabled:cursor-not-allowed"
                  disabled={data?.orders?.every(
                    (order) => order.status === "supplied"
                  )}
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
              {data?.orders?.map((order) => (
                <TableRow key={order?.id}>
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
          ) : !data?.orders?.length && !isLoading ? (
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
