import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import ImprestRequests from "@/components/imprest/ImprestRequests";
import ImprestOrders from "@/components/imprest/ImprestOrders";
import ImprestSummary from "@/components/imprest/ImprestSummary";

const ImprestManagement = () => {
  const { toast } = useToast();

  // Subscribe to notifications for real-time updates
  useEffect(() => {
    const channel = supabase
      .channel("imprest_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "imprest_orders",
        },
        (payload) => {
          console.log("Change received!", payload);
          toast({
            title: "Imprest Update",
            description: "An imprest order has been updated.",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  return (
    <div className="space-y-6 p-3 bg-white rounded-lg shadow-md w-full mx-auto margin-100">
      <h1 className="text-3xl font-bold">Imprest Management</h1>

      <Tabs defaultValue="requests" className="w-full">
        <TabsList>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <ImprestRequests />
        </TabsContent>

        <TabsContent value="orders">
          <ImprestOrders />
        </TabsContent>

        <TabsContent value="summary">
          <ImprestSummary />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImprestManagement;
