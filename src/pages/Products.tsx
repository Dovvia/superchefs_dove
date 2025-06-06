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
import { Plus, Settings } from "lucide-react";
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
import UpdateProductPriceDialog from "@/components/products/UpdateProductPriceDialog";
import UpdateProductQuantityDialog from "@/components/products/UpdateProductQuantityDialog";
import InsertProductQuantityDialog from "@/components/products/InsertProductQuantityDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CumulativeProductView = {
  total_transfer_out_quantity: number;
  total_transfer_in_quantity: number;
  product_id: string;
  product_name: string;
  branch_id: string;
  total_quantity: number;
  selling_price: number;
  total_sale_quantity: number;
  total_damage_quantity: number;
  total_transfer_quantity: number;
  total_complimentary_quantity: number;
  total_yield: number;
};

type ProductRecipe = {
  product_id: string;
  unit_cost: number;
  selling_price: number;
  ucrr: number;
};

type ExtendedProduct = Product & {
  product_damage?: { quantity: number }[];
  product_transfer?: {
    quantity: number;
    from_branch_id: string;
    to_branch_id: string;
  }[];
};

const Products = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addComplimentaryOpen, setAddComplimentaryOpen] = useState(false);
  const [addDamageOpen, setAddDamageOpen] = useState(false);
  const [addTransferOpen, setAddTransferOpen] = useState(false);
  const [isPriceDialogOpen, setIsPriceDialogOpen] = useState(false);
  const [isQuantityDialogOpen, setIsQuantityDialogOpen] = useState(false);
  const [isInsertQuantityDialogOpen, setIsInsertQuantityDialogOpen] =
    useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [timePeriod, setTimePeriod] = useState<string>("this_month");

  const { toast } = useToast();
  const { data: userBranch } = useUserBranch() as {
    data: { name: string; id: string; role: string } | null;
  };
  const queryClient = useQueryClient();

  const getViewName = () => {
    if (userBranch?.name === "HEAD OFFICE" && selectedBranch === "all") {
      switch (timePeriod) {
        case "today":
          return "admin_today_product_summary_view";
        case "this_week":
          return "admin_this_week_product_summary_view";
        case "this_month":
          return "admin_this_month_product_summary_view";
        case "this_year":
          return "admin_this_year_product_summary_view";
        default:
          return "admin_today_product_summary_view";
      }
    } else {
      switch (timePeriod) {
        case "today":
          return "branch_today_product_summary_view";
        case "this_week":
          return "branch_this_week_product_summary_view";
        case "this_month":
          return "branch_this_month_product_summary_view";
        case "this_year":
          return "branch_this_year_product_summary_view";
        default:
          return "branch_today_product_summary_view";
      }
    }
  };

  const {
    data: products,
    refetch,
    isLoading,
  } = useQuery<CumulativeProductView[] | ExtendedProduct[]>({
    queryKey: ["products", selectedBranch, timePeriod],
    queryFn: async () => {
      const viewName = getViewName();

      // If the user is a branch user, filter by their branch_id
      if (userBranch?.name !== "HEAD OFFICE") {
        const { data, error } = await supabase
          .from(viewName)
          .select("*")
          .eq("branch_id", userBranch?.id); // Filter by branch_id for branch users

        if (error) throw error;
        return data as CumulativeProductView[];
      }

      // For HEAD OFFICE users, allow filtering by selectedBranch or show all
      let query = supabase.from(viewName).select("*");

      if (selectedBranch !== "all") {
        query = query.eq("branch_id", selectedBranch);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CumulativeProductView[];
    },
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  const { data: productRecipes } = useQuery<ProductRecipe[]>({
    queryKey: ["product_recipes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_recipes")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const { data, error } = await supabase.from("branches").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: productsData } = useQuery({
    queryKey: ["products_data"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return data as Product[];
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

  const handleOpenPriceDialog = (product: { id: string; name: string }) => {
    setSelectedProduct(product);
    setIsPriceDialogOpen(true);
  };

  const handleOpenQuantityDialog = (product: { id: string; name: string }) => {
    setSelectedProduct(product);
    setIsQuantityDialogOpen(true);
  };

  return (
    <div className="space-y-6 p-2 bg-white rounded-lg shadow-md w-full mx-auto margin-100">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Products</h2>

        <div className="absolute z-40 w-full grid grid-cols-4 bg-transparent">
          <details className="group absolute">
            <summary className="cursor-pointer hover:text-green-600 p-2">
              <span className="text-lg font-semibold">Actions</span>
            </summary>
            <div className="absolute  bg-white shadow-lg rounded-lg p-4">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="m-0.5 bg-green-800">
                    <Plus className="h-4 w-4" />
                    Product
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                  </DialogHeader>
                  <ProductForm onSubmit={handleAddProduct} />
                </DialogContent>
              </Dialog>

              <Button
                className="m-0.5 bg-green-800"
                onClick={() => setIsInsertQuantityDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add Qty
              </Button>
              {isInsertQuantityDialogOpen && (
                <InsertProductQuantityDialog
                  open={isInsertQuantityDialogOpen}
                  onOpenChange={setIsInsertQuantityDialogOpen}
                  products={productsData || []}
                  branches={branches || []}
                  onSuccess={handleOnSuccess}
                />
              )}

              <Button
                className="m-0.5"
                onClick={() => setAddComplimentaryOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add CMP
              </Button>
              {addComplimentaryOpen && (
                <ComplimentaryProductDialog
                  open={addComplimentaryOpen}
                  onOpenChange={setAddComplimentaryOpen}
                  products={productsData || []}
                  onSuccess={handleOnSuccess}
                />
              )}

              <Button className="m-0.5" onClick={() => setAddDamageOpen(true)}>
                <Plus className="h-4 w-4" />
                Add Damages
              </Button>
              {addDamageOpen && (
                <ProductDamageDialog
                  products={productsData || []}
                  open={addDamageOpen}
                  onOpenChange={setAddDamageOpen}
                  onSuccess={handleOnSuccess}
                />
              )}

              <Button
                className="m-0.5"
                onClick={() => setAddTransferOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Transfer
              </Button>
              {addTransferOpen && (
                <ProductTransferDialog
                  products={productsData || []}
                  open={addTransferOpen}
                  onOpenChange={setAddTransferOpen}
                  onSuccess={handleOnSuccess}
                />
              )}
            </div>
          </details>
        </div>

        <div className="flex space-x-4">
          {userBranch?.name === "HEAD OFFICE" && (
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches?.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select Time Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg">
        <div className="overflow-x-auto">
          <Table className="w-full table-auto">
            <TableHeader className="sticky bg-gray-200 top-0 bg-white z-10">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>QC</TableHead>
                <TableHead>Prod. Stock</TableHead>
                <TableHead>TRF (In)</TableHead>
                <TableHead>TRF (Out)</TableHead>
                <TableHead>CMP</TableHead>
                <TableHead>DMG</TableHead>
                <TableHead>Sales</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>Sales Cost</TableHead>
                <TableHead>N-S Cost</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Sales Amt</TableHead>
                <TableHead>UCRR</TableHead>
                <TableHead>SCRR</TableHead>
                <TableHead>
                  <Settings className="h-4 w-4 text-gray-800 ml-2" />
                </TableHead>
              </TableRow>
            </TableHeader>
            {products && products.length > 0 && !isLoading ? (
              <TableBody>
                {products.map((product) => {
                  const recipe = productRecipes?.find(
                    (r) => r.product_id === product.product_id
                  );
                  const scrr = {
                    salesAmt:
                      (product.selling_price || 0) *
                      (product.total_sale_quantity || 0),
                    nSalesCost:
                      (product.total_complimentary_quantity ||
                        0 + product.total_damage_quantity ||
                        0) * (recipe?.unit_cost || 0),
                    scrr:
                      ((recipe?.unit_cost || 0) /
                        (recipe?.selling_price || 1)) *
                      100,
                  };

                  return (
                    <TableRow key={product.product_id}>
                      <TableCell>{product.product_name}</TableCell>
                      <TableCell>{product.total_quantity || 0}</TableCell>
                      <TableCell>{product.total_yield || 0}</TableCell>
                      <TableCell>
                        {product.total_transfer_in_quantity || 0}
                      </TableCell>
                      <TableCell>
                        {product.total_transfer_out_quantity || 0}
                      </TableCell>
                      <TableCell>
                        {product.total_complimentary_quantity || 0}
                      </TableCell>
                      <TableCell>
                        {product.total_damage_quantity || 0}
                      </TableCell>
                      <TableCell>{product.total_sale_quantity || 0}</TableCell>
                      <TableCell>₦{recipe?.unit_cost || 0}</TableCell>

                      <TableCell>₦{}</TableCell>
                      <TableCell>₦{}</TableCell>
                      <TableCell>₦{recipe?.selling_price || 0}</TableCell>
                      <TableCell>₦{scrr.salesAmt.toFixed(2) || 0}</TableCell>
                      <TableCell>
                        {scrr.scrr > 75 ? (
                          <span className="text-red-600">
                            {scrr.scrr.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-green-600">
                            {scrr.scrr.toFixed(2)}%
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{}</TableCell>
                      <TableCell>
                        <Select
                          onValueChange={(value) => {
                            if (value === "update_price") {
                              handleOpenPriceDialog({
                                id: product.product_id,
                                name: product.product_name,
                              });
                            } else if (value === "update_quantity") {
                              handleOpenQuantityDialog({
                                id: product.product_id,
                                name: product.product_name,
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="w-3 justify-end appearance-none [&>svg]:hidden p-0 bg-transparent border-0 text-green-500 hover:text-green-900 text-xl font-bold">
                            <SelectValue placeholder="⋮" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem
                              value="update_price"
                              disabled={userBranch?.name !== "HEAD OFFICE"}
                              className={`${
                                userBranch?.name !== "HEAD OFFICE"
                                  ? "text-gray-400 cursor-not-allowed"
                                  : ""
                              }`}
                            >
                              <span className="pl-1">⋮</span> Update Price
                            </SelectItem>
                            <SelectItem
                              value="update_quantity"
                              disabled={userBranch?.name !== "HEAD OFFICE"}
                              className={`${
                                userBranch?.name !== "HEAD OFFICE"
                                  ? "text-gray-400 cursor-not-allowed"
                                  : ""
                              }`}
                            >
                              <span className="pl-1">⋮</span> Add Qty
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
                  <TableCell colSpan={18} className="text-center">
                    {isLoading
                      ? "Loading, please wait..."
                      : "No products found."}
                  </TableCell>
                </TableRow>
              </TableBody>
            )}
          </Table>
        </div>
      </div>

      <UpdateProductPriceDialog
        open={isPriceDialogOpen}
        onOpenChange={setIsPriceDialogOpen}
        product={selectedProduct}
        onSuccess={handleOnSuccess}
      />
      <UpdateProductQuantityDialog
        open={isQuantityDialogOpen}
        onOpenChange={setIsQuantityDialogOpen}
        product={selectedProduct}
        branches={branches || []}
        onSuccess={handleOnSuccess}
      />
    </div>
  );
};

export default Products;
