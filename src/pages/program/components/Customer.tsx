import { SortableRow } from "@/components/sortable-row";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSearchCustomer } from "@/react-query/queries/program/program";
import type { TProgramCustomer } from "@/react-query/services/program/program.service";

import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Clock, Trash2 } from "lucide-react";
import { useState } from "react";
import CustomerLuckyModal from "./CustomerLuckyModal";
type TCustomerSection = {
  code: string;
};
const CustomerSection = ({ code }: TCustomerSection) => {
  const [selectedCustomer, setSelectedCustomer] =
    useState<TProgramCustomer | null>(null);
  const { data: customers } = useSearchCustomer({
    campaignCode: code,
  });

  return (
    <div className="space-y-6 px-4">
      <div className="flex items-center justify-between">
        <div className="font-medium">Khách hàng</div>
        <div className="text-xs text-muted-foreground">
          Thông tin khách hàng tham gia chương trình
        </div>
      </div>

      {/* DANH SÁCH KHÁCH HÀNG + DRAG & DROP + LỊCH SỬ */}
      <Card className="border-muted/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Danh sách khách hàng</CardTitle>
          <CardDescription>Kéo-thả để sắp xếp ưu tiên</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Thêm nhanh */}
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
              <Input
                className="sm:col-span-3"
                placeholder="Tên KH"
                //   value={newName}
                //   onChange={(e) => setNewName(e.target.value)}
              />
              <Input
                className="sm:col-span-3"
                placeholder="Số điện thoại"
                //   value={newPhone}
                //   onChange={(e) => setNewPhone(e.target.value)}
              />
              <Input className="sm:col-span-3" placeholder="Mã khách hàng" />
              <Input
                className="sm:col-span-2"
                placeholder="Số lượt quay"
                type="number"
                inputMode="numeric"
                //   value={newAttempts}
                //   onChange={(e) => setNewAttempts(e.target.value)}
              />
              <Button
                className="sm:col-span-1"
                //   onClick={addOneCustomer}
                //   disabled={!canAdd}
              >
                Thêm
              </Button>
            </div>
            {/* {!canAdd && newPhone.length > 0 && (
                <div className="mt-1 text-xs text-destructive">
                  Số điện thoại không hợp lệ
                </div>
              )} */}
          </div>

          {/* Import / Export */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              //   onClick={() => fileRef.current?.click()}
            >
              Tải CSV
            </Button>
            <Input
              //   ref={fileRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              //   onChange={(e) => handleCsvFiles(e.target.files)}
            />
            <Button
              variant="outline"
              size="sm"

              // onClick={exportJson}
            >
              Xuất JSON
            </Button>
            <div className="ml-auto text-xs text-muted-foreground">
              Kéo icon để sắp xếp. Nhấn đồng hồ để xem lịch sử.
            </div>
          </div>

          {/* Bảng với drag handle + history dialog */}

          <ScrollArea className="h-[360px] rounded-md border overflow-y-auto">
            <Table className="text-sm">
              <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <TableRow className="[&>th]:h-10 [&>th]:px-3">
                  <TableHead className="w-10 text-center">#</TableHead>
                  <TableHead className="min-w-[180px]">
                    Tên khách hàng
                  </TableHead>
                  <TableHead className="min-w-[160px]">Số điện thoại</TableHead>
                  <TableHead className="min-w-[140px]">Mã KH</TableHead>
                  <TableHead className="w-[120px] text-right">
                    Số lượt quay
                  </TableHead>
                  <TableHead className="w-[130px] text-right">
                    Hành động
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="[&>tr:nth-child(even)]:bg-muted/30">
                {customers?.map((c, i) => (
                  <SortableRow key={c.id} id={String(c.id)}>
                    <TableCell className="text-center px-3 py-2">
                      {i + 1}
                    </TableCell>

                    <TableCell className="px-3 py-2">
                      <Input value={c.consumer_name ?? ""} />
                    </TableCell>

                    <TableCell className="px-3 py-2">
                      <Input value={c.consumer_phone} />
                    </TableCell>

                    <TableCell className="px-3 py-2">
                      <Input value={c.consumer_code} />
                    </TableCell>

                    <TableCell className="px-3 py-2 text-right">
                      <Input
                        className="text-right"
                        type="number"
                        value={c.number_get}
                        onChange={() => {}}
                      />
                    </TableCell>

                    <TableCell className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedCustomer(c);
                          }}
                          aria-label="Xem lịch sử"
                        >
                          <Clock className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {}}
                          aria-label="Xoá"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </SortableRow>
                ))}

                {customers?.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-[72px] text-center text-sm text-muted-foreground"
                    >
                      Chưa có dữ liệu
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <ScrollBar orientation="vertical" />
          </ScrollArea>
        </CardContent>
      </Card>

      <CustomerLuckyModal
        code={code}
        customer={selectedCustomer}
        onClose={setSelectedCustomer}
      />
    </div>
  );
};

export default CustomerSection;
