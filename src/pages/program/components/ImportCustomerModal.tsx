import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAddProgramCustomer } from "@/react-query/queries/program/program";
import { queryClient } from "@/main";
import QUERY_KEY from "@/constants/key";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";

type ImportCustomerModalProps = {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  campaignCode: string;
};

type ExcelRow = {
  consumer_name: string;
  consumer_phone: string;
  consumer_code: string;
  number_get: string | number;
};

type ImportError = {
  row: number;
  phone: string;
  message: string;
};

export default function ImportCustomerModal({
  isOpen,
  onClose,
  campaignCode,
}: ImportCustomerModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<ImportError[]>([]);
  const [stats, setStats] = useState({ total: 0, success: 0, fail: 0 });

  // Use mutateAsync to await the result in our loop
  const { mutateAsync: addCustomer } = useAddProgramCustomer();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      // Reset states when new file is chosen
      setLogs([]);
      setProgress(0);
      setStats({ total: 0, success: 0, fail: 0 });
    }
  };

  const processFile = async () => {
    if (!file) return;

    setIsProcessing(true);
    setLogs([]);
    setProgress(0);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(sheet);

        if (jsonData.length === 0) {
          toast.error("File Excel trống hoặc không đúng định dạng!");
          setIsProcessing(false);
          return;
        }

        setStats({ total: jsonData.length, success: 0, fail: 0 });

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          const rowNumber = i + 2; // +1 for index, +1 for header

          try {
            // Basic validation
            if (
              !row.consumer_phone ||
              !row.consumer_name ||
              !row.consumer_code ||
              !row.number_get
            ) {
              throw new Error(
                "Thiếu Tên, SĐT, Mã khách hàng hoặc Số lượt quay"
              );
            }

            // // Call API
            await addCustomer({
              campaign_code: campaignCode,
              consumer_name: row.consumer_name,
              consumer_phone: String(row.consumer_phone),
              consumer_code: row.consumer_code ? String(row.consumer_code) : "",
              number_get: row.number_get ? String(row.number_get) : "0",
            });

            successCount++;
          } catch (error: any) {
            failCount++;
            const errorMessage =
              error.response?.data?.message ||
              error.message ||
              "Lỗi không xác định";

            setLogs((prev) => [
              ...prev,
              {
                row: rowNumber,
                phone: row.consumer_phone || "N/A",
                message: errorMessage,
              },
            ]);
          }

          // Update stats and progress
          setStats((prev) => ({
            ...prev,
            success: successCount,
            fail: failCount,
          }));
          setProgress(Math.round(((i + 1) / jsonData.length) * 100));
        }

        // Finalize
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEY.PROGRAM.CUSTOMER_LIST],
        });
        toast.success(
          `Hoàn tất! Thành công: ${successCount}, Lỗi: ${failCount}`
        );
      } catch (err) {
        console.error(err);
        toast.error("Lỗi khi đọc file Excel");
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  const resetModal = () => {
    setFile(null);
    setLogs([]);
    setProgress(0);
    setStats({ total: 0, success: 0, fail: 0 });
    onClose(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={isProcessing ? undefined : resetModal}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nhập Khách hàng từ Excel</DialogTitle>
          <DialogDescription>
            Chọn file .xlsx hoặc .xls. Cột bắt buộc: <b>consumer_name</b>,{" "}
            <b>consumer_phone</b>, <b>consumer_code</b>, <b>number_get</b>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Input */}
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="excel-upload">File Excel</Label>
            <Input
              id="excel-upload"
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              disabled={isProcessing}
            />
          </div>

          {/* Progress Section */}
          {(isProcessing || stats.total > 0) && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tiến độ: {progress}%</span>
                <span className="text-muted-foreground">
                  {stats.success + stats.fail} / {stats.total}
                </span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex gap-4 text-sm mt-2">
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> {stats.success} Thành công
                </span>
                <span className="text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {stats.fail} Lỗi
                </span>
              </div>
            </div>
          )}

          {/* Error Log Area */}
          {logs.length > 0 && (
            <div className="rounded-md border bg-muted/50">
              <div className="p-2 border-b text-xs font-semibold text-red-600 bg-red-50 rounded-t-md">
                Danh sách lỗi ({logs.length})
              </div>
              <ScrollArea className="h-[150px] p-2">
                <div className="space-y-1">
                  {logs.map((log, idx) => (
                    <div key={idx} className="text-xs flex gap-2 text-red-600">
                      <span className="font-mono font-bold w-[60px]">
                        Hàng {log.row}:
                      </span>
                      <span className="font-mono w-[80px]">{log.phone}</span>
                      <span>- {log.message}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={resetModal}
            disabled={isProcessing}
          >
            Đóng
          </Button>
          <Button onClick={processFile} disabled={!file || isProcessing}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isProcessing ? "Đang xử lý..." : "Bắt đầu nhập dữ liệu"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
