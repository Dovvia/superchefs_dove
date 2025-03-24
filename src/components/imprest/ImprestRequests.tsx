import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";

const ImprestRequests = () => {
  const { toast } = useToast();
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

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

  const handleCreateImprestOrder = async () => {
    if (selectedRequests.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one request",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      // Create procurement order
      const { data: updatedOrders, error: updateMRError } = await supabase
        .from("imprest_requests")
        .update({ status: "approved" })
        .in("id", selectedRequests)
        .select();

      if (updateMRError) throw updateMRError;

      // Now, fetch the newly inserted procurement orders
      const { data: newProcurementOrders, error: procurementError } =
        await supabase
          .from("procurement_orders")
          .insert(
            updatedOrders?.map((uo) => ({
              material_request_id: uo?.id,
              status: uo?.status,
            }))
          )
          .select();

      if (procurementError) throw procurementError;

      // Create procurement order items
      const { error: itemsError } = await supabase
        .from("procurement_order_items")
        .insert(
          selectedRequests.map((requestId) => ({
            procurement_order_id: newProcurementOrders.find(
              (x) => x?.material_request_id === requestId
            )?.id,
            material_request_id: requestId,
          }))
        );

      if (itemsError) throw itemsError;

      // Create notifications for branches
      const notifications = requests
        ?.filter((req) => selectedRequests.includes(req.id))
        .map((req) => ({
          branch_id: req.branch_id,
          title: "Material Request Approved",
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
        description: "Procurement order created successfully",
      });

      setSelectedRequests([]);
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

  const toggleRequest = (requestId: string) => {
    setSelectedRequests((prev) =>
      prev.includes(requestId)
        ? prev.filter((id) => id !== requestId)
        : [...prev, requestId]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Pending Material Requests</h2>
        <Button
          onClick={handleCreateImprestOrder}
          disabled={selectedRequests.length === 0 || loading}
        >
          Create Imprest Order
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Select</TableHead>
            <TableHead>Material</TableHead>
            <TableHead>Branch</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        {requests?.length && !isLoading ? (
          <TableBody>
            {requests?.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedRequests.includes(request.id)}
                    onChange={() => toggleRequest(request.id)}
                    className="h-4 w-4"
                  />
                </TableCell>
                <TableCell>{request?.name}</TableCell>
                <TableCell>{request.branch?.name}</TableCell>
                <TableCell>
                  {request.quantity} {request?.unit}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      request.status === "pending" ? "warning" : "default"
                    }
                  >
                    {request.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(request.created_at).toLocaleDateString()}
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
