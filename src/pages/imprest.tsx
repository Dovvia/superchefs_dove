import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  Imprest,
  ImprestOrder,
  MiniImprestOrderItem,
} from "@/types/imprest";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { ImprestDialog } from "@/components/imprest/ImprestDialog";
import { format } from "date-fns";
import { HandCoinsIcon, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PaginationComponent from "@/components/pagination";
import { PAGE_LIMIT } from "@/constants";
import { useCheck } from "@/hooks/use-check";
import { useToast } from "@/hooks/use-toast";
import { useUserBranch } from "@/hooks/user-branch";
import { useAuth } from "@/hooks/auth";
import { FinalizeOrderDialog } from "@/components/ui/finalize-order";

const Imprest = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddDialogOpenAccept, setIsAddDialogOpenAccept] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const { selectedItems, handleSelectAll, resetCheck, toggleCheck } =
    useCheck();
  const { toast } = useToast();
  const userBranch = useUserBranch();
  const { user } = useAuth();

  const {
    data,
    refetch: refetchImprests,
    isLoading,
  } = useQuery({
    queryKey: ["imprest_requests", page],
    queryFn: async () => {
      const from = (page - 1) * PAGE_LIMIT;
      const to = from + PAGE_LIMIT - 1;

      const { data, error, count } = await supabase
        .from("imprest_requests")
        .select(
          `*,
          orders:imprest_order_items_imprest_request_id_fkey(imprest_order_id),
          branch:branch_id(name),
          user:user_id(first_name, last_name)
        `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return {
        imprests: data as unknown as Imprest[],
        hasNextPage: count ? to + 1 < count : false,
      };
    },
    placeholderData: (prevData) => prevData,
  });

  const handleFinalizeOrder = async (values: {
    items: MiniImprestOrderItem[];
  }) => {
    try {
      setLoading(true);
      const new_items = values?.items?.map((x) => ({
        branch_id: userBranch?.data?.id,
        name: x?.name,
        quantity: Number(x?.quantity),
        status: "supplied" as ImprestOrder["status"],
        unit: x?.unit,
        imprest_order_id: x?.order_id,
        user_id: user?.id,
      }));

      // Get all imprest order IDs that need to be updated
      const orderIds = new_items.map((item) => item.imprest_order_id);

      // Get all imprest request IDs that need to be updated
      const imprestIds = values?.items.map((item) => item.id);

      // Batch update procurement_orders in a single query
      const { error: updateImprestError } = await supabase
        .from("imprest_requests")
        .update({ status: "supplied" }) // Set new status
        .in("id", imprestIds); // Filter all relevant order IDs

      if (updateImprestError) throw updateImprestError;

      // Batch update procurement_orders in a single query
      const { error: updateError } = await supabase
        .from("imprest_orders")
        .update({ status: "supplied" }) // Set new status
        .in("id", orderIds); // Filter all relevant order IDs

      if (updateError) throw updateError;

      // insert new items into procurement_supplied
      const { error } = await supabase
        .from("imprest_supplied")
        .insert(new_items);
      if (error) throw error;

      toast({
        title: "Success",
        description: `You have successfully recorded ${
          values.items?.length > 1 ? "orders" : "order"
        } as supplied`,
      });
      await refetchImprests();
      setIsAddDialogOpenAccept(false);
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

  const calculateTotalCost = (quantity: number, unitPrice: number) =>
    quantity * unitPrice;

  return (
    <div className="space-y-6 p-3 bg-white rounded-lg shadow-md w-full mx-auto margin-100">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Imprests</h2>
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild id="imprest-requests">
              <Button disabled={!!selectedItems?.length}>
                <HandCoinsIcon className="h-4 w-4" />
                Create Imprest
              </Button>
            </DialogTrigger>
            <ImprestDialog
              onOpenChange={setIsAddDialogOpen}
              refetch={refetchImprests}
            />
          </Dialog>
          <Dialog
            open={isAddDialogOpenAccept}
            onOpenChange={setIsAddDialogOpenAccept}
          >
            <DialogTrigger asChild id="imprest order">
              <Button disabled={!selectedItems.length || isLoading}>
                <Plus className="h-4 w-4" />
                Accept Order
              </Button>
            </DialogTrigger>
            <FinalizeOrderDialog
              onOpenChange={setIsAddDialogOpenAccept}
              items={
                data?.imprests
                  ?.filter(
                    (imprest) =>
                      selectedItems.includes(imprest.id) &&
                      imprest.status !== "supplied"
                  )
                  ?.map((imprest) => {
                    return selectedItems.includes(imprest?.id)
                      ? {
                          id: imprest?.id,
                          order_id: imprest?.orders?.[0]?.imprest_order_id,
                          name: imprest?.name,
                          quantity: String(imprest?.quantity),
                          unit: imprest?.unit,
                        }
                      : null;
                  })

                  .filter(Boolean) as unknown as MiniImprestOrderItem[]
              }
              loading={loading}
              onSubmit={handleFinalizeOrder}
            />
          </Dialog>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <input
                  type="checkbox"
                  checked={
                    selectedItems.length ===
                      data?.imprests?.filter(
                        (imprest) =>
                          !["supplied", "pending"].includes(imprest.status)
                      )?.length &&
                    data?.imprests?.some(
                      (imprest) =>
                        !["supplied", "pending"].includes(imprest.status)
                    )
                  }
                  onChange={() =>
                    handleSelectAll(
                      data?.imprests,
                      (imprest) =>
                        !["supplied", "pending"].includes(imprest.status)
                    )
                  }
                  className="h-4 w-4 disabled:cursor-not-allowed"
                  disabled={data?.imprests?.every(
                    (req) => req.status === "supplied"
                  )}
                />
              </TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Unit Cost</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Total cost</TableHead>
              <TableHead>Recorded By</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          {data?.imprests?.length && !isLoading ? (
            <TableBody>
              {data?.imprests?.map((imprest) => (
                <TableRow key={imprest.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={
                        selectedItems.includes(imprest.id) ||
                        ["supplied", "pending"].includes(imprest.status)
                      }
                      onChange={() => toggleCheck(imprest.id)}
                      className="h-4 w-4 disabled:cursor-not-allowed"
                      disabled={["supplied", "pending"].includes(
                        imprest.status
                      )}
                    />
                  </TableCell>
                  <TableCell className="capitalize">{imprest?.name}</TableCell>
                  <TableCell>{imprest?.unit}</TableCell>
                  <TableCell>{imprest?.unit_price}</TableCell>
                  <TableCell>{imprest?.quantity}</TableCell>
                  <TableCell>
                    {calculateTotalCost(imprest?.unit_price, imprest?.quantity)}
                  </TableCell>
                  <TableCell className="capitalize">
                    {imprest?.user
                      ? `${imprest?.user?.first_name} ${imprest?.user?.last_name}`
                      : "N / A"}
                  </TableCell>
                  <TableCell>{imprest?.branch?.name ?? "N / A"}</TableCell>
                  <TableCell>
                    {format(new Date(imprest.created_at), "MMM d, yyyy h:mm a")}
                  </TableCell>
                  <TableCell>
                    <Badge status={`${imprest?.status}`}>
                      {imprest?.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          ) : !data?.imprests?.length && !isLoading ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No recent imprests
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

export default Imprest;
