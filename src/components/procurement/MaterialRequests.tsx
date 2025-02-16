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

const MaterialRequests = () => {
  const { toast } = useToast();
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);

  const { data: requests, refetch } = useQuery({
    queryKey: ["material-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("material_requests")
        .select(`
          *,
          material:materials(*),
          branch:branches(*)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleCreateProcurementOrder = async () => {
    if (selectedRequests.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one request",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create procurement order
      const { data: order, error: orderError } = await supabase
        .from("procurement_orders")
        .insert([{ status: "pending" }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create procurement order items
      const { error: itemsError } = await supabase
        .from("procurement_order_items")
        .insert(
          selectedRequests.map((requestId) => ({
            procurement_order_id: order.id,
            material_request_id: requestId,
          }))
        );

      if (itemsError) throw itemsError;

      // Update material requests status
      const { error: updateError } = await supabase
        .from("material_requests")
        .update({ status: "approved" })
        .in("id", selectedRequests);

      if (updateError) throw updateError;

      // Create notifications for branches
      const notifications = requests
        ?.filter((req) => selectedRequests.includes(req.id))
        .map((req) => ({
          branch_id: req.branch_id,
          title: "Material Request Approved",
          message: `Your request for ${req.material?.name} has been approved`,
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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
          onClick={handleCreateProcurementOrder}
          disabled={selectedRequests.length === 0}
        >
          Create Procurement Order
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
              <TableCell>{request.material?.name}</TableCell>
              <TableCell>{request.branch?.name}</TableCell>
              <TableCell>
                {request.quantity} {request.material?.unit}
              </TableCell>
              <TableCell>
                <Badge>{request.status}</Badge>
              </TableCell>
              <TableCell>
                {new Date(request.created_at).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default MaterialRequests;