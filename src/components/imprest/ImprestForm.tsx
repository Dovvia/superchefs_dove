// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import * as z from "zod";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Plus, Trash2 } from "lucide-react";
// import { useState } from "react";
// import { useQuery } from "@tanstack/react-query";
// import { supabase } from "@/integrations/supabase/client";
// import { useAuth } from "@/hooks/auth";

// const formSchema = z.object({
//   item: z.string().min(1, "Please input an item"),
//   unit: z.string().min(1, "Please input a unit"),
//   unit_price: z
//     .number()
//     .min(1, "Unit price is required")
//     .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
//       message: "Unit price must be greater than zero",
//     }),
//   quantity: z
//     .number()
//     .min(1, "Quantity is required")
//     .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
//       message: "Quantity must be greater than zero",
//     }),
//   branch: z.string().optional(),
//   user: z.string().optional(),
//   status: z.string().optional(),
// });

// export type ImprestFormValues = z.infer<typeof formSchema>;

// interface ImprestFormProps {
//   onSubmit: (values: ImprestFormValues) => Promise<void>;
//   isLoading: boolean;
//   onCancel: () => void;
// }

// const ImprestForm = ({ onSubmit, isLoading, onCancel }: ImprestFormProps) => {
//   const form = useForm<ImprestFormValues>({
//     resolver: zodResolver(formSchema),
//     defaultValues: {
//       item: "",
//       quantity: 0,
//       unit: "",
//       unit_price: 0,
//       branch: "",
//       user: "",
//       status: "",
//     },
//   });

//   const [items, setItems] = useState<ImprestFormValues[]>([]);

//   const addItem = () => {
//     setItems([
//       ...items,
//       {
//         item: "",
//         unit: "",
//         unit_price: 0,
//         quantity: 0,
//         branch: "",
//         user: "",
//         status: "",
//       },
//     ]);
//   };

//   const removeItem = (index: number) => {
//     setItems(items.filter((_, i) => i !== index));
//   };

//   const calculateTotalCost = (quantity: number, unit_price: number): number => {
//     return quantity * unit_price;
//   };

//   return (
//     <Form {...form}>
//       <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//         {items.map((_, index) => (
//           <div className="flex grid-cols-2 gap-4" key={index}>
//             <FormItem>
//               <FormControl>
//                 <Input
//                   placeholder="Item"
//                   type="text"
//                   {...form.register(`items.${index}.item`)}
//                 />
//               </FormControl>
//               <FormMessage />
//             </FormItem>

//             <FormItem>
//               <FormControl>
//                 <Input
//                   placeholder="Unit (kg)"
//                   type="text"
//                   {...form.register(`items.${index}.unit`)}
//                 />
//               </FormControl>
//               <FormMessage />
//             </FormItem>

//             <FormItem>
//               <FormControl>
//                 <Input
//                   placeholder="Unit Price"
//                   type="number"
//                   {...form.register(`items.${index}.unit_price`, {
//                     valueAsNumber: true,
//                   })}
//                 />
//               </FormControl>
//               <FormMessage />
//             </FormItem>

//             <FormItem>
//               <FormControl>
//                 <Input
//                   placeholder="Qty"
//                   type="number"
//                   {...form.register(`items.${index}.quantity`, {
//                     valueAsNumber: true,
//                   })}
//                 />
//               </FormControl>
//               <FormMessage />
//             </FormItem>

//             <FormItem>
//               <FormControl>
//                 <Input
//                   placeholder="Total"
//                   type="number"
//                   value={calculateTotalCost(
//                     form.getValues(`items.${index}.quantity`),
//                     form.getValues(`items.${index}.unit_price`)
//                   )}
//                   readOnly
//                 />
//               </FormControl>
//               <FormMessage />
//             </FormItem>

//             <Button
//               type="button"
//               variant="destructive"
//               size="sm"
//               className="mt-0.5"
//               onClick={() => removeItem(index)}
//             >
//               <Trash2 className="h-4 w-4" />
//             </Button>
//           </div>
//         ))}

//         <Button type="button" variant="outline" size="sm" onClick={addItem}>
//           <Plus className="h-4 w-4 mr-2" />
//           Add Item
//         </Button>

//         <div className="flex justify-end space-x-2">
//           <Button type="button" variant="outline" onClick={onCancel}>
//             Cancel
//           </Button>
//           <Button type="submit" disabled={isLoading}>
//             {isLoading ? "Sending..." : "Send imprest"}
//           </Button>
//         </div>
//       </form>
//     </Form>
//   );
// };

// export default ImprestForm;



import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

const formSchema = z.object({
  items: z.array(z.object({
    item: z.string().min(1, "Please input an item"),
    unit: z.string().min(1, "Please input a unit"),
    unit_price: z.number().min(1, "Unit price is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Unit price must be greater than zero",
    }),
    quantity: z.number().min(1, "Quantity is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Quantity must be greater than zero",
    }),
    branch: z.string().optional(),
    user: z.string().optional(),
    status: z.string().optional(),
  })),
});

export type ImprestFormValues = z.infer<typeof formSchema>;

interface ImprestFormProps {
  onSubmit: (values: ImprestFormValues) => Promise<void>;
  isLoading: boolean;
  onCancel: () => void;
}

const ImprestForm = ({ onSubmit, isLoading, onCancel }: ImprestFormProps) => {
  const form = useForm<ImprestFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items: [{
        item: "",
        quantity: 0,
        unit: "",
        unit_price: 0,
        branch: "",
        user: "",
        status: "",
      }],
    },
  });

  const [items, setItems] = useState<ImprestFormValues["items"]>(form.getValues().items);

  const addItem = () => {
    const newItem = {
      item: "",
      unit: "",
      unit_price: 0,
      quantity: 0,
      branch: "",
      user: "",
      status: "",
    };
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    form.setValue("items", updatedItems as ImprestFormValues["items"]);
  };

  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
    form.setValue("items", updatedItems);
  };

  const calculateTotalCost = (quantity: number, unit_price: number): number => {
    return quantity * unit_price;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => onSubmit(values))} className="space-y-4">
        {items.map((_, index) => (
          <div className="flex grid-cols-2 gap-4" key={index}>
            <FormItem>
              <FormControl>
                <Input
                  placeholder="Item"
                  type="text"
                  {...form.register(`items.${index}.item`)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem>
              <FormControl>
                <Input
                  placeholder="Unit (kg)"
                  type="text"
                  {...form.register(`items.${index}.unit`)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem>
              <FormControl>
                <Input
                  placeholder="Unit Price"
                  type="number"
                  {...form.register(`items.${index}.unit_price`, {
                    valueAsNumber: true,
                  })}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem>
              <FormControl>
                <Input
                  placeholder="Qty"
                  type="number"
                  {...form.register(`items.${index}.quantity`, {
                    valueAsNumber: true,
                  })}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem>
              <FormControl>
                <Input
                  placeholder="Total"
                  type="number"
                  value={calculateTotalCost(
                    form.getValues(`items.${index}.quantity`),
                    form.getValues(`items.${index}.unit_price`)
                  )}
                  readOnly
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="mt-0.5"
              onClick={() => removeItem(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send imprest"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ImprestForm;