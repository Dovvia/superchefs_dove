import { forwardRef, RefObject } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Percent } from "lucide-react";

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
    <div ref={ref}>

      <Card className="hover:bg-yellow-50 transition-colors cursor-pointer hover:scale-110 hover:shadow-lg transition-transform duration-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">
            Cost/Revenue Ratio
          </CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent> 
          {metrics.costToRevenueRatio > 75 ?
          <div className="text-2xl font-bold text-red-600">
            {metrics.costToRevenueRatio.toFixed(1)}%
          </div> : <div className="text-2xl font-bold text-green-600">
            {metrics.costToRevenueRatio.toFixed(1)}%
          </div>
          }
          <p className="text-xs text-muted-foreground">Cost as % of revenue</p>
        </CardContent>
      </Card>
    </div>
  );
});
