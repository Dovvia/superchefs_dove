import { forwardRef, RefObject } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { naira } from "@/lib/utils";
import { DollarSign, TrendingUp, TrendingDown, Percent } from "lucide-react";

interface AccountsMetricsCardsProps {
  metrics: {
    revenue: number;
    cost: number;
    profit: number;
    costToRevenueRatio: number;
    totalItems: number;
  };
}

export const AccountsMetricsCards = forwardRef<
  HTMLDivElement,
  AccountsMetricsCardsProps
>(({ metrics }, ref) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" ref={ref}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <div className="h-4 w-4 text-primary">₦</div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {naira(metrics.revenue.toFixed(2))}
          </div>
          <p className="text-xs text-muted-foreground">
            From {metrics.totalItems} items sold
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
          <TrendingDown className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {naira(metrics.cost.toFixed(2))}
          </div>
          <p className="text-xs text-muted-foreground">Operating expenses</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          <TrendingUp className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {naira(metrics.profit.toFixed(2))}
          </div>
          <p className="text-xs text-muted-foreground">Revenue - Cost</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Cost/Revenue Ratio
          </CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.costToRevenueRatio.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">Cost as % of revenue</p>
        </CardContent>
      </Card>
    </div>
  );
});
