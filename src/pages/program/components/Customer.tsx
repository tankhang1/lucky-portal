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
import {
  useAddProgramCustomer,
  useDeleteProgramCustomer,
  useSearchCustomer,
} from "@/react-query/queries/program/program";
import type {
  TCustomerForm,
  TProgramCustomer,
} from "@/react-query/services/program/program.service";

import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Clock, Trash2 } from "lucide-react";
import { useState } from "react";
import CustomerLuckyModal from "./CustomerLuckyModal";
import { toast } from "react-toastify";
import { queryClient } from "@/main";
import QUERY_KEY from "@/constants/key";
type TCustomerSection = {
  code: string;
};
const CustomerSection = ({ code }: TCustomerSection) => {
  const [form, setForm] = useState<TCustomerForm>({
    campaign_code: code,
    consumer_code: "",
    consumer_name: "",
    consumer_phone: "",
  });
  const [selectedCustomer, setSelectedCustomer] =
    useState<TProgramCustomer | null>(null);
  const { data: customers } = useSearchCustomer({
    campaignCode: code,
  });
  const { mutate: addCustomer, isPending: isAddingCustomer } =
    useAddProgramCustomer();
  const { mutate: deleteCustomer, isPending: isDeletingCustomer } =
    useDeleteProgramCustomer();

  const onAddCustomer = () => {
    if (!form.consumer_code || !form.consumer_name || !form.consumer_phone) {
      toast.error("Vui lòng nhập đầy đủ thông tin!");
    } else {
      addCustomer(
        {
          ...form,
          campaign_code: code,
        },
        {
          onSuccess: (data) => {
            toast.success(data.message);
            setForm({
              campaign_code: code,
              consumer_code: "",
              consumer_name: "",
              consumer_phone: "",
            });
          },
          onError: (error) => {
            //@ts-expect-error no check
            toast.error(error.response?.data?.message || "Đã có lỗi xảy ra!");
          },
          onSettled: () => {
            queryClient.invalidateQueries({
              queryKey: [QUERY_KEY.PROGRAM.CUSTOMER_LIST],
            });
          },
        }
      );
    }
  };
  const onDeleteCustomer = (phone: string) => {
    deleteCustomer(
      {
        campaign_code: code,
        consumer_phone: phone,
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
            queryKey: [QUERY_KEY.PROGRAM.CUSTOMER_LIST],
          });
        },
      }
    );
  };
  return (
    <div className="space-y-6 px-4">
      <div className="flex items-center justify-between">
        <div className="font-medium">Khách hàng</div>
        <div className="text-xs text-muted-foreground">
          Thông tin khách hàng tham gia chương trình
        </div>
      </div>

      <div className="space-y-4">
        {/* Thêm nhanh */}
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
            <Input
              className="sm:col-span-3"
              placeholder="Tên KH"
              value={form.consumer_name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, consumer_name: e.target.value }))
              }
            />
            <Input
              className="sm:col-span-3"
              placeholder="Số điện thoại"
              value={form.consumer_phone}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, consumer_phone: e.target.value }))
              }
            />
            <Input
              className="sm:col-span-3"
              placeholder="Mã khách hàng"
              value={form.consumer_code}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, consumer_code: e.target.value }))
              }
            />

            <Button
              className="sm:col-span-1"
              onClick={onAddCustomer}
              disabled={isAddingCustomer}
            >
              {isAddingCustomer ? "Đang xử lí" : "Thêm"}
            </Button>
          </div>
        </div>

        {/* Bảng với drag handle + history dialog */}

        <ScrollArea className="h-[360px] rounded-md border overflow-y-auto">
          <Table className="text-sm">
            <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <TableRow className="[&>th]:h-10 [&>th]:px-3">
                <TableHead className="w-10 text-center">#</TableHead>
                <TableHead className="min-w-[180px]">Tên khách hàng</TableHead>
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
                  {/* Index */}
                  <TableCell className="text-center px-3 py-2">
                    {i + 1}
                  </TableCell>

                  {/* Name: Changed to text */}
                  <TableCell className="px-3 py-2 font-medium">
                    {c.consumer_name || "—"}
                  </TableCell>

                  {/* Phone: Changed from Input to text */}
                  <TableCell className="px-3 py-2">
                    {c.consumer_phone}
                  </TableCell>

                  {/* Code: Changed from Input to text */}
                  <TableCell className="px-3 py-2">{c.consumer_code}</TableCell>

                  {/* Number Get: Changed from Input to text */}
                  <TableCell className="px-3 py-2 text-right">
                    {c.number_get}
                  </TableCell>

                  {/* Actions */}
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
                        onClick={() => {
                          onDeleteCustomer(c.consumer_phone);
                        }}
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
      </div>

      <CustomerLuckyModal
        code={code}
        customer={selectedCustomer}
        onClose={setSelectedCustomer}
      />
    </div>
  );
};

export default CustomerSection;
