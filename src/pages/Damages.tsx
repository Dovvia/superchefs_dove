import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Damage } from "@/types/damages";
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
import { MaterialDamageDialog } from "@/components/damages/MaterialDamageDialog";
import { format } from "date-fns";

const Damages = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const {
    data: damages,
    refetch: refetchDamages,
    isLoading,
  } = useQuery({
    queryKey: ["damaged_materials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("damaged_materials")
        .select(
          `
        id,
        quantity,
        reason,
        created_at,
        material:material_id(name, unit, unit_price),
        branch:branch_id(name),
        user:user_id(first_name, last_name)
      `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching damages:", error);
        throw error;
      }
      return data as unknown as Damage[];
    },
  });

  const calculateTotalCost = (quantity: number, unitPrice: number) =>
    quantity * unitPrice;

  return (
    <div className="space-y-6 p-3 bg-white rounded-lg shadow-md w-full mx-auto margin-100">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Damages</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild id="material damage">
            <Button>Add Damages</Button>
          </DialogTrigger>
          <MaterialDamageDialog
            onOpenChange={setIsAddDialogOpen}
            refetch={refetchDamages}
          />
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Damages</TableHead>
              <TableHead>Total cost</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Recorded By</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          {damages?.length && !isLoading ? (
            <TableBody>
              {damages?.map((damage) => (
                <TableRow key={damage.id}>
                  <TableCell>{damage?.material?.name}</TableCell>
                  <TableCell>{damage?.material?.unit}</TableCell>
                  <TableCell>{damage?.material?.unit_price}</TableCell>
                  <TableCell>{damage?.quantity}</TableCell>
                  <TableCell>
                    {calculateTotalCost(
                      damage?.material?.unit_price,
                      damage?.quantity
                    )}
                  </TableCell>
                  <TableCell>{damage?.reason}</TableCell>
                  <TableCell className="capitalize">
                    {damage?.user
                      ? `${damage?.user?.first_name} ${damage?.user?.last_name}`
                      : "N / A"}
                  </TableCell>
                  <TableCell>{damage?.branch?.name ?? "N / A"}</TableCell>
                  <TableCell>
                    {format(new Date(damage.created_at), "MMM d, yyyy h:mm a")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          ) : !damages?.length && !isLoading ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No damages recorded yet
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

export default Damages;
