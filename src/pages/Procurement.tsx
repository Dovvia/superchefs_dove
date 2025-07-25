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
    <div className="space-y-6 p-3 bg-transparent rounded-lg shadow-md w-full mx-auto margin-100">
      <h1 className="text-3xl font-bold">Procurement Management</h1>
      <Tabs defaultValue="requests" className="w-full  ">
        <TabsList className="bg-white text-black shadow-sm rounded-lg p-1">
          <TabsTrigger
            value="requests"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
          >
            Requests
          </TabsTrigger>
          <TabsTrigger
            value="orders"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
          >
            POs
          </TabsTrigger>
          <TabsTrigger
            value="summary"
            className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
          >
            Summary
          </TabsTrigger>
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