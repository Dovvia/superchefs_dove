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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Material } from "@/types/inventory";
import { Plus, Trash2, PackageMinus, Gift } from "lucide-react";
import currency from "currency.js";
import { Unit } from "../ui/unit";
import { Value } from "@radix-ui/react-select";
import { Dialog } from "@radix-ui/react-dialog";

const requestItemSchema = z.object({
  material_id: z.string().min(1, "Material is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unit_price: z.coerce.number().min(0, "Price must be positive"),
});

export const formSchema = z.object({
  items: z.array(requestItemSchema).min(1, "At least one item is required"),
});

export type FormValues = z.infer<typeof formSchema>;

interface RequestFormProps {
  materials: Material[];
  onSubmit: (values: FormValues) => Promise<void>;
  isLoading?: boolean;
  branchId: string;
}

export const MaterialRequestDialog = ({ materials, onSubmit, isLoading, branchId }: RequestFormProps) => {
  const [items, setItems] = useState([{ material_id: "", quantity: 1, unit_price: 0 }]);
  const [selectedMaterials, setSelectedMaterials] = useState<Material | null>(null);

  const naira = (Value: number) => currency(Value, { symbol: "₦", precision: 2, separator: "," }).format();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      items,
    },
  });

  const addItem = () => {
    setItems([...items, { material_id: "", quantity: 1, unit_price: 0 }]);
    form.setValue("items", [...items, { material_id: "", quantity: 1, unit_price: 0 }]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    form.setValue("items", newItems);
  };

  const handleMaterialChange = (index: number, materialId: string) => {
    const material = materials.find((p) => p.id === materialId);
    if (material) {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        material_id: materialId,
        unit_price: material.unit_price,
      };
      setItems(newItems);
      form.setValue("items", newItems);
      setSelectedMaterials(material);
    }
  };

  return (
   <div id="form" style={{ 
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    background: "rgb(0,0,0,0.5)",
    display:"flex",
    justifyContent:"center",
    alignItems:"center",
    zIndex: 100,
   }}>
    <div style={{
      width: "400px",
      background: "white",
      padding: "20px",
      borderRadius: "10px",
      boxShadow: "0 0 10px rgba(0,0,0,0.1)",

    }}>
    <Form {...form} ><strong>Material Request Form</strong>
    <Button style={{
      position: "relative",
      top: "-10px",
      right: "-160px",
      width: "20px",
      height: "20px",

    }}  type="button" variant="secondary" size="sm" onClick={() => {}}> X </Button>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        <div className="space-y-4">
          
          {items.map((_, index) => (
            <div key={index} className="flex gap-4 items-start">
              <FormField
                control={form.control}
                name={`items.${index}.material_id`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <Select
                      onValueChange={(value) => handleMaterialChange(index, value)}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Material" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent style={{zIndex: 100}}>
                        {materials.map((material) => (
                          <SelectItem  key={material.id} value={material.id}>
                            {material.name} - <Unit unit={material.unit} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`items.${index}.quantity`}
                render={({ field }) => (
                  <FormItem className="w-24">
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          const newItems = [...items];
                          newItems[index] = {
                            ...newItems[index],
                            quantity: parseInt(e.target.value) || 0,
                          };
                          setItems(newItems);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="button"
                variant="destructive"
                size="sm"

                onClick={() => removeItem(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Sending Request..." : "Send Request"}
        </Button>

      </form>
    </Form>
    </div>
    </div>
  );
};














































// import { useState } from "react";
// import { useQueryClient } from "@tanstack/react-query";
// import { supabase } from "@/integrations/supabase/client";
// import { useForm, useFieldArray } from "react-hook-form";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { useToast } from "@/hooks/use-toast";
// import type { Material } from "@/types/inventory";
// import { Plus, Trash2 } from "lucide-react";
// import {
//   Select,
//   SelectTrigger,
//   SelectValue,
//   SelectContent,
//   SelectItem,
// } from "@radix-ui/react-select";
// import {
//   Form,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormControl,
//   FormMessage,
// } from "@/components/ui/form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { z } from "zod";
// import currency from "currency.js";
// import { Unit } from "@/components/ui/unit";

// const materialItemSchema = z.object({
//   material_id: z.string().min(1, "Material is required"),
//   quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
//   unit_price: z.coerce.number().min(0, "Price must be positive"),
// });

// const materialRequestFormSchema = z.object({
//   items: z.array(materialItemSchema).min(1, "At least one item is required"),
// });

// export type FormValues = z.infer<typeof materialRequestFormSchema>;

// interface MaterialRequestDialogProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   onSuccess: () => void;
//   materials: Material[];
//   branchId: string;
// }

// export const MaterialRequestDialog = ({
//   open,
//   onOpenChange,
//   materials,
//   branchId,
//   onSuccess,
// }: MaterialRequestDialogProps) => {
//   const [quantity, setQuantity] = useState("");
//   const [notes, setNotes] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const queryClient = useQueryClient();
//   const { toast } = useToast();

//   const form = useForm<FormValues>({
//     resolver: zodResolver(materialRequestFormSchema),
//     defaultValues: {
//       items: [{ material_id: "", quantity: 1, unit_price: 0 }],
//     },
//   });

//   const naira = (value: number) =>
//     currency(value, { symbol: "₦", precision: 2, separator: "," }).format();

//   const {
//     fields: items,
//     append,
//     remove,
//   } = useFieldArray<FormValues>({
//     control: form.control,
//     name: "items",
//   });

//   const addItem = () => {
//     const newItem = { material_id: "", quantity: 1, unit_price: 0 };
//     append(newItem);
//     form.setValue("items", [...items, newItem]);
//   };

//   const removeItem = (index: number) => {
//     remove(index);
//   };

//   const handleMaterialChange = (index: number, materialId: string) => {
//     const material = materials.find((p) => p.id === materialId);
//     if (material) {
//       const newItems = [...items];
//       newItems[index] = {
//         ...newItems[index],
//         material_id: materialId,
//         unit_price: material.unit_price,
//       };
//       form.setValue("items", newItems);
//     }
//   };

//   const handleSubmit = async (data: FormValues) => {
//     if (!data.items.length) return;

//     setIsLoading(true);
//     try {
//       const { error } = await supabase.from("material_requests").insert([
//         {
//           material_id: data.items[0].material_id,
//           branch_id: branchId,
//           quantity: data.items[0].quantity,
//           notes,
//           status: "pending",
//         },
//       ]);

//       if (error) throw error;

//       toast({
//         title: "Request submitted",
//         description: "Your material request has been submitted successfully.",
//       });

//       queryClient.invalidateQueries({ queryKey: ["material-requests"] });
//       onOpenChange(false);
//       // onSuccess();
//     } catch (error: any) {
//       toast({
//         title: "Error",
//         description: error.message,
//         variant: "destructive",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent>
//         <DialogHeader>
//           <DialogTitle>Request Material</DialogTitle>
//           <DialogDescription>
//             Please provide required details for your material requests.
//           </DialogDescription>
//         </DialogHeader>

//         <Form {...form}>
//           <form
//             onSubmit={form.handleSubmit(handleSubmit)}
//             className="space-y-6"
//           >
//             <div className="space-y-4">
//               {items.map((item, index) => (
//                 <div key={index} className="flex gap-4 items-start">
//                   <FormField
//                     control={form.control}
//                     name={`items.${index}.material_id`}
//                     render={({ field }) => (
//                       <FormItem className="flex-1">
//                         <Select
//                           value={field.value || ""}
//                           onValueChange={(value) => {
//                             field.onChange(value);
//                             handleMaterialChange(index, value);
//                           }}
//                           required
//                         >
//                           <FormControl>
//                             <SelectTrigger>
//                               <SelectValue placeholder="Select material" />
//                             </SelectTrigger>
//                           </FormControl>
//                           <SelectContent>
//                             {materials.map((material) => (
//                               <SelectItem key={material.id} value={material.id}>
//                                 {material.name} <Unit unit={material.unit} />
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <FormField
//                     control={form.control}
//                     name={`items.${index}.quantity`}
//                     render={({ field }) => (
//                       <FormItem className="w-24">
//                         <FormControl>
//                           <Input
//                             type="number"
//                             min="1"
//                             placeholder="Qty"
//                             {...field}
//                             onChange={(e) => {
//                               field.onChange(e.target.value);
//                               // const newItems = [...items];
//                               // newItems[index] = {
//                               //   ...newItems[index],
//                               //   quantity: parseInt(e.target.value) || 0,
//                               // };
//                               // form.setValue("items", newItems);
//                             }}
//                           />
//                         </FormControl>
//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   <Button
//                     type="button"
//                     variant="destructive"
//                     size="sm"
//                     onClick={() => removeItem(index)}
//                   >
//                     <Trash2 className="h-4 w-4" />
//                   </Button>
//                 </div>
//               ))}
//             </div>

//             <Button type="button" variant="outline" size="sm" onClick={addItem}>
//               <Plus className="h-4 w-4 mr-2" />
//               Add Item
//             </Button>

//             <Button type="submit" className="w-full" disabled={isLoading}>
//               {isLoading ? "Sending Request..." : "Send request"}
//             </Button>
//           </form>
//         </Form>
//       </DialogContent>
//     </Dialog>
//   );
// };
