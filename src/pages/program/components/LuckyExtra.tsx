import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useRemoveNumberExtra,
  useSearchGift,
  useUpdateNumberExtra,
} from "@/react-query/queries/program/program";
import type { TProgram } from "@/react-query/services/program/program.service";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { queryClient } from "@/main";
import QUERY_KEY from "@/constants/key";

type TLuckyExtra = {
  activeProgram: TProgram;
};

// Define the shape of a single row
type TExtraItem = {
  number: string | number;
  repeat: string | number;
  giftCode: string;
};

const LuckyExtra = ({ activeProgram }: TLuckyExtra) => {
  const { data: gifts } = useSearchGift({
    campaignCode: activeProgram?.code,
    type: "1",
  });

  const { mutate: updateNumberExtra, isPending: isUpdateNumberExtra } =
    useUpdateNumberExtra();
  const { mutate: removeNumberExtra } = useRemoveNumberExtra();
  // Local state to manage the list while editing
  const [extraList, setExtraList] = useState<TExtraItem[]>([]);

  // 1. Parse the string from activeProgram into local state on load
  useEffect(() => {
    if (!activeProgram?.number_extra) {
      setExtraList([]);
      return;
    }

    try {
      const list = activeProgram.number_extra.split(",");
      const parsedList = list
        .map((item) => {
          // Format: number@@repeat@@giftId
          const parts = item.split("@@");
          if (parts.length < 3) return null;
          return {
            number: parts[0],
            repeat: parts[1],
            giftCode: parts[2],
          };
        })
        .filter((item) => item !== null); // Remove invalid rows

      setExtraList(parsedList);
    } catch (error) {
      console.error("Error parsing number_extra:", error);
      setExtraList([]);
    }
  }, [activeProgram]);

  // 2. Handle adding a new empty row
  const handleAdd = () => {
    setExtraList((prev) => [
      ...prev,
      { number: "", repeat: 1, giftCode: "" }, // Default values
    ]);
  };

  // 3. Handle removing a row
  const handleRemove = (index: number) => {
    if (!extraList?.[index]) {
      return;
    }
    const extra = extraList[index];
    const item = `${extra.number}@@${extra.repeat}@@${extra.giftCode}`;
    if (activeProgram?.number_extra?.includes(item)) {
      if (confirm(`Bạn có chắc chắn muốn xoá số ${extra.number}`)) {
        removeNumberExtra(
          {
            campaign_code: activeProgram?.code,
            number_extra: +extraList?.[index]?.number,
          },
          {
            onSuccess: (data) => {
              toast.success(data.message);
            },
            onError: (error) => {
              //@ts-expect-error no check
              toast.error(error.response?.data?.message || "Đã có lỗi xảy ra!");
            },
            onSettled: () => {
              queryClient.invalidateQueries({
                queryKey: [QUERY_KEY.PROGRAM.LIST],
              });
            },
          }
        );
      }
    } else {
      setExtraList((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // 4. Handle changing values in a row
  const handleChange = (
    index: number,
    field: keyof TExtraItem,
    value: string | number
  ) => {
    setExtraList((prev) => {
      const newList = [...prev];
      newList[index] = { ...newList[index], [field]: value };
      return newList;
    });
  };

  // 5. Serialize data and call API
  const handleSave = () => {
    // Validate: Filter out rows with empty numbers or giftIds
    const validList = extraList.filter((item) => item.number && item.giftCode);

    const number_extra = validList
      .map((item) => `${item.number}@@${item.repeat}@@${item.giftCode}`)
      .join(",");

    const payload = {
      code: activeProgram.code || "",
      number_extra: number_extra,
    };

    updateNumberExtra(payload, {
      onSuccess: (data) => {
        toast.success(data.message);
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEY.PROGRAM.LIST], // Ensure you import your query keys
        });
      },
      onError: () => {
        toast.error("Có lỗi xảy ra khi cập nhật!");
      },
    });
  };

  return (
    <div className="space-y-6 px-4">
      <div className="flex items-center justify-between">
        <div className="font-medium">Thiết lập giải extra</div>
        <Button
          onClick={handleSave}
          disabled={isUpdateNumberExtra}
          className="gap-2"
        >
          {isUpdateNumberExtra ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Lưu thay đổi
        </Button>
      </div>

      <Card className="border-muted/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Số lẻ may mắn</CardTitle>
          <CardDescription>
            Thêm số ngoài dãy A→B, thiết lập lặp & giải thưởng
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Danh sách số lẻ</div>
            <Button
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={handleAdd}
            >
              <Plus className="h-4 w-4" />
              Thêm số
            </Button>
          </div>

          <ScrollArea className="h-[300px] rounded-lg border">
            <Table className="text-sm">
              <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <TableRow className="[&>th]:h-9 [&>th]:px-3">
                  <TableHead className="w-[150px] text-left">
                    Số may mắn
                  </TableHead>
                  <TableHead className="w-[100px] text-left">
                    Số lần lặp
                  </TableHead>
                  <TableHead>Giải thưởng</TableHead>
                  <TableHead className="w-[70px] text-center">Xoá</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="[&>tr:nth-child(even)]:bg-muted/30">
                {extraList.map((row, idx) => {
                  return (
                    <TableRow key={idx} className="[&>td]:px-3 [&>td]:py-2">
                      <TableCell>
                        <Input
                          type="number"
                          placeholder="VD: 208"
                          value={row.number}
                          onChange={(e) =>
                            handleChange(idx, "number", e.target.value)
                          }
                        />
                      </TableCell>

                      <TableCell>
                        <Input
                          type="number"
                          min={1}
                          value={row.repeat}
                          onChange={(e) =>
                            handleChange(idx, "repeat", e.target.value)
                          }
                        />
                      </TableCell>

                      <TableCell>
                        <Select
                          value={row.giftCode}
                          onValueChange={(val) =>
                            handleChange(idx, "giftCode", val)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Chọn giải thưởng" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {gifts?.map((p) => (
                                <SelectItem
                                  key={p.gift_code}
                                  value={p.gift_code.toString()}
                                >
                                  {p.gift_name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemove(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {extraList.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-[72px] text-center text-sm text-muted-foreground"
                    >
                      Chưa có số lẻ may mắn
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default LuckyExtra;
