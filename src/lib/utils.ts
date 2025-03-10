import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import currency from "currency.js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const naira = (Value: number | string) =>
  currency(Value, { symbol: "₦", precision: 2, separator: "," }).format();
