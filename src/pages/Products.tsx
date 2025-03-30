import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const { data: userBranch } = useUserBranch() as {
    data: { id: string } | null;
  };
  const queryClient = useQueryClient();
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
        opening_stock:product_inventory(opening_stock), 
        production:product_inventory(production), 
        ucrr:product_recipes!product_recipes_product_id_fkey(ucrr, unit_cost, selling_price), 
        sale_item:sale_items!sale_items_product_id_fkey(quantity),
        product_damage:product_damages!product_damages_product_id_fkey(quantity), 
        product_transfer:product_transfers!product_transfers_product_id_fkey(quantity, from_branch_id, to_branch_id),
        cmp:complimentary_products!complimentary_products_product_id_fkey1(quantity)`
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleOnSuccess = () =>
    queryClient.invalidateQueries({ queryKey: ["products"] });

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
        branch_id: userBranch?.id,
        unit_cost: values?.unit_cost,
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
            products={products}
            onSuccess={handleOnSuccess}
          />
        )}

        <Button onClick={() => setAddDamageOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Damages
        </Button>
        {addDamageOpen && (
          <ProductDamageDialog
            products={products}
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
            products={products as Product[]}
            open={addTransferOpen}
            onOpenChange={setAddTransferOpen}
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
              <TableHead>Open Stock</TableHead>
              <TableHead>Prod. Stock</TableHead>
              <TableHead>TRF (In)</TableHead>
              <TableHead>TRF (Out)</TableHead>
              <TableHead>CMP</TableHead>
              <TableHead>DMG</TableHead>
              <TableHead>Sales</TableHead>
              <TableHead>Close Stock</TableHead>
              <TableHead>Unit Cost</TableHead>
              <TableHead>Sales Cost</TableHead>
              <TableHead>N-S Cost</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Sales Amt</TableHead>
              <TableHead>UCRR</TableHead>
              <TableHead>SCRR</TableHead>
            </TableRow>
          </TableHeader>
          {products && products.length > 0 && !isLoading ? (
            <TableBody>
              {products.map((product) => {
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

                const scrr = {
                  nSalesCost: (product?.cmp?.[0]?.quantity || 0 + product?.product_damage?.[0]?.quantity || 0) * (product.ucrr?.[0]?.unit_cost || 0),

                  salesCost: (product.ucrr?.[0]?.unit_cost || 0) * (product?.sale_item?.[0]?.quantity || 0),
                  salesAmt: (product.ucrr?.[0]?.selling_price || 0) * (product?.sale_item?.[0]?.quantity || 0),
                  unitCost: product.ucrr?.[0]?.unit_cost ? product.ucrr?.[0].unit_cost.toFixed(1) : 0,
                  unitPrice: product.ucrr?.[0]?.selling_price || 0,
                };
                const scrrCal = {
                  scrrp: ((scrr.salesCost + scrr.nSalesCost) / scrr.salesAmt)
                  * 100 || 0,
                };

                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>
                      {product?.opening_stock?.[0]?.opening_stock }
                    </TableCell>
                    <TableCell>
                      {product?.production?.[0]?.production}
                    </TableCell>
                    <TableCell className="text-center">
                      {transfers?.in}
                    </TableCell>
                    <TableCell className="text-center">
                      {transfers?.out}
                    </TableCell>
                    <TableCell className="text-center">
                      {product?.cmp?.[0]?.quantity}
                    </TableCell>
                    <TableCell className="text-center">
                      {product?.product_damage?.[0]?.quantity}
                    </TableCell>
                    <TableCell>{product?.sale_item?.[0]?.quantity}</TableCell>
                    <TableCell>{product.closingStock}</TableCell>
                    <TableCell>{scrr?.unitCost}</TableCell>
                    <TableCell>{scrr?.salesCost?.toFixed(2)}</TableCell>
                    <TableCell>{scrr?.nSalesCost?.toFixed(2)}</TableCell>
                    <TableCell>{scrr?.unitPrice}</TableCell>
                    <TableCell>{scrr?.salesAmt}</TableCell>
                    
                    <TableCell>
                      {product.ucrr?.[0]?.ucrr > 0.75 ? (
                        <span className="text-red-600">
                          {product.ucrr?.[0]?.ucrr * 100}%
                        </span>
                      ) : (
                        <span className="text-green-600">
                          {product.ucrr?.[0]?.ucrr * 100}%
                        </span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      {scrrCal.scrrp > 75 ? (
                        <span className="text-red-600">
                          {scrrCal.scrrp?.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-green-600">
                          {scrrCal.scrrp?.toFixed(2)}%
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          ) : !isLoading ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={12} className="text-center">
                  No products found.
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              <TableRow>
                <TableCell colSpan={12} className="text-center">
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
