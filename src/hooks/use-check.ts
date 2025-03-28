import { useState } from "react";

export const useCheck = () => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const toggleCheck = (id: string) =>
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );

  const handleSelectAll = <T extends { id: string }>(
    items: T[],
    isSelectable: (item: T) => boolean
  ) => {
    const selectableItems = items.filter(isSelectable);
    const allSelected = selectableItems.every((item) =>
      selectedItems.includes(item.id)
    );

    setSelectedItems(allSelected ? [] : selectableItems.map((item) => item.id));
  };

  const resetCheck = () => setSelectedItems([]);

  return {
    selectedItems,
    setSelectedItems,
    toggleCheck,
    handleSelectAll,
    resetCheck,
  };
};
