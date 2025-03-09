import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Plus } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { MaterialRequestDialog } from "@/components/material_request/MaterialRequestDialog";
import { format } from "date-fns";

const MaterialRequest = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const {
    data: material_requests,
    refetch: refetchMaterialRequests,
    isLoading,
  } = useQuery({
    queryKey: ["material_requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("material_requests")
        .select(
          `*,
          material:material_id(name, unit, unit_price),
          branch:branch_id(name),
          user:user_id(first_name, last_name)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as MaterialRequest[];
    },
  });

  const calculateTotalCost = (quantity: number, unitPrice: number) =>
    quantity * unitPrice;

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Material request</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild id="material damage">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Material request
            </Button>
          </DialogTrigger>
          <MaterialRequestDialog
            onOpenChange={setIsAddDialogOpen}
            refetch={refetchMaterialRequests}
          />
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material Name</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Total cost</TableHead>
              <TableHead>Request By</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          {material_requests?.length && !isLoading ? (
            <TableBody>
              {material_requests?.map((material_request) => (
                <TableRow key={material_request.id}>
                  <TableCell>{material_request?.material?.name}</TableCell>
                  <TableCell>{material_request?.material?.unit}</TableCell>
                  <TableCell>{material_request?.material?.unit_price}</TableCell>
                  <TableCell>{material_request?.quantity}</TableCell>
                  <TableCell>
                    {calculateTotalCost(
                      material_request?.material?.unit_price,
                      material_request?.quantity
                    )}
                  </TableCell>
                  <TableCell className="capitalize">
                    {material_request?.user
                      ? `${material_request?.user?.first_name} ${material_request?.user?.last_name}`
                      : "N / A"}
                  </TableCell>
                  <TableCell>{material_request?.branch?.name ?? "N / A"}</TableCell>
                  <TableCell>{material_request?.status}</TableCell>
                  <TableCell>
                    {format(new Date(material_request.created_at), "MMM d, yyyy h:mm a")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          ) : !material_requests?.length && !isLoading ? (
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
    </div>
  );
};

export default MaterialRequest;
