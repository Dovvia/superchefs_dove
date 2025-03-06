import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/products";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProductForm } from "@/components/products/ProductForm";
import { ProductDamageDialog } from "@/components/products/ProductDamageDialog";
import ProductTransferDialog from "@/components/products/ProductTransferDialog";
import { ComplimentaryProductDialog } from "@/components/products/ComplimentaryProductDialog";
import { useToast } from "@/components/ui/use-toast";
import { useUserBranch } from "@/hooks/user-branch";

const Products = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();
  const { data: userBranch } = useUserBranch();
  const [addComplimentaryOpen, setAddComplimentaryOpen] = useState(false);
  const [addDamageOpen, setAddDamageOpen] = useState(false);
  const [addTransferOpen, setAddTransferOpen] = useState(false);

  const {
    data: products,
    refetch,
    isLoading,
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          `*, 
        product_damages:damages_id(*), 
        product_transfer:product_transfers!product_transfers_product_id_fkey(quantity, product_id, from_branch_id, to_branch_id)
`
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleOnSuccess = async (
    type: string,
    values: { id: string; data: string }
  ) => {
    try {
      const { error } =
        type === "damages"
          ? await supabase
              .from("products")
              .update({ damages_id: values?.data })
              .eq("id", values?.id)
              .select("id")
          : type === "transfer"
          ? await supabase
              .from("products")
              .update({ transfer_id: values?.data })
              .eq("id", values?.id)
              .select("id")
          : null;

      if (error) throw error;
      await refetch();
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to update products",
        variant: "destructive",
      });
    }
  };

  const handleAddProduct = async (values: Partial<Product>) => {
    try {
      if (!values.name) {
        toast({
          title: "Error",
          description: "Product name is required",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("products").insert({
        name: values.name,
        description: values?.description,
        price: values.price || 0,
        category: values?.category,
        openingStock: values?.openingStock,
        producedStock: values?.producedStock,
        transferIn: values?.transferIn,
        transferOut: values?.transferOut,
        complimentary: values?.complimentary,
        damages: values?.damages,
        sales: values?.sales,
        closingStock: values?.closingStock,
        image_url: values?.image_url,
        is_active: values?.is_active ?? true,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product added successfully",
      });
      setIsAddDialogOpen(false);
      refetch();
    } catch (error) {
      console.error("Error adding product:", error);
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Products</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <ProductForm onSubmit={handleAddProduct} />
          </DialogContent>
        </Dialog>

        <Button onClick={() => setAddComplimentaryOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add CMP
        </Button>
        {addComplimentaryOpen && (
          <ComplimentaryProductDialog
            open={addComplimentaryOpen}
            onOpenChange={setAddComplimentaryOpen}
            product={undefined}
            branchId={""}
          />
        )}

        <Button onClick={() => setAddDamageOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Damages
        </Button>
        {addDamageOpen && (
          <ProductDamageDialog
            open={addDamageOpen}
            onOpenChange={setAddDamageOpen}
            onSuccess={handleOnSuccess}
          />
        )}

        <Button onClick={() => setAddTransferOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Transfer
        </Button>
        {addTransferOpen && (
          <ProductTransferDialog
            open={addTransferOpen}
            onOpenChange={setAddTransferOpen}
            products={products}
            onSuccess={handleOnSuccess}
          />
        )}
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Op. Stock</TableHead>
              <TableHead>Prod. Stock</TableHead>
              <TableHead>TRF (In)</TableHead>
              <TableHead>TRF (Out)</TableHead>
              <TableHead>CMP</TableHead>
              <TableHead>DMG</TableHead>
              <TableHead>Sales</TableHead>
              <TableHead>Cl. Stock</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          {products?.length && !isLoading ? (
            <TableBody>
              {products?.map((product) => {
                const transfers = {
                  out:
                    product?.product_transfer?.[0]?.from_branch_id ===
                    userBranch?.id
                      ? product.product_transfer[0].quantity
                      : null,
                  in:
                    product?.product_transfer?.[0]?.to_branch_id ===
                    userBranch?.id
                      ? product.product_transfer[0].quantity || 0
                      : null,
                };

                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{product.openingStock}</TableCell>
                    <TableCell>{product.producedStock}</TableCell>
                    <TableCell className="text-center">
                      {transfers?.in}
                    </TableCell>
                    <TableCell className="text-center">
                      {transfers.out}
                    </TableCell>
                    <TableCell>{product.complimentary}</TableCell>
                    <TableCell>{product?.product_damages?.quantity}</TableCell>
                    <TableCell>{product.sales}</TableCell>
                    <TableCell>{product.closingStock}</TableCell>
                    <TableCell>
                      {product.is_active ? (
                        <span className="text-green-600">Profitable</span>
                      ) : (
                        <span className="text-red-600">Loss</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          ) : products?.length === 0 && !isLoading ? (
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

export default Products;
