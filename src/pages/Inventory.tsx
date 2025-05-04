import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Material, Inventory as InventoryType } from "@/types/inventory";
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
import { AddMaterialDialog } from "@/components/inventory/AddMaterialDialog";
import { StockMovementDialog } from "@/components/inventory/StockMovementDialog";
import { toast, useToast } from "@/components/ui/use-toast";
import currency from "currency.js";
import { DialogHeader } from "@/components/ui/dialog";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
} from "@radix-ui/react-dialog";

const Inventory = () => {
  const naira = (value: number) =>
    currency(value, { symbol: "₦", precision: 2, separator: "," }).format();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] =
    useState<InventoryType | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  const [filterName, setFilterName] = useState("");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const { data: user, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error);
        return;
      }
      const branchId = user?.user?.user_metadata?.branch_id;
      setBranchId(branchId);
    };

    fetchUser();
  }, []);

  const {
    data: inventory,
    refetch,
    isLoading: isLoadingInventory,
  } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select(
          `
          *,
          material:materials(*)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as InventoryType[];
    },
  });

  const { data: materials } = useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("materials").select("*");
      if (error) throw error;
      return data as unknown as Material[];
    },
  });

  const filteredInventory = useMemo(
    () =>
      inventory?.filter(
        (item) =>
          (!filterName ||
            item.material?.name
              .toLowerCase()
              .includes(filterName.toLowerCase())) &&
          (!filterDate ||
            new Date(item.created_at).toDateString() ===
              new Date(filterDate).toDateString())
      ),
    [inventory, filterName, filterDate]
  );

  return (
    <div className="space-y-4 p-3 bg-white rounded-lg shadow-md w-full mx-auto margin-100">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Material
        </Button>
      </div>

      <div className="flex flex-wrap space-x-4 sm:grid sm:gap-4 sm:grid-cols-1 gap-1 items-start">
        <input
          type="text"
          placeholder="Search material"
          className="border ml-4 p-2 rounded h-8 w-1/2"
          onChange={(e) => setFilterName(e.target.value)}
        />
        <input
          type="date"
          className="border p-2 rounded h-8 w-1/2"
          onChange={(e) => setFilterDate(e.target.value)}
        />
      </div>

      <div className="border rounded-lg mt-4">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-200">
              <TableHead>Material</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Opening Stock</TableHead>
              <TableHead>PROC.</TableHead>
              <TableHead>TRF IN</TableHead>
              <TableHead>TRF OUT</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Damages</TableHead>
              <TableHead>Closing Stock</TableHead>
              <TableHead>Reorder</TableHead>
              <TableHead>Request</TableHead>
              <TableHead>Unit Cost</TableHead>
              <TableHead>Non-close Cost</TableHead>
              <TableHead>Close cost</TableHead>
              {/* <TableHead>Actions</TableHead> */}
            </TableRow>
          </TableHeader>
          {filteredInventory?.length && !isLoadingInventory ? (
            <TableBody>
              {filteredInventory?.map((item, index) => (
                <TableRow
                  key={item.id}
                  className={index % 2 === 0 ? "bg-white" : "bg-gray-100"}
                >
                  <TableCell>
                    <strong>{item.material?.name}</strong>
                  </TableCell>
                  <TableCell>{item.material?.unit}</TableCell>
                  <TableCell>{item.opening_stock}</TableCell>
                  <TableCell>{item.procurement}</TableCell>
                  <TableCell>{item.transfer_in}</TableCell>
                  <TableCell>{item.transfer_out}</TableCell>
                  <TableCell>{item.usage}</TableCell>
                  <TableCell>{item.damages}</TableCell>
                  <TableCell
                    style={{
                      color:
                        item.quantity < item.material?.minimum_stock
                          ? "red"
                          : "green",
                    }}
                  >
                    {item.quantity}
                  </TableCell>
                  <TableCell>{item.material?.minimum_stock}</TableCell>
                  <TableCell>{item.request_order}</TableCell>
                  <TableCell>{naira(item.material?.unit_price)}</TableCell>
                  <TableCell>
                    {naira(
                      (item.usage + item.damages) * item.material?.unit_price
                    )}
                  </TableCell>
                  <TableCell>
                    {naira(item.material?.unit_price * item.quantity)}
                  </TableCell>
                  {/* <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedInventory(item)}
                  >
                    record
                  </Button>
                </TableCell> */}
                </TableRow>
              ))}
            </TableBody>
          ) : !filteredInventory?.length && !isLoadingInventory ? (
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
