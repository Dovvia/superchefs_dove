import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useReactToPrint } from "react-to-print";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
import type { ImprestOrder } from "@/types/imprest";
import PaginationComponent from "@/components/pagination";
import { PAGE_LIMIT } from "@/constants";

const ImprestOrders = () => {
  const printRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["imprest-orders", page],
    queryFn: async () => {
      const from = (page - 1) * PAGE_LIMIT;
      const to = from + PAGE_LIMIT - 1;

      const { data, error, count } = await supabase
        .from("imprest_orders")
        .select(
          `
          *,
          items:imprest_order_items (
            *,
            imprest:imprest_requests (
              id, name, quantity, unit, unit_price,
              branch:branches(name, manager)
            )
          )
        `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return {
        orders: data as unknown as ImprestOrder[],
        hasNextPage: count ? to + 1 < count : false,
      };
    },
    placeholderData: (prevData) => prevData,
  });

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Imprest Orders",
    onBeforePrint: () => {
      if (!printRef.current) {
        toast({
          title: "Error",
          description: "Print content not ready",
          variant: "destructive",
        });
        return Promise.reject();
      }
      return Promise.resolve();
    },
    onPrintError: () => {
      toast({
        title: "Error",
        description: "Failed to print",
        variant: "destructive",
      });
    },
    onAfterPrint: () => {
      toast({
        title: "Success",
        description: "Print completed successfully",
      });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Imprest Orders</h2>
        <div className="flex justify-between items-center space-x-4">
          <Button onClick={() => handlePrint()}>Print Orders</Button>
        </div>
      </div>

      <div ref={printRef}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <input
                  type="checkbox"
                  checked={true}
                  className="h-4 w-4 disabled:cursor-not-allowed"
                  disabled={true}
                />
              </TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Date Created</TableHead>
              <TableHead>Date Updated</TableHead>
            </TableRow>
          </TableHeader>
          {data?.orders?.length && !isLoading ? (
            <TableBody>
              {data?.orders?.map((order) => (
                <TableRow key={order?.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={true}
                      className="h-4 w-4 disabled:cursor-not-allowed"
                      disabled={true}
                    />
                  </TableCell>
                  <TableCell>{order?.id}</TableCell>
                  <TableCell>
                    <Badge status={order?.status}>{order?.status}</Badge>
                  </TableCell>
                  {/* <TableCell>
                    <ul className="list-disc list-inside">
                      {order.items?.map((item) => (
                        <li key={item.id}>
                          {capitalize(item?.imprest?.name)} -{" "}
                          {item?.imprest?.quantity} {item?.imprest?.unit} for{" "}
                          {item?.imprest?.branch?.name}
                        </li>
                      ))}
                    </ul>
                  </TableCell> */}
                  <TableCell className="capitalize">
                    {order?.items[0]?.imprest?.name}
                  </TableCell>
                  <TableCell>{`${
                    order?.items[0]?.imprest?.quantity
                  } (${order?.items[0]?.imprest?.unit?.toLowerCase()})`}</TableCell>
                  <TableCell>
                    {order?.items[0]?.imprest?.branch?.name}
                  </TableCell>
                  <TableCell>
                    {new Date(order?.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {new Date(order?.updated_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          ) : !data?.orders?.length && !isLoading ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No imprest order
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

export default ImprestOrders;
