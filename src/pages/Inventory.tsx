import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Material, Inventory as InventoryType } from "@/types/inventory";
import {Table,TableBody,TableCell,TableHead,TableHeader,TableRow} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddMaterialDialog } from "@/components/inventory/AddMaterialDialog";
import { StockMovementDialog } from "@/components/inventory/StockMovementDialog";

const Inventory = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<InventoryType | null>(null);

  const { data: inventory, refetch } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select(`
          *,
          material:materials(*)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as InventoryType[];
    },
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Material
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory?.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.material?.name}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedInventory(item)}
                  >
                    Record Movement
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AddMaterialDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={refetch}
      />

      {selectedInventory && (
        <StockMovementDialog
          open={!!selectedInventory}
          onOpenChange={(open) => !open && setSelectedInventory(null)}
          inventory={selectedInventory}
          onSuccess={refetch} 
        />
      )}
    </div>
  );
};

export default Inventory;