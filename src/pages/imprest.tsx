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
import PaginationComponent from "@/components/pagination";
import { PAGE_LIMIT } from "@/constants";

const Imprest = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [page, setPage] = useState(1);

  const {
    data,
    refetch: refetchImprests,
    isLoading,
  } = useQuery({
    queryKey: ["imprest_requests", page],
    queryFn: async () => {
      const from = (page - 1) * PAGE_LIMIT;
      const to = from + PAGE_LIMIT - 1;

      const { data, error, count } = await supabase
        .from("imprest_requests")
        .select(
          `*,
          branch:branch_id(name),
          user:user_id(first_name, last_name)
        `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return {
        imprests: data as unknown as Imprest[],
        hasNextPage: count ? to + 1 < count : false,
      };
    },
    placeholderData: (prevData) => prevData,
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
          {data?.imprests?.length && !isLoading ? (
            <TableBody>
              {data?.imprests?.map((imprest) => (
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
          ) : !data?.imprests?.length && !isLoading ? (
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
      <PaginationComponent
        className="justify-end"
        page={page}
        setPage={setPage}
        hasNextPage={data?.hasNextPage || false}
      />
    </div>
  );
};

export default Imprest;
