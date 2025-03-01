import { supabase } from "@/integrations/supabase/client";

export const sendNotification = async (title: string, message: string, branchId: string) => {
  const { error } = await supabase.from("notifications").insert([
    {
      title,
      message,
      branch_id: branchId,
      read: false,
      created_at: new Date().toISOString(),
    },
  ]);

  if (error) {
    console.error("Error sending notification:", error);
  }
};