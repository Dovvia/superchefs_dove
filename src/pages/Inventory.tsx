import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import UpdateQuantityDialog from "@/components/inventory/UpdateQuantityDialog";
import MaterialTransferDialog from "@/components/inventory/MaterialTransferDialog";
import UpdateMaterialCostDialog from "@/components/inventory/UpdateMaterialCostDialog";
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
import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { AddMaterialDialog } from "@/components/inventory/AddMaterialDialog";
import { StockMovementDialog } from "@/components/inventory/StockMovementDialog";
import { toast, useToast } from "@/components/ui/use-toast";
import currency from "currency.js";
import { useUserBranch } from "@/hooks/user-branch";

const Inventory = () => {
  const naira = (value: number) =>
    currency(value, { symbol: "₦", precision: 2, separator: "," }).format();
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] =
    useState<InventoryType | null>(null);
  const [filterName, setFilterName] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null
  );
  const [selectedBranch, setSelectedBranch] = useState<string | "Cumulative">(
    "Cumulative"
  );
  const [isCostDialogOpen, setIsCostDialogOpen] = useState(false);
  const [materialToEdit, setMaterialToEdit] = useState<Material | null>(null);

  const { toast } = useToast();
  const { data: userBranch, isLoading: isLoadingBranch } = useUserBranch();

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const { data, error } = await supabase.from("branches").select("*");
      if (error) throw error;
      return data as { id: string; name: string }[];
    },
  });

  const {
    data: inventory,
    refetch,
    isLoading: isLoadingInventory,
  } = useQuery({
    queryKey: ["inventory", selectedBranch, userBranch?.id],
    queryFn: async () => {
      if (
        userBranch?.name === "HEAD OFFICE" &&
        selectedBranch === "Cumulative"
      ) {
        const { data, error } = await supabase.from("cumulative_inventory_view")
          .select(`
            *,
            material:materials(*)
          `);
        if (error) throw error;
        return data as unknown as InventoryType[];
      }

      const branchId =
        userBranch?.name === "HEAD OFFICE" ? selectedBranch : userBranch?.id;

      const { data, error } = await supabase
        .from("inventory")
        .select(
          `
          *,
          material:materials(*)
        `
        )
        .eq("branch_id", branchId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as InventoryType[];
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

  const handleOpenCostDialog = (material: Material) => {
    setMaterialToEdit(material);
    setIsCostDialogOpen(true);
  };

  if (isLoadingBranch) {
    return (
      <div className="text-center">
        <p>Loading branch information...</p>
      </div>
    );
  }

  if (!userBranch?.id) {
    return (
      <div className="text-center">
        <p className="text-red-500">
          Error: Branch ID is not set. Please contact support.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-3 bg-white rounded-lg shadow-md w-full mx-auto margin-100">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
      </div>

      <div className="flex items-center space-x-4">
        {userBranch.name === "HEAD OFFICE" && (
          <div className="flex items-center space-x-4">
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Material
            </Button>
            <Button onClick={() => setIsUpdateDialogOpen(true)}>
              Post Qty
            </Button>
            <Select
              value={selectedBranch}
              onValueChange={(value) => setSelectedBranch(value)}
            >
              <SelectTrigger className="w-40 h-8 border rounded p-2">
                <SelectValue placeholder="Select Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cumulative">Cumulative</SelectItem>
                {branches?.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex flex-wrap space-x-4 sm:grid sm:gap-4 sm:grid-cols-1 gap-1 items-start">
        <input
          type="text"
          placeholder="Search material"
          className="border ml-4 p-2 rounded h-8 w-40"
          onChange={(e) => setFilterName(e.target.value)}
        />
        <input
          type="date"
          className="border p-2 rounded h-8 w-40"
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
              {/* <TableHead>Request</TableHead> */}
              <TableHead>Unit Cost</TableHead>
              <TableHead>Non-close Cost</TableHead>
              <TableHead>Close cost</TableHead>
              <TableHead>Actions</TableHead>
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
                  <TableCell>{(item.usage || 0).toFixed(2)}</TableCell>
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
                  {/* <TableCell>{item.request_order}</TableCell> */}
                  <TableCell>{naira(item.material?.unit_price)}</TableCell>
                  <TableCell>
                    {naira(
                      (item.usage + item.damages) * item.material?.unit_price
                    )}
                  </TableCell>
                  <TableCell>
                    {naira(item.material?.unit_price * item.quantity)}
                  </TableCell>
                  <TableCell>
                    <div className="relative">
                      <Button
                        variant="link"
                        className="h-8 w-8 border-0 bg-transparent p-0 font-bold text-xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          const menu = e.currentTarget.nextElementSibling;
                          if (menu) {
                            menu.classList.toggle("hidden");
                          }
                        }}
                      >
                        ⋮
                      </Button>
                      <div className=" z-50 absolute right-0 top-0 mt-0 w-32 bg-white border rounded shadow-lg hidden">
                        <button
                          className="block w-full text-left px-4 py-2 text-sm hover:bg-green-500"
                          onClick={() => {
                            setSelectedMaterial(item.material);
                            setIsTransferDialogOpen(true);
                          }}
                        >
                          Transfer
                        </button>
                        <button
                          className={`block w-full text-left px-4 py-2 text-sm ${
                            userBranch.name !== "HEAD OFFICE"
                              ? "text-gray-400 cursor-not-allowed"
                              : "hover:bg-green-500"
                          }`}
                          onClick={() =>
                            userBranch.name === "HEAD OFFICE" &&
                            handleOpenCostDialog(item.material)
                          }
                          disabled={userBranch.name !== "HEAD OFFICE"}
                        >
                          Edit Cost
                        </button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          ) : !filteredInventory?.length && !isLoadingInventory ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No recent inventory record found
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
      <UpdateQuantityDialog
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
        // branches={branches}
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
      {selectedMaterial && branches && (
        <MaterialTransferDialog
          open={isTransferDialogOpen}
          onOpenChange={setIsTransferDialogOpen}
          material={selectedMaterial}
          fromBranchId={userBranch.id}
          branches={branches}
        />
      )}
      {materialToEdit && (
        <UpdateMaterialCostDialog
          open={isCostDialogOpen}
          onOpenChange={setIsCostDialogOpen}
          material={materialToEdit}
          onSuccess={refetch}
        />
      )}
    </div>
  );
};

export default Inventory;
