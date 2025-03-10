import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerWithRange } from "@/components/accounts/DateRangePicker";
import { Button } from "@/components/ui/button";
import { ChartBar, Filter, Download } from "lucide-react";
import { AccountsMetricsCards } from "@/components/accounts/AccountsMetricsCards";
import { AccountsChart } from "@/components/accounts/AccountsChart";
import { DateRange } from "react-day-picker";
import { Sale } from "@/types/sales";
import { naira } from "@/lib/utils";

const Accounts = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");

  const { data: branches } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: salesData } = useQuery({
    queryKey: ["sales", dateRange, selectedBranch, selectedProduct],
    queryFn: async () => {
      let query = supabase.from("sales").select(`
          *,
          branch:branches(name),
          items:sale_items(
            quantity,
            unit_price,
            subtotal,
            product:products(*)
          )
        `);

      if (dateRange?.from && dateRange?.to) {
        query = query
          .gte("created_at", dateRange.from.toISOString())
          .lte("created_at", dateRange.to.toISOString());
      }

      if (selectedBranch !== "all") {
        query = query.eq("branch_id", selectedBranch);
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });
      if (error) throw error;

      if (selectedProduct !== "all") {
        return data.map((sale) => ({
          ...sale,
          items: sale.items.filter(
            (item) => item.product.id === selectedProduct
          ),
        }));
      }

      return data;
    },
  });

  const calculateMetrics = (sales: Sale[]) => {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalItems = 0;

    sales?.forEach((sale) => {
      sale.items?.forEach((item) => {
        const itemRevenue = item.subtotal;
        const itemCost = itemRevenue * 0.6;

        totalRevenue += itemRevenue;
        totalCost += itemCost;
        totalItems += item.quantity;
      });
    });

    const profit = totalRevenue - totalCost;
    const costToRevenueRatio =
      totalRevenue > 0 ? (totalCost / totalRevenue) * 100 : 0;

    return {
      revenue: totalRevenue,
      cost: totalCost,
      profit,
      costToRevenueRatio,
      totalItems,
    };
  };

  const metrics = calculateMetrics((salesData as unknown as Sale[]) || []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Accounts</h2>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <DatePickerWithRange date={dateRange} setDate={setDateRange} />

        <Select value={selectedBranch} onValueChange={setSelectedBranch}>
          <SelectTrigger className="w-full md:w-[200px]">
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

        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Select Product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {products?.map((product) => (
              <SelectItem key={product.id} value={product.id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <AccountsMetricsCards metrics={metrics} />

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <AccountsChart data={salesData || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData?.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      {format(new Date(sale.created_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>{sale.branch?.name}</TableCell>
                    <TableCell>
                      {sale.items
                        ?.map(
                          (item) => `${item.quantity}x ${item.product.name}`
                        )
                        .join(", ")}
                    </TableCell>
                    <TableCell className="text-right">
                      {naira(sale.total_amount.toFixed(2))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Accounts;
