import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import ImprestRequests from "@/components/imprest/ImprestRequests";
import ImprestOrders from "@/components/imprest/ImprestOrders";

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
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Imprest Management</h1>

      <Tabs defaultValue="requests" className="w-full">
        <TabsList>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <ImprestRequests />
        </TabsContent>

        <TabsContent value="orders">
          <ImprestOrders />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImprestManagement;
