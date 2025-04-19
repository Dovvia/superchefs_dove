import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LineChart, BarChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Label } from "@/components/ui/label";
import { ShoppingBag, Package, Banknote, TrendingUp } from "lucide-react";

interface ProductInventoryItem {
  id: string;
  quantity: number;
  product_id: string;
  branch_id: string;
  products: {
    name: string;
  }[];
}

interface Branch {
  id: string;
  name: string;
}


const BranchAnalytics = () => {
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [timeframe, setTimeframe] = useState<"weekly" | "monthly" | "yearly">("monthly");

  // Fetch all branches
  const { data: branches, isLoading: isLoadingBranches } = useQuery({
    queryKey: ["admin-branches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("*");
      
      if (error) {
        console.error("Error fetching branches:", error);
        throw error;
      }
      
      return data as Branch[];
    },
  });

  // Fetch sales data for selected branch or all branches if none selected
  const { data: salesData, isLoading: isLoadingSales } = useQuery({
    queryKey: ["admin-sales", selectedBranchId, timeframe],
    queryFn: async () => {
      try {
        let query = supabase
          .from("sales")
          .select(`
            id,
            created_at,
            total_amount,
            branch_id,
            payment_method
          `)
          .order("created_at", { ascending: false });
        
        if (selectedBranchId) {
          query = query.eq("branch_id", selectedBranchId);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error("Error fetching sales:", error);
          throw error;
        }
        
        // Group by date based on timeframe
        return groupByTimeframe(data || [], timeframe);
      } catch (error) {
        console.error("Sales query failed:", error);
        return []; // Return empty array on error
      }
    },
    enabled: true, // Always enable query, don't depend on branches
  });

  // Fetch inventory data
  const { data: inventoryData, isLoading: isLoadingInventory } = useQuery({
    queryKey: ["admin-inventory", selectedBranchId],
    queryFn: async () => {
      try {
        let query = supabase
          .from("inventory")
          .select(`
            id,
            quantity,
            material_id,
            branch_id,
            materials (
              name,
              unit
            )
          `);
        
        if (selectedBranchId) {
          query = query.eq("branch_id", selectedBranchId);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error("Error fetching inventory:", error);
          throw error;
        }
        
        return data || [];
      } catch (error) {
        console.error("Inventory query failed:", error);
        return []; // Return empty array on error  
      }
    },
    enabled: true, // Always enable
  });

  // Fetch product inventory data
  const { data: productInventoryData, isLoading: isLoadingProducts } = useQuery<ProductInventoryItem[]>({
    queryKey: ["admin-product-inventory", selectedBranchId],
    queryFn: async () => {
      try {
        let query = supabase
          .from("product_inventory")
          .select(`
            id,
            quantity,
            product_id,
            branch_id,
            products (
              name
            )
          `);
        
        if (selectedBranchId) {
          query = query.eq("branch_id", selectedBranchId);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error("Error fetching product inventory:", error);
          throw error;
        }
        
        return (data || []) as ProductInventoryItem[];
      } catch (error) {
        console.error("Product inventory query failed:", error);
        return []; // Return empty array on error
      }
    },
    enabled: true, // Always enable
  });

  // Helper function to group data by timeframe
  const groupByTimeframe = (data: any[], timeframe: "weekly" | "monthly" | "yearly") => {
    const result: Record<string, number> = {};
    
    data.forEach(item => {
      const date = new Date(item.created_at);
      let key: string;
      
      if (timeframe === "weekly") {
        // Group by day of week
        const dayOfWeek = date.toLocaleString('en-US', { weekday: 'short' });
        key = dayOfWeek;
      } else if (timeframe === "monthly") {
        // Group by month and day
        const month = date.toLocaleString('en-US', { month: 'short' });
        const day = date.getDate();
        key = `${month} ${day}`;
      } else {
        // Group by month
        key = date.toLocaleString('en-US', { month: 'short' });
      }
      
      if (!result[key]) {
        result[key] = 0;
      }
      
      result[key] += item.total_amount || 0;
    });
    
    return Object.entries(result).map(([name, value]) => ({ name, value }));
  };

  // Calculate summary metrics
  const calculateSummaryMetrics = () => {
    const salesTotal = salesData?.reduce((sum, item) => sum + (item.value || 0), 0) || 0;
    const materialCount = inventoryData?.length || 0;
    const productCount = productInventoryData?.length || 0;
    
    return {
      salesTotal,
      materialCount,
      productCount
    };
  };
  
  const metrics = calculateSummaryMetrics();
  const branchName = selectedBranchId && branches
  ? branches.find(b => b.id === selectedBranchId)?.name || "Unknown Branch"
  : "All Branches";

// Loading state for all queries
if (isLoadingBranches || isLoadingSales || isLoadingInventory || isLoadingProducts) {
  return <div>Loading analytics data...</div>;
}
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="space-y-2">
          <Label>Select Branch</Label>
          <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Branches</SelectItem>
              {branches?.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Time Period</Label>
          <Select value={timeframe} onValueChange={(value) => setTimeframe(value as any)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold">{branchName} Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{metrics.salesTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {timeframe === "weekly" ? "This week" : timeframe === "monthly" ? "This month" : "This year"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Materials</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.materialCount}</div>
            <p className="text-xs text-muted-foreground">Inventory items</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.productCount}</div>
            <p className="text-xs text-muted-foreground">Product inventory items</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="sales" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="inventory">Material Inventory</TabsTrigger>
          <TabsTrigger value="products">Product Inventory</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Performance</CardTitle>
              <CardDescription>
                {timeframe === "weekly" ? "Weekly" : timeframe === "monthly" ? "Monthly" : "Yearly"} sales performance for {branchName}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={salesData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Sales (₦)" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Material Inventory</CardTitle>
              <CardDescription>
                Current material inventory levels for {branchName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={(inventoryData || []).map(item => ({
                      name: item.materials?.map(material => material.name).join(", ") || "Unknown",
                      value: item.quantity || 0
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Quantity" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Inventory</CardTitle>
              <CardDescription>
                Current product inventory levels for {branchName}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={(productInventoryData || []).map(item => ({
                      name: item.products?.map(product => product.name).join(", ") || "Unknown",
                      value: item.quantity || 0
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Quantity" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BranchAnalytics;
