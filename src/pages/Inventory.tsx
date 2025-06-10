import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Plus, Settings } from "lucide-react";
import { AddMaterialDialog } from "@/components/inventory/AddMaterialDialog";
import { StockMovementDialog } from "@/components/inventory/StockMovementDialog";
import { toast, useToast } from "@/components/ui/use-toast";
import currency from "currency.js";
import { useUserBranch } from "@/hooks/user-branch";

const TIME_PERIODS = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "this_year", label: "This Year" },
];

const getViewName = (
  userBranch: any,
  selectedBranch: string,
  timePeriod: string
) => {
  if (userBranch?.name === "HEAD OFFICE" && selectedBranch === "Cumulative") {
    switch (timePeriod) {
      case "today":
        return "admin_material_today_summary_view";
      case "this_week":
        return "admin_material_this_week_summary_view";
      case "this_month":
        return "admin_material_monthly_summary_view";
      case "this_year":
        return "admin_material_this_year_summary_view";
      default:
        return "admin_material_today_summary_view";
    }
  } else {
    switch (timePeriod) {
      case "today":
        return "branch_today_material_summary_view";
      case "this_week":
        return "branch_this_week_material_summary_view";
      case "this_month":
        return "branch_monthly_material_summary_view";
      case "this_year":
        return "branch_this_year_summary_view";
      default:
        return "branch_today_material_summary_view";
    }
  }
};

