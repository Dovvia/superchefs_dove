import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChartBar, Filter, Download } from "lucide-react";
import dayjs from "dayjs";
import { DateRange } from "react-day-picker";
import { supabase } from "@/integrations/supabase/client";
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
import { AccountsMetricsCards } from "@/components/accounts/AccountsMetricsCards";
import { AccountsChart } from "@/components/accounts/AccountsChart";
import { Sale } from "@/types/sales";
import { naira } from "@/lib/utils";
import useAccountReportGenerator from "@/hooks/use-generate-report";
import { useUserBranch } from "@/hooks/user-branch";
import { UserMetadata } from "@supabase/supabase-js";

const Accounts = () => {
  const ContentRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState({
    email: null,
    email_verified: true,
    first_name: null,
    last_name: null,
    phone_verified: false,
    role: null,
    sub: null,
  } as UserMetadata);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const generate = useAccountReportGenerator;
  // const browserPrint = useHandlePrint(ContentRef); // for browser printing
  const {
    data: { name },
  } = useUserBranch();

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
            unit_cost,
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
        const itemCost = item.unit_cost * item.quantity;

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

  const accountData = useMemo(() => {
    return {
      username: `${user?.first_name} ${user?.last_name}`,
      userBranch: name,
      dateRange: !dateRange
        ? "All time"
        : `${dayjs(dateRange?.from).format("Do MMMM YYYY")} - ${dayjs(
            dateRange?.to
          ).format("Do MMMM YYYY")}`,
      filters: {
        branches:
          selectedBranch === "all"
            ? "All Branches"
            : branches?.filter((x) => x?.id === selectedBranch)[0]?.name,
        products:
          selectedProduct === "all"
            ? "All Products"
            : products?.filter((x) => x?.id === selectedProduct)[0]?.name,
      },
      financialSummary: {
        totalRevenue: metrics.revenue,
        itemsSold: metrics.totalItems,
        totalCost: metrics.cost,
        netProfit: metrics.profit,
        costRevenueRatio: metrics.costToRevenueRatio.toFixed(1),
      },
      salesDetails: salesData?.map((x) => {
        return {
          date: dayjs(x?.created_at).format("D MMMM, YYYY"),
          branch: branches?.filter((b) => b?.id === x?.branch_id)[0]?.name,
          items: x?.items
            ?.map((t) => `${t?.quantity}x ${t?.product?.name}`)
            .join(", "),
          amount: naira(x?.total_amount),
        };
      }),
      revenueVsCost: {
        labels: [dayjs(salesData?.[0]?.created_at).format("DD/MM/YYYY")],
        revenue: [metrics?.revenue],
        cost: [metrics?.cost],
      },
    };
  }, [
    branches,
    dateRange,
    metrics.cost,
    metrics.costToRevenueRatio,
    metrics.profit,
    metrics.revenue,
    metrics.totalItems,
    name,
    products,
    salesData,
    selectedBranch,
    selectedProduct,
    user?.first_name,
    user?.last_name,
  ]);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: {
          user: { user_metadata },
        },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error);
        return;
      }
      setUser(user_metadata);
    };

    fetchUser();
  }, []);

  return (
    <div className="space-y-6 p-3 bg-transparent rounded-lg shadow-md w-full mx-auto margin-100">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Accounts</h2>
        <Button onClick={generate({ data: accountData }).pdf}>
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

      <AccountsMetricsCards metrics={metrics} ref={ContentRef} />

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
                      {dayjs(new Date(sale.created_at)).format("D MMMM, YYYY")}
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
