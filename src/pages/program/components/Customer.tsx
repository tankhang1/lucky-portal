import { SortableRow } from "@/components/sortable-row";
import { Button } from "@/components/ui/button";
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
  useGetConsumerJoinCampaign,
  useSearchCustomer,
} from "@/react-query/queries/program/program";
import type {
  TCustomerForm,
  TProgramCustomer,
} from "@/react-query/services/program/program.service";

import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Clock, Download, Loader2, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import CustomerLuckyModal from "./CustomerLuckyModal";
import { toast } from "react-toastify";
import { queryClient } from "@/main";
import QUERY_KEY from "@/constants/key";
import ImportCustomerModal from "./ImportCustomerModal";
import * as XLSX from "xlsx";
type TCustomerSection = {
  code: string;
};
const CustomerSection = ({ code }: TCustomerSection) => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [form, setForm] = useState<TCustomerForm>({
    campaign_code: code,
    consumer_code: "",
    consumer_name: "",
    consumer_phone: "",
    number_get: "",
  });
  const [selectedCustomer, setSelectedCustomer] =
    useState<TProgramCustomer | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const { data: customers, isLoading: isLoadingCustomers } = useSearchCustomer({
    campaignCode: code,
  });
  const { mutate: addCustomer, isPending: isAddingCustomer } =
    useAddProgramCustomer();
  const { mutate: deleteCustomer } = useDeleteProgramCustomer();
  const {
    mutate: getConsumerJoinCampaign,
    isPending: isPendingComsumerCampaign,
  } = useGetConsumerJoinCampaign();
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
              number_get: "",
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
    const isConfirmed = window.confirm(
      `Bạn có chắc chắn muốn xoá khách hàng ${phone}`
    );
    if (isConfirmed)
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
  const onExportExcel = async () => {
    getConsumerJoinCampaign(
      {
        c: code,
      },
      {
        onSuccess: (data) => {
          const excelData = data.map((item) => ({
            "Tên chương trình": item.campaign_name,
            "Mã KH": item.consumer_code,
            "Tên KH": item.consumer_name,
            "DT KH": item.consumer_phone,
            "Tổng lượt lấy": item.counter_get,
            "Tổng lượt trúng thưởng": item.counter_award,
          }));

          const worksheet = XLSX.utils.json_to_sheet(excelData);

          const columnWidths = [
            { wch: 40 },
            { wch: 15 },
            { wch: 25 },
            { wch: 15 },
            { wch: 15 },
            { wch: 20 },
          ];
          worksheet["!cols"] = columnWidths;

          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Danh sách tham gia"
          );

          XLSX.writeFile(workbook, "Danh_sach_khach_hang.xlsx");
        },
        onError: (error) => {
          console.error("Failed to fetch data for export", error);
        },
      }
    );
  };
  const onSelectAll = (checked: boolean) => {
    if (checked && customers) {
      setSelectedIds(customers.map((c) => c.id));
    } else {
      setSelectedIds([]);
    }
  };
  const onSelectOne = (checked: boolean, id: number) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };
  const onDeleteMultiple = () => {
    if (selectedIds.length === 0) return;

    const isConfirmed = window.confirm(
      `Bạn có chắc chắn muốn xoá ${selectedIds.length} khách hàng đã chọn? Hành động này không thể hoàn tác.`
    );

    if (isConfirmed && customers) {
      const phonesToDelete = customers
        .filter((c) => selectedIds.includes(c.id))
        .map((c) => c.consumer_phone);

      let successCount = 0;
      phonesToDelete.forEach((phone) => {
        deleteCustomer(
          {
            campaign_code: code,
            consumer_phone: phone,
          },
          {
            onSuccess: () => {
              successCount++;
            },
            onError: (error) => {
              console.error(`Lỗi khi xoá ${phone}`, error);
            },
          }
        );
      });

      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEY.PROGRAM.CUSTOMER_LIST],
        });
        toast.success(`Đã gửi yêu cầu xoá ${selectedIds.length} khách hàng.`);
        setSelectedIds([]);
      }, 500);
    }
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
          <div className="flex items-center gap-3">
            <Input
              placeholder="Tên KH"
              value={form.consumer_name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, consumer_name: e.target.value }))
              }
            />
            <Input
              placeholder="Số điện thoại"
              value={form.consumer_phone}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, consumer_phone: e.target.value }))
              }
            />
            <Input
              placeholder="Mã khách hàng"
              value={form.consumer_code}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, consumer_code: e.target.value }))
              }
            />
            <Input
              placeholder="Số lượt quay"
              value={form.number_get}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, number_get: e.target.value }))
              }
            />

            <Button
              className=" gap-2"
              onClick={onAddCustomer}
              disabled={isAddingCustomer}
            >
              {isAddingCustomer && <Loader2 className="h-4 w-4 animate-spin" />}
              {isAddingCustomer ? "Đang xử lí" : "Thêm"}
            </Button>
          </div>
        </div>
        <div className="flex justify-end items-center gap-2">
          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              className="gap-2"
              onClick={onDeleteMultiple}
            >
              <Trash2 className="h-4 w-4" />
              Xoá ({selectedIds.length})
            </Button>
          )}
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowImportModal(true)}
          >
            <Upload className="h-4 w-4" />
            Nhập Excel
          </Button>
          <Button variant="outline" className="gap-2" onClick={onExportExcel}>
            {isPendingComsumerCampaign ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Xuất Excel
          </Button>
        </div>
        {/* Bảng với drag handle + history dialog */}

        <ScrollArea className="h-[360px] rounded-md border overflow-y-auto">
          <Table className="text-sm">
            <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <TableRow className="[&>th]:h-10 [&>th]:px-3">
                <TableHead className="w-10 text-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    checked={
                      customers?.length
                        ? selectedIds.length === customers.length &&
                          customers.length > 0
                        : false
                    }
                    onChange={(e) => onSelectAll(e.target.checked)}
                  />
                </TableHead>
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
                  <TableCell className="text-center px-3 py-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={selectedIds.includes(c.id)}
                      onChange={(e) => onSelectOne(e.target.checked, c.id)}
                      // Ngăn chặn sự kiện click lan ra row (nếu có drag/drop)
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
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
              {isLoadingCustomers && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    <div className="flex items-center gap-2 justify-center">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Đang xử lí...
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!isLoadingCustomers && customers?.length === 0 && (
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
      <ImportCustomerModal
        isOpen={showImportModal}
        onClose={setShowImportModal}
        campaignCode={code}
      />
    </div>
  );
};

export default CustomerSection;
