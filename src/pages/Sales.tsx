import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/products";
import { Sale } from "@/types/sales";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SaleForm } from "@/components/sales/SaleForm";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

const Sales = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: sales, refetch: refetchSales } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          items:sale_items(
            *,
            product:products(*)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Sale[];
    },
  });

  const handleCreateSale = async (values: any) => {
    try {
      // Calculate total amount
      const total_amount = values.items.reduce(
        (sum: number, item: any) => sum + item.quantity * item.unit_price,
        0
      );

      // Insert sale
      const { data: saleData, error: saleError } = await supabase
        .from("sales")
        .insert([
          {
            payment_method: values.payment_method,
            total_amount,
            branch_id: "default", // You might want to make this dynamic based on user's branch
          },
        ])
        .select()
        .single();

      if (saleError) throw saleError;

      // Insert sale items
      const { error: itemsError } = await supabase.from("sale_items").insert(
        values.items.map((item: any) => ({
          sale_id: saleData.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.quantity * item.unit_price,
        }))
      );

      if (itemsError) throw itemsError;

      toast({
        title: "Success",
        description: "Sale created successfully",
      });
      setIsAddDialogOpen(false);
      refetchSales();
    } catch (error) {
      console.error("Error creating sale:", error);
      toast({
        title: "Error",
        description: "Failed to create sale",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Sales</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Sale</DialogTitle>
            </DialogHeader>
            {products && (
              <SaleForm
                products={products}
                onSubmit={handleCreateSale}
                branchId="default" // Add the required branchId prop
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales?.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell>
                  {format(new Date(sale.created_at), "MMM d, yyyy h:mm a")}
                </TableCell>
                <TableCell>
                  {sale.items?.map((item) => (
                    <div key={item.id}>
                      {item.quantity}x {item.product?.name}
                    </div>
                  ))}
                </TableCell>
                <TableCell className="capitalize">{sale.payment_method}</TableCell>
                <TableCell className="text-right">
                  ${sale.total_amount.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Sales;