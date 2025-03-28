import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Imprest } from "@/types/imprest";
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
import { HandCoinsIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Imprest = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const {
    data: imprests,
    refetch: refetchImprests,
    isLoading,
  } = useQuery({
    queryKey: ["imprest_requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("imprest_requests")
        .select(
          `*,
          branch:branch_id(name),
          user:user_id(first_name, last_name)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as Imprest[];
    },
  });

  const calculateTotalCost = (quantity: number, unitPrice: number) =>
    quantity * unitPrice;

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Imprests</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild id="imprest-requests">
            <Button>
              <HandCoinsIcon className="ml-2 h-4 w-4" />
              Create Imprest
            </Button>
          </DialogTrigger>
          <ImprestDialog
            onOpenChange={setIsAddDialogOpen}
            refetch={refetchImprests}
          />
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
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
          {imprests?.length && !isLoading ? (
            <TableBody>
              {imprests?.map((imprest) => (
                <TableRow key={imprest.id}>
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
          ) : !imprests?.length && !isLoading ? (
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
    </div>
  );
};

export default Imprest;
