import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProcurementOrders from "@/components/procurement/ProcurementOrders";
import MaterialRequests from "@/components/procurement/MaterialRequests";
import PoSummary from "@/components/procurement/PoSummary";

import { useToast } from "@/hooks/use-toast";

const Procurement = () => {
  const { toast } = useToast();

  // Subscribe to notifications for real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('procurement_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'procurement_orders'
        },
        (payload) => {
          console.log('Change received!', payload);
          toast({
            title: "Procurement Update",
            description: "A procurement order has been updated.",
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
      <h1 className="text-3xl font-bold">Procurement Management</h1>
      
      <Tabs defaultValue="requests" className="w-full">
        <TabsList>
          <TabsTrigger value="requests">Material Requests</TabsTrigger>
          <TabsTrigger value="orders">Procurement Orders</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
        </TabsList>
        
        <TabsContent value="requests">
          <MaterialRequests />
        </TabsContent>
        
        <TabsContent value="orders">
          <ProcurementOrders />
        </TabsContent>

        <TabsContent value="summary">
          <PoSummary />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Procurement;