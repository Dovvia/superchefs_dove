// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import { createClient } from "@supabase/supabase-js";

serve(async (_req: Request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Get today's date in YYYY-MM-DD
  const today = new Date();
  const dateString = today.toISOString().slice(0, 10);

  // Fetch all branches
  const { data: branches, error: branchError } = await supabase
    .from("branches")
    .select("id");
  if (branchError || !branches) {
    console.error("Branch fetch error", branchError);
    return new Response("Branch fetch error", { status: 500 });
  }

  // Fetch all materials
  const { data: materials, error: matError } = await supabase
    .from("materials")
    .select("id");
  if (matError || !materials) {
    console.error("Material fetch error", matError);
    return new Response("Material fetch error", { status: 500 });
  }

  let insertCount = 0;
  let skipCount = 0;

  for (const branch of branches) {
    for (const material of materials) {
      // Query your summary view for today for this branch/material
      const { data: summary, error: sumError } = await supabase
        .from("branch_today_material_summary_view")
        .select("*")
        .eq("branch_id", branch.id)
        .eq("material_id", material.id)
        .maybeSingle();

      if (sumError) {
        console.error("Summary fetch error", sumError);
        continue;
      }

      const currentQuantity =
        (summary?.opening_stock ?? 0) +
        (summary?.total_quantity ?? 0) +
        (summary?.total_procurement_quantity ?? 0) +
        (summary?.total_transfer_in_quantity ?? 0) -
        (summary?.total_transfer_out_quantity ?? 0) -
        (summary?.total_usage ?? 0) -
        (summary?.total_damage_quantity ?? 0);

      // Check if already exists for today
      const { data: existing, error: existError } = await supabase
        .from("material_closing_stock")
        .select("id")
        .eq("branch_id", branch.id)
        .eq("material_id", material.id)
        .eq("date", dateString)
        .maybeSingle();

      if (!existing && !existError) {
        // Insert new closing stock row
        const { error: insertError } = await supabase
          .from("material_closing_stock")
          .insert([
            {
              branch_id: branch.id,
              material_id: material.id,
              quantity: currentQuantity,
            },
          ]);
        if (insertError) {
          console.error("Insert error", insertError);
        } else {
          insertCount++;
        }
      } else {
        skipCount++;
      }
    }
  }

  return new Response(
    `Closing stock saved for all branches/materials. Inserted: ${insertCount}, Skipped: ${skipCount}`,
    { status: 200 }
  );
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/save_material_closing_stock' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
