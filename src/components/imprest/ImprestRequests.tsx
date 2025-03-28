import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Edit2Icon } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { useCheck } from "@/hooks/use-check";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { EditRequestDialog } from "@/components/ui/edit-request";
import type { EditRequestFormValues } from "@/types/edit-request";

const ImprestRequests = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const {
    selectedItems,
    setSelectedItems,
    toggleCheck,
    handleSelectAll,
    resetCheck,
  } = useCheck();

  const {
    data: requests,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ["imprest-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("imprest_requests")
        .select(
          `
          *,
          branch:branches(*),
          user:user_id(first_name, last_name)
        `
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleEditRequest = async (values: EditRequestFormValues) => {
    try {
      setLoading(true);

      // Ensure we only update items with valid quantities
      const itemsToUpdate = values.items
        .filter((item) => item.quantity && !isNaN(Number(item.quantity)))
        .map((item) => ({
          id: item.id,
          quantity: Number(item.quantity),
        }));

      if (itemsToUpdate.length === 0) {
        toast({
          title: "No Changes",
          description: "No valid quantity updates were provided.",
        });
        return;
      }

      // Sequentially update each record
      for (const item of itemsToUpdate) {
        const { error } = await supabase
          .from("imprest_requests")
          .update({ quantity: item.quantity })
          .eq("id", item.id);

        if (error) {
          throw new Error(`Failed to update request ${item.id}`);
        }
      }

      toast({
        title: "Success",
        description: `You have successfully updated ${
          itemsToUpdate.length > 1 ? "requests" : "request"
        }.`,
      });

      await refetch();
      setIsAddDialogOpen(false);
      resetCheck();
    } catch (error) {
      console.error(
        `Error updating ${values.items?.length > 1 ? "requests" : "request"}:`,
        error
      );
      toast({
        title: "Error",
        description: `Failed to update ${
          values.items?.length > 1 ? "requests" : "request"
        }.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateImprestOrder = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one request",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      // Create imprest order
      const { data: updatedOrders, error: updateMRError } = await supabase
        .from("imprest_requests")
        .update({ status: "approved" })
        .in("id", selectedItems)
        .select();

      if (updateMRError) throw updateMRError;

      // Now, fetch the newly inserted imprest orders
      const { data: newImprestOrders, error: imprestOrdersError } =
        await supabase
          .from("imprest_orders")
          .insert(
            updatedOrders?.map((uo) => ({
              imprest_request_id: uo?.id,
              status: uo?.status,
            }))
          )
          .select();

      if (imprestOrdersError) throw imprestOrdersError;

      // Create imprest order items
      const { error: itemsError } = await supabase
        .from("imprest_order_items")
        .insert(
          selectedItems.map((requestId) => ({
            imprest_order_id: newImprestOrders.find(
              (x) => x?.imprest_request_id === requestId
            )?.id,
            imprest_request_id: requestId,
          }))
        );

      if (itemsError) throw itemsError;

      // Create notifications for branches
      const notifications = requests
        ?.filter((req) => selectedItems.includes(req.id))
        .map((req) => ({
          branch_id: req.branch_id,
          title: "Imprest Request Approved",
          message: `Your request for ${req?.name} has been approved`,
        }));

      if (notifications?.length) {
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert(notifications);

        if (notificationError) throw notificationError;
      }

      toast({
        title: "Success",
        description: "Imprest order created successfully",
      });

      setSelectedItems([]);
      refetch();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Pending Imprest Requests</h2>
        <div className="flex items-center space-x-4">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild id="material damage">
              <Button disabled={selectedItems.length === 0 || loading}>
                <Edit2Icon className="mr-2 h-4 w-4" />
                Edit request
              </Button>
            </DialogTrigger>
            <EditRequestDialog
              onOpenChange={setIsAddDialogOpen}
              items={requests
                ?.filter((x) => selectedItems?.includes(x?.id))
                ?.map((x) => ({
                  id: x.id,
                  name: x.name,
                  quantity: String(x.quantity),
                  unit: x.unit,
                }))}
              handleEditRequest={handleEditRequest}
              loading={loading}
            />
          </Dialog>
          <Button
            onClick={handleCreateImprestOrder}
            disabled={selectedItems.length === 0 || loading}
          >
            Create Imprest Order
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <input
                type="checkbox"
                checked={
                  selectedItems.length ===
                    requests?.filter((req) => req.status !== "supplied")
                      ?.length &&
                  requests?.some((req) => req.status !== "supplied")
                }
                onChange={() =>
                  handleSelectAll(requests, (req) => req.status !== "supplied")
                }
                className="h-4 w-4 disabled:cursor-not-allowed"
                disabled={requests?.every((req) => req.status === "supplied")}
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date Created</TableHead>
            <TableHead>Date Updated</TableHead>
          </TableRow>
        </TableHeader>
        {requests?.length && !isLoading ? (
          <TableBody>
            {requests?.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(request.id)}
                    onChange={() => toggleCheck(request.id)}
                    className="h-4 w-4"
                  />
                </TableCell>
                <TableCell className="capitalize">{request?.name}</TableCell>
                <TableCell>{request.branch?.name}</TableCell>
                <TableCell>
                  {request.quantity} {request?.unit}
                </TableCell>
                <TableCell>
                  <Badge status={request.status}>{request.status}</Badge>
                </TableCell>
                <TableCell>
                  {new Date(request.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {new Date(request.updated_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        ) : !requests?.length && !isLoading ? (
          <TableBody>
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                No current imprest requests
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
  );
};

export default ImprestRequests;
