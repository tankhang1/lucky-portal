import { useSortable } from "@dnd-kit/sortable";
import { TableRow } from "./ui/table";
import { CSS } from "@dnd-kit/utilities";

// Sortable row wrapper cho <TableRow>
export function SortableRow({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as React.CSSProperties;

  // Lưu handle riêng (để chỉ drag khi click vào icon)
  useSortableHandles[id] = { attributes, listeners };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className="hover:bg-muted/50 transition-colors"
    >
      {children}
    </TableRow>
  );
}

// Kho handle cho từng row id (để spread vào nút Grip)
const useSortableHandles: Record<
  string,
  { attributes: React.HTMLAttributes<any>; listeners: any }
> = {};

export function useSortableHandle(id: string) {
  return useSortableHandles[id] ?? {};
}
