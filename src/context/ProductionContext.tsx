import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProductionRecord {
  branch: string;
  productName: string;
  yield: number;
  timestamp: string;
}

interface ProductionContextType {
  productionData: ProductionRecord[];
  addProductionRecord: (record: ProductionRecord) => void;
}

const ProductionContext = createContext<ProductionContextType | undefined>(
  undefined
);

export const ProductionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [productionData, setProductionData] = useState<ProductionRecord[]>([]);

  const addProductionRecord = (record: ProductionRecord) => {
    setProductionData((prev) => [record, ...prev]); // Add new record to the top
  };

  const fetchProductionData = async () => {
    try {
      const { data, error } = await supabase
        .from("production")
        .select(
          `
          branch_name,
          product_name,
          yield,
          timestamp
        `
        )
        .order("timestamp", { ascending: false });

      if (error) {
        console.error("Error fetching production data:", error);
        return;
      }

      if (data) {
        const formattedData = data.map((item) => ({
          branch: item.branch_name || "Unknown Branch",
          productName: item.product_name || "Unknown Product",
          yield: item.yield || 0,
          timestamp: item.timestamp || new Date().toISOString(),
        }));
        setProductionData(formattedData);
      } else {
        setProductionData([]); // Handle empty data
      }
    } catch (err) {
      console.error("Unexpected error fetching production data:", err);
    }
  };

  useEffect(() => {
    fetchProductionData();
  }, []);

  return (
    <ProductionContext.Provider value={{ productionData, addProductionRecord }}>
      {children}
    </ProductionContext.Provider>
  );
};

export const useProductionContext = () => {
  const context = useContext(ProductionContext);
  if (!context) {
    throw new Error(
      "useProductionContext must be used within a ProductionProvider"
    );
  }
  return context;
};
