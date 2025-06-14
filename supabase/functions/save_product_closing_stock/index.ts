// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "jsr:@supabase/functions-js";
import { createClient } from "jsr:@supabase/supabase-js";

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

  // Fetch all products
  const { data: products, error: prodError } = await supabase
    .from("products")
    .select("id");
  if (prodError || !products) {
    console.error("Product fetch error", prodError);
    return new Response("Product fetch error", { status: 500 });
  }

  let insertCount = 0;
  let skipCount = 0;

  for (const branch of branches) {
    for (const product of products) {
      // Query your summary view for today for this branch/product
      const { data: summary, error: sumError } = await supabase
        .from("branch_today_product_summary_view")
        .select("*")
        .eq("branch_id", branch.id)
        .eq("product_id", product.id)
        .maybeSingle();

      if (sumError) {
        console.error("Summary fetch error", sumError);
        continue;
      }

      // Calculate current quantity using your Products.tsx logic
      const currentQuantity =
        (summary?.opening_stock ?? 0) +
        (summary?.total_quantity ?? 0) +
        (summary?.total_yield ?? 0) +
        (summary?.total_transfer_in_quantity ?? 0) -
        (summary?.total_transfer_out_quantity ?? 0) -
        (summary?.total_complimentary_quantity ?? 0) -
        (summary?.total_damage_quantity ?? 0) -
        (summary?.total_sale_quantity ?? 0);

      // Check if already exists for today
      const { data: existing, error: existError } = await supabase
        .from("product_closing_stock")
        .select("id")
        .eq("branch_id", branch.id)
        .eq("product_id", product.id)
        .gte("created_at", `${dateString}T00:00:00.000Z`)
        .lt("created_at", `${dateString}T23:59:59.999Z`)
        .maybeSingle();

      if (!existing && !existError) {
        // Insert new closing stock row
        const { error: insertError } = await supabase
          .from("product_closing_stock")
          .insert([
            {
              branch_id: branch.id,
              product_id: product.id,
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
    `Product closing stock saved for all branches/products. Inserted: ${insertCount}, Skipped: ${skipCount}`,
    { status: 200 }
  );
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/save_product_closing_stock' \
    --header 'Authorization: Bearer <your_anon_or_service_role_token>' \
    --header 'Content-Type: application/json' \
    --data '{}'

*/
