import { useState, useMemo, useEffect } from "react";
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
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { MaterialDamageDialog } from "@/components/damages/MaterialDamageDialog";
import {
  format,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
} from "date-fns";
import { useUserBranch } from "@/hooks/user-branch";

const TIME_PERIODS = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "this_week" },
  { label: "This Month", value: "this_month" },
  { label: "This Year", value: "this_year" },
];

const getPeriodStart = (period: string) => {
  const now = new Date();
  switch (period) {
    case "today":
      return startOfDay(now);
    case "this_week":
      return startOfWeek(now, { weekStartsOn: 1 });
    case "this_month":
      return startOfMonth(now);
    case "this_year":
      return startOfYear(now);
    default:
      return undefined;
  }
};

const useBranches = () => {
  return useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("id, name");
      if (error) throw error;
      return data;
    },
  });
};

const Damages = () => {
  const userBranch = useUserBranch();
  const branch = userBranch.data;
  const isHeadOffice = branch?.name === "HEAD OFFICE";
  const { data: branches = [] } = useBranches();

  const [selectedBranch, setSelectedBranch] = useState<string | null>(
    isHeadOffice ? null : branch?.id
  );
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Ensure selectedBranch is always set for branch users
  useEffect(() => {
    if (!isHeadOffice && branch?.id) {
      setSelectedBranch(branch.id);
    }
  }, [branch, isHeadOffice]);

  const periodStart = useMemo(
    () => getPeriodStart(selectedPeriod),
    [selectedPeriod]
  );

  const {
    data: damages,
    refetch: refetchDamages,
    isLoading,
  } = useQuery({
    queryKey: [
      "damaged_materials",
      selectedBranch,
      selectedPeriod,
      periodStart?.toISOString(),
    ],
    queryFn: async () => {
      let query = supabase
        .from("damaged_materials")
        .select(
          `
        id,
        quantity,
        reason,
        created_at,
        material:material_id(name, unit, unit_price),
        branch:branch_id(id, name),
        user:user_id(first_name, last_name)
      `
        )
        .order("created_at", { ascending: false });

      // Branch filter
      if (!isHeadOffice && selectedBranch) {
        query = query.eq("branch_id", selectedBranch);
      } else if (isHeadOffice && selectedBranch) {
        query = query.eq("branch_id", selectedBranch);
      }

      // Time period filter
      if (periodStart) {
        query = query.gte("created_at", periodStart.toISOString());
      }
      const { data, error } = await query;
      if (error) {
        console.error("Error fetching damages:", error);
        throw error;
      }
      return data as unknown as Damage[];
    },
    enabled: !!selectedBranch || isHeadOffice,
  });

  const calculateTotalCost = (quantity: number, unitPrice: number) =>
    quantity * unitPrice;

  return (
    <div className="space-y-6 p-3 bg-white rounded-lg shadow-md w-full mx-auto margin-100">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex gap-6 justify-between items-end">
        <h2 className="text-3xl  font-bold tracking-tight">Damages</h2>
        <h2 className="text-2xl font-semibold">
          ₦
          {damages
            ?.reduce(
              (acc, damage) =>
          acc + calculateTotalCost(damage.quantity, damage.material.unit_price),
              0
            )
            .toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h2>
        </div>
        

        <div className="flex gap-3 items-center ">
          {isHeadOffice && (
            <select
              className="border rounded px-2 py-1 w-1/2"
              value={selectedBranch ?? ""}
              onChange={(e) => setSelectedBranch(e.target.value || null)}
            >
              <option value="">All Branches</option>
              {branches.map((b: any) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
          <select
            className="border rounded px-2 py-1"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            {TIME_PERIODS.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
          
        </div>
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
                      damage?.quantity,
                      damage?.material?.unit_price
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
                <TableCell colSpan={9} className="text-center">
                  No damages recorded yet
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  <div className="flex justify-center items-center">Loading
      <div className="animate-spin rounded-full text-green-500 h-8 w-8 border-t-2 border-b-2  border-green-500"></div>
    </div>
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
