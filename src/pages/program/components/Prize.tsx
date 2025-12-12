import ActionIcon from "@/components/action-icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSearchGift } from "@/react-query/queries/program/program";
import {
  Eye,
  ImageIcon,
  MoreHorizontal,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
function TableEmpty({
  colSpan,
  children,
}: {
  colSpan: number;
  children: React.ReactNode;
}) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-[88px] text-center">
        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <div className="text-sm">{children}</div>
        </div>
      </TableCell>
    </TableRow>
  );
}
type TPrizeSection = {
  code: string;
};
const PrizeSection = ({ code }: TPrizeSection) => {
  const { data: gifts } = useSearchGift({
    campaignCode: code,
  });
  return (
    <div className="space-y-4 px-4">
      <div className="flex items-center justify-between">
        <div className="font-medium">Danh mục giải</div>
        <Button size="sm" onClick={() => {}} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm giải
        </Button>
      </div>
      <ScrollArea className="h-[360px] rounded-md border">
        <Table className="text-sm">
          <TableHeader className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <TableRow className="[&>th]:h-10 [&>th]:px-3">
              <TableHead className="w-10 text-center">#</TableHead>
              <TableHead className="min-w-[220px]">Tên giải</TableHead>
              <TableHead className="min-w-[220px]">Giải thưởng</TableHead>
              <TableHead className="min-w-[100px]">Hình ảnh</TableHead>
              <TableHead className="w-[120px] text-right">
                Số lượng giải
              </TableHead>
              <TableHead className="w-[90px] text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="[&>tr:nth-child(even)]:bg-muted/30">
            {gifts?.map((pr, i) => (
              <TableRow
                key={pr.id}
                className="hover:bg-muted/50 transition-colors [&>td]:px-3 [&>td]:py-2"
              >
                <TableCell className="text-center">{i + 1}</TableCell>
                <TableCell>
                  <Input value={pr.gift_name} />
                </TableCell>
                <TableCell>
                  <Input value={pr.award_name} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative group">
                      {pr.gift_image ? (
                        <img
                          src={pr.gift_image}
                          alt=""
                          className="h-16 w-16 rounded-xl object-cover ring-1 ring-border transition group-hover:brightness-90"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-xl ring-1 ring-border flex items-center justify-center text-[10px] text-muted-foreground bg-muted/30">
                          <ImageIcon className="h-3 w-3 mr-1" />
                          Trống
                        </div>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="absolute right-1 top-1 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={6}>
                          <DropdownMenuItem
                            className="flex items-center gap-2"
                            onClick={() =>
                              document.getElementById(`pr-image-${i}`)?.click()
                            }
                          >
                            <Upload className="h-4 w-4" />
                            Đổi ảnh
                          </DropdownMenuItem>
                          {pr.gift_image && (
                            <DropdownMenuItem>
                              <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Xem ảnh
                              </div>
                            </DropdownMenuItem>
                          )}
                          {pr.gift_image && (
                            <DropdownMenuItem className="flex items-center gap-2 text-red-600">
                              <Trash2
                                className="h-4 w-4"
                                color="oklch(57.7% 0.245 27.325)"
                              />
                              Xoá ảnh
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <input
                      id={`pr-image-${i}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={() => {}}
                    />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Input inputMode="numeric" type="number" value={pr.counter} />
                </TableCell>

                <TableCell className="text-right">
                  <ActionIcon label="Xoá" onClick={() => {}}>
                    <Trash2 className="h-4 w-4" />
                  </ActionIcon>
                </TableCell>
              </TableRow>
            ))}
            {gifts?.length === 0 && (
              <TableEmpty colSpan={6}>No prizes</TableEmpty>
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
export default PrizeSection;
