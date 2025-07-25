import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & {
    withAsterisk?: boolean;
  } & VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <>
    <LabelPrimitive.Root
      ref={ref}
      className={cn(labelVariants(), className)}
      {...props}
    />
    {props.withAsterisk && <span className="text-red-600">*</span>}
  </>
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
