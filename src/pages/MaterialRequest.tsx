import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import capitalize from "lodash/capitalize";
import { supabase } from "@/integrations/supabase/client";
import type { MaterialRequest } from "@/types/material_request";
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
import { MaterialRequestDialog } from "@/components/material_request/MaterialRequestDialog";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import PaginationComponent from "@/components/pagination";
import { PAGE_LIMIT } from "@/constants";
import { useCheck } from "@/hooks/use-check";
import { useUserBranch } from "@/hooks/user-branch";
import { useAuth } from "@/hooks/auth";
import { useToast } from "@/hooks/use-toast";
import {
  MiniProcurementOrderItem,
  ProcurementOrder,
} from "@/components/procurement/ProcurementOrders";
import { FinalizeOrderDialog } from "@/components/ui/finalize-order";

interface FormValues {
  items: MiniProcurementOrderItem[];
}

const MaterialRequest = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddDialogOpenAccept, setIsAddDialogOpenAccept] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const { selectedItems, handleSelectAll, resetCheck, toggleCheck } =
    useCheck();
  const userBranch = useUserBranch();
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    data,
    refetch: refetchMaterialRequests,
    isLoading,
  } = useQuery({
    queryKey: ["material_requests", page],
    queryFn: async () => {
      const from = (page - 1) * PAGE_LIMIT;
      const to = from + PAGE_LIMIT - 1;

      const { data, error, count } = await supabase
        .from("material_requests")
        .select(
          `*,
        material:material_id(minimum_stock, name, unit, unit_price, inventory:inventory(closing_stock, usage)),
        orders:procurement_order_items_material_request_id_fkey(procurement_order_id),
        branch:branch_id(name),
        user:user_id(first_name, last_name)
      `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return {
        material_requests: data as unknown as MaterialRequest[],
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

      // Get all order IDs that need to be updated in order table
      const orderIds = new_items.map((item) => item.material_order_id);

      // Get all order IDs that need to be updated in request table
      const orderReqIds = new_items.map((item) => item.material_id);

      // Batch update procurement_orders in a single query
      const { error: updateError } = await supabase
        .from("procurement_orders")
        .update({ status: "supplied" }) // Set new status
        .in("id", orderIds); // Filter all relevant order IDs

      if (updateError) throw updateError;

      // Batch update procurement_orders in a single query
      const { error: updateReqError } = await supabase
        .from("material_requests")
        .update({ status: "supplied" }) // Set new status
        .in("material_id", orderReqIds); // Filter all relevant order IDs

      if (updateReqError) throw updateReqError;

      // Sequentially update each record
      for (const item of new_items) {
        const { data: existingData, error: fetchError } = await supabase
          .from("inventory")
          .select("quantity")
          .eq("material_id", item.material_id)
          .single();

        if (fetchError) {
          throw new Error(
            `Failed to fetch current quantity for ${item.material_id}`
          );
        }

        const newQuantity = (existingData?.quantity || 0) + item.quantity;
        const { error } = await supabase
          .from("inventory")
          .update({ procurement: item.quantity, quantity: newQuantity })
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
      await refetchMaterialRequests();
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
        <h2 className="text-3xl font-bold tracking-tight">Material requests</h2>
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild id="edit-material-request">
              <Button disabled={!!selectedItems.length || isLoading}>
                Make request
              </Button>
            </DialogTrigger>
            <MaterialRequestDialog
              onOpenChange={setIsAddDialogOpen}
              refetch={refetchMaterialRequests}
              requests={data?.material_requests?.map((x) => x?.material_id)}
            />
          </Dialog>
          <Dialog
            open={isAddDialogOpenAccept}
            onOpenChange={setIsAddDialogOpenAccept}
          >
            <DialogTrigger asChild id="procurement order">
              <Button disabled={!selectedItems.length || isLoading}>
                Accept Order
              </Button>
            </DialogTrigger>
            <FinalizeOrderDialog
              onOpenChange={setIsAddDialogOpenAccept}
              items={
                data?.material_requests
                  ?.filter(
                    (req) =>
                      selectedItems.includes(req.id) &&
                      req.status !== "supplied"
                  )
                  ?.map((req) => {
                    return selectedItems.includes(req?.id)
                      ? {
                          id: req?.material_id,
                          order_id: req?.orders?.[0]?.procurement_order_id,
                          name: req?.material?.name,
                          quantity: String(req?.quantity),
                          unit: req?.material.unit,
                        }
                      : null;
                  })

                  .filter(Boolean) as unknown as MiniProcurementOrderItem[]
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
                      data?.material_requests?.filter(
                        (req) => !["supplied", "pending"].includes(req.status)
                      )?.length &&
                    data?.material_requests?.some(
                      (req) => !["supplied", "pending"].includes(req.status)
                    )
                  }
                  onChange={() =>
                    handleSelectAll(
                      data?.material_requests,
                      (req) => !["supplied", "pending"].includes(req.status)
                    )
                  }
                  className="h-4 w-4 disabled:cursor-not-allowed"
                  disabled={data?.material_requests?.every(
                    (req) => req.status === "supplied"
                  )}
                />
              </TableHead>
              <TableHead>Material Name</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Total cost</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Closing stock</TableHead>
            </TableRow>
          </TableHeader>
          {data?.material_requests?.length && !isLoading ? (
            <TableBody>
              {data?.material_requests?.map((material_request) => (
                <TableRow key={material_request.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={
                        selectedItems.includes(material_request.id) ||
                        ["supplied", "pending"].includes(
                          material_request.status
                        )
                      }
                      onChange={() => toggleCheck(material_request.id)}
                      className="h-4 w-4 disabled:cursor-not-allowed"
                      disabled={["supplied", "pending"].includes(
                        material_request.status
                      )}
                    />
                  </TableCell>
                  <TableCell>{material_request?.material?.name}</TableCell>
                  <TableCell>{material_request?.material?.unit}</TableCell>
                  <TableCell>
                    {material_request?.material?.unit_price}
                  </TableCell>
                  <TableCell>{material_request?.quantity}</TableCell>
                  <TableCell>
                    {calculateTotalCost(
                      material_request?.material?.unit_price,
                      material_request?.quantity
                    )}
                  </TableCell>
                  <TableCell className="capitalize">
                    {material_request?.user
                      ? `${capitalize(
                          `${material_request?.user?.first_name} ${material_request?.user?.last_name}`
                        )}`
                      : "N / A"}
                  </TableCell>
                  <TableCell>
                    {material_request?.branch?.name ?? "N / A"}
                  </TableCell>
                  <TableCell>
                    <Badge status={material_request?.status}>
                      {material_request?.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(
                      new Date(material_request.created_at),
                      "MMM d, yyyy h:mm a"
                    )}
                  </TableCell>
                  <TableCell>
                    {material_request?.material?.inventory[0]?.usage}
                  </TableCell>
                  <TableCell
                    style={{
                      color:
                        material_request.material?.inventory[0]?.closing_stock <
                        material_request.material?.minimum_stock
                          ? "red"
                          : "green",
                    }}
                  >
                    {material_request?.material?.inventory[0]?.closing_stock}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          ) : !data?.material_requests?.length && !isLoading ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No current material requests
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

export default MaterialRequest;
