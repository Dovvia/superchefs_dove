export interface MiniRequestItem {
  id: string;
  quantity: string;
  name: string;
  unit: string;
}
export interface EditRequestFormValues {
  items: MiniRequestItem[];
}