const Inventory = () => {
  const naira = (value: number) =>
    currency(value, { symbol: "₦", precision: 2, separator: "," }).format();
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] =
    useState<InventoryType | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | "Cumulative">(
    "Cumulative"
  );
  const [timePeriod, setTimePeriod] = useState<string>("today");
  const [filterName, setFilterName] = useState("");
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(
    null
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

  // Fetch all materials for name/unit rendering
  const { data: allMaterials } = useQuery({
    queryKey: ["all_materials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("materials").select("*");
      if (error) throw error;
      return data as Material[];
    },
  });

  // Fetch summary data for selected branch/time period
  const {
    data: summaryData,
    refetch,
    isLoading: isLoadingInventory,
  } = useQuery({
    queryKey: ["inventory_summary", selectedBranch, userBranch?.id, timePeriod],
    queryFn: async () => {
      const viewName = getViewName(userBranch, selectedBranch, timePeriod);

      // HEAD OFFICE, Cumulative: show all
      if (
        userBranch?.name === "HEAD OFFICE" &&
        selectedBranch === "Cumulative"
      ) {
        const { data, error } = await supabase.from(viewName).select("*");
        if (error) throw error;
        return data;
      }

      // HEAD OFFICE, specific branch
      if (userBranch?.name === "HEAD OFFICE") {
        const { data, error } = await supabase
          .from(viewName)
          .select("*")
          .eq("branch_id", selectedBranch);
        if (error) throw error;
        return data;
      }

      // Branch user: filter by their branch
      const { data, error } = await supabase
        .from(viewName)
        .select("*")
        .eq("branch_id", userBranch?.id);
      if (error) throw error;
      return data;
    },
    enabled: !!userBranch?.id,
  });

  // Map summary data by material_id for fast lookup
  const summaryByMaterialId = useMemo(() => {
    const map: Record<string, any> = {};
    summaryData?.forEach((row: any) => {
      map[row.material_id] = row;
    });
    return map;
  }, [summaryData]);

  // Filter materials by name search
  const filteredMaterials = useMemo(
    () =>
      allMaterials?.filter(
        (mat) =>
          !filterName ||
          mat.name.toLowerCase().includes(filterName.toLowerCase())
      ),
    [allMaterials, filterName]
  );

  // Filter indirect materials
  const indirectMaterials = useMemo(
    () =>
      allMaterials?.filter(
        (mat) =>
          mat.description?.toLowerCase() === "indirect" &&
          (!filterName ||
            mat.name.toLowerCase().includes(filterName.toLowerCase()))
      ),
    [allMaterials, filterName]
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
    <div className="space-y-4 p-3 bg-transparent rounded-lg shadow-md w-full mx-auto margin-100">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="flex flex-1 items-start space-x-4">
        {userBranch.name === "HEAD OFFICE" && (
          <div className="items-center space-y-2">
            <div className="flex items-center space-x-2">
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4" />
                Add Material
              </Button>
              <Button onClick={() => setIsUpdateDialogOpen(true)}>
                Post Qty
              </Button>
            </div>
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
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

      <div className="flex flex-row space-x-2 sm:flex-col sm:space-x-0 sm:space-y-2 justify-self-end">
        <input
          type="text"
          placeholder="Search material"
          className="w-32 h-8 border rounded p-2"
          onChange={(e) => setFilterName(e.target.value)}
        />
        <Select value={timePeriod} onValueChange={setTimePeriod}>
          <SelectTrigger className="w-32 h-8 border rounded p-2 ">
        <SelectValue placeholder="Select Time Period" />
          </SelectTrigger>
          <SelectContent>
        {TIME_PERIODS.map((tp) => (
          <SelectItem key={tp.value} value={tp.value}>
            {tp.label}
          </SelectItem>
        ))}
          </SelectContent>
        </Select>
      </div>
      </div>

      <div className="border rounded-lg mt-4">
        <h3 className="text-xl font-bold px-4 py-2 bg-gray-100">
          Materials
        </h3>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-200">
              <TableHead>Material</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>QTY</TableHead>
              <TableHead>QC</TableHead>
              <TableHead>PROC.</TableHead>
              <TableHead>TRF IN</TableHead>
              <TableHead>TRF OUT</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>DMG</TableHead>
              <TableHead>Reorder</TableHead>
              <TableHead>Unit Cost</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>
                <Settings className="h-4 w-4 text-gray-800 ml-2" />
              </TableHead>
            </TableRow>
          </TableHeader>
          {filteredMaterials?.length && !isLoadingInventory ? (
            <TableBody>
              {filteredMaterials.map((material, index) => {
                const item = summaryByMaterialId[material.id] || {};
                return (
                  <TableRow
                    key={material.id}
                    className={
                      index % 2 === 0
                        ? "bg-white hover:bg-gray-50"
                        : "bg-gray-100 hover:bg-gray-50"
                    }
                  >
                    <TableCell>
                      <strong>{material.name}</strong>
                    </TableCell>
                    <TableCell>{material.unit}</TableCell>
                    <TableCell
                      style={{
                        color:
                          (item.quantity ?? 0) < (material.minimum_stock ?? 0)
                            ? "red"
                            : "green",
                      }}
                    >
                      {item.quantity ?? 0}
                    </TableCell>
                    <TableCell>{item.quantity ?? 0}</TableCell>
                    <TableCell>{item.procurement ?? 0}</TableCell>
                    <TableCell>{item.transfer_in ?? 0}</TableCell>
                    <TableCell>{item.transfer_out ?? 0}</TableCell>
                    <TableCell>{(item.usage ?? 0).toFixed(2)}</TableCell>
                    <TableCell>{item.damages ?? 0}</TableCell>
                    <TableCell>{material.minimum_stock}</TableCell>
                    <TableCell>{naira(material.unit_price)}</TableCell>
                    <TableCell>
                      {naira((material.unit_price ?? 0) * (item.quantity ?? 0))}
                    </TableCell>
                    <TableCell>
                      <Select
                        onValueChange={(value) => {
                          if (value === "transfer") {
                            setSelectedMaterial(material);
                            setIsTransferDialogOpen(true);
                          } else if (
                            value === "update_cost" &&
                            userBranch.name === "HEAD OFFICE"
                          ) {
                            handleOpenCostDialog(material);
                          }
                        }}
                      >
                        <SelectTrigger className="w-3 justify-end appearance-none [&>svg]:hidden p-0 bg-transparent border-0 text-green-500 hover:text-green-900 text-xl font-bold">
                          <SelectValue placeholder="⋮" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="transfer">
                            <span className="pl-1">⋮</span> Transfer
                          </SelectItem>
                          <SelectItem
                            value="update_cost"
                            disabled={userBranch.name !== "HEAD OFFICE"}
                            className={`${
                              userBranch.name !== "HEAD OFFICE"
                                ? "text-gray-400 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            <span className="pl-1">⋮</span> Update Cost
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          ) : !filteredMaterials?.length && !isLoadingInventory ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={13} className="text-center">
                  No recent inventory record found
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              <TableRow>
                <TableCell colSpan={13} className="text-center">
                  Loading, please wait...
                </TableCell>
              </TableRow>
            </TableBody>
          )}
        </Table>
      </div>

      {/* Indirect Materials Table */}
      <div className="border rounded-lg mt-8">
        <h3 className="text-xl font-bold px-4 py-2 bg-gray-100">
          Indirect Materials
        </h3>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-200">
              <TableHead>Material</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>QTY</TableHead>
              <TableHead>QC</TableHead>
              <TableHead>PROC.</TableHead>
              <TableHead>TRF IN</TableHead>
              <TableHead>TRF OUT</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>DMG</TableHead>
              <TableHead>Reorder</TableHead>
              <TableHead>Unit Cost</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>
                <Settings className="h-4 w-4 text-gray-800 ml-2" />
              </TableHead>
            </TableRow>
          </TableHeader>
          {indirectMaterials?.length && !isLoadingInventory ? (
            <TableBody>
              {indirectMaterials.map((material, index) => {
                const item = summaryByMaterialId[material.id] || {};
                return (
                  <TableRow
                    key={material.id}
                    className={
                      index % 2 === 0
                        ? "bg-white hover:bg-gray-50"
                        : "bg-gray-100 hover:bg-gray-50"
                    }
                  >
                    <TableCell>
                      <strong>{material.name}</strong>
                    </TableCell>
                    <TableCell>{material.unit}</TableCell>
                    <TableCell
                      style={{
                        color:
                          (item.quantity ?? 0) < (material.minimum_stock ?? 0)
                            ? "red"
                            : "green",
                      }}
                    >
                      {item.quantity ?? 0}
                    </TableCell>
                    <TableCell>{item.quantity ?? 0}</TableCell>
                    <TableCell>{item.procurement ?? 0}</TableCell>
                    <TableCell>{item.transfer_in ?? 0}</TableCell>
                    <TableCell>{item.transfer_out ?? 0}</TableCell>
                    <TableCell>{(item.usage ?? 0).toFixed(2)}</TableCell>
                    <TableCell>{item.damages ?? 0}</TableCell>
                    <TableCell>{material.minimum_stock}</TableCell>
                    <TableCell>{naira(material.unit_price)}</TableCell>
                    <TableCell>
                      {naira((material.unit_price ?? 0) * (item.quantity ?? 0))}
                    </TableCell>
                    <TableCell>
                      <Select
                        onValueChange={(value) => {
                          if (value === "transfer") {
                            setSelectedMaterial(material);
                            setIsTransferDialogOpen(true);
                          } else if (
                            value === "update_cost" &&
                            userBranch.name === "HEAD OFFICE"
                          ) {
                            handleOpenCostDialog(material);
                          }
                        }}
                      >
                        <SelectTrigger className="w-3 justify-end appearance-none [&>svg]:hidden p-0 bg-transparent border-0 text-green-500 hover:text-green-900 text-xl font-bold">
                          <SelectValue placeholder="⋮" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="transfer">
                            <span className="pl-1">⋮</span> Transfer
                          </SelectItem>
                          <SelectItem
                            value="update_cost"
                            disabled={userBranch.name !== "HEAD OFFICE"}
                            className={`${
                              userBranch.name !== "HEAD OFFICE"
                                ? "text-gray-400 cursor-not-allowed"
                                : ""
                            }`}
                          >
                            <span className="pl-1">⋮</span> Update Cost
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          ) : (
            <TableBody>
              <TableRow>
                <TableCell colSpan={13} className="text-center">
                  {isLoadingInventory
                    ? "Loading, please wait..."
                    : "No indirect materials found."}
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
