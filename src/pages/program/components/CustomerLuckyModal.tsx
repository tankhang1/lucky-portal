import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Gift, CalendarClock } from "lucide-react";
import { useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import type { TProgramCustomer } from "@/react-query/services/program/program.service";
import { useGetProgramNumberDetail } from "@/react-query/queries/program/program";

export type TCampaignDetailNumber = {
  number: number;
  award_name?: string;
  gift_image: string | null;
  gift_name: string | null;
  time: string;
  award_time: string | null;
};

type TCustomerLuckyModal = {
  customer: TProgramCustomer | null;
  onClose: (customer: TProgramCustomer | null) => void;
  code: string;
};

const CustomerLuckyModal = ({
  code,
  customer,
  onClose,
}: TCustomerLuckyModal) => {
  const [showOnlyWinners, setShowOnlyWinners] = useState(false);
  const { data: listNumbers, isPending: isLoadingListNumber } =
    useGetProgramNumberDetail({
      c: code,
      p: customer?.consumer_phone || "",
    });

  const formatTime = (timeStr: string) => {
    try {
      return new Date(timeStr).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return timeStr;
    }
  };
  const filteredNumbers = useMemo(() => {
    if (!listNumbers) return [];
    if (showOnlyWinners) {
      return listNumbers.filter((n) => !!n.gift_name || !!n.award_name);
    }
    return listNumbers;
  }, [listNumbers, showOnlyWinners]);
  return (
    <Dialog open={customer !== null} onOpenChange={() => onClose(null)}>
      <DialogContent className="max-w-2xl flex flex-col max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Chi tiết số may mắn</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <span className="font-semibold text-foreground">
              {customer?.consumer_name ?? "Khách hàng"}
            </span>
            <span>•</span>
            <span className="font-mono">{customer?.consumer_phone}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between py-2">
          <div className="text-sm text-muted-foreground">
            Tổng số:{" "}
            <span className="font-medium text-foreground">
              {listNumbers?.length || 0}
            </span>
            {showOnlyWinners && (
              <>
                {" "}
                • Đang hiển thị:{" "}
                <span className="font-medium text-foreground">
                  {filteredNumbers.length}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="show-winners"
              checked={showOnlyWinners}
              onCheckedChange={setShowOnlyWinners}
            />
            <Label htmlFor="show-winners" className="cursor-pointer">
              Chỉ hiện giải thưởng
            </Label>
          </div>
        </div>
        {/* 2. Loading State */}
        {isLoadingListNumber ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-1">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          /* 3. Data Display */
          <div className="flex-1 max-h-[400px] overflow-y-auto -mr-4 pr-4">
            {filteredNumbers && filteredNumbers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pb-4">
                {filteredNumbers?.map((n, i) => {
                  // Determine if this is a winning number
                  const isWinner = !!n.gift_name || !!n.award_name;
                  const prizeName = n.gift_name || n.award_name;

                  return (
                    <div
                      key={i}
                      className={`relative flex flex-col gap-1.5 p-3 rounded-xl border transition-all ${
                        isWinner
                          ? "bg-amber-50/80 border-amber-200 shadow-sm"
                          : "bg-card hover:bg-accent/50 border-border"
                      }`}
                    >
                      {/* Top Row: Number and Icon */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-mono text-lg font-bold tracking-tight ${
                            isWinner ? "text-amber-700" : "text-foreground"
                          }`}
                        >
                          {n.number}
                        </span>
                        {isWinner && (
                          <div className="h-6 w-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                            <Gift className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>

                      {/* Middle Row: Prize Info or Separator */}
                      {isWinner ? (
                        <div className="flex items-center gap-2 mt-1">
                          {n.gift_image ? (
                            <img
                              src={n.gift_image}
                              alt="gift"
                              className="h-8 w-8 object-contain rounded bg-white border border-amber-100"
                            />
                          ) : null}
                          <span className="text-xs font-semibold text-amber-800 line-clamp-2 leading-tight">
                            {prizeName}
                          </span>
                        </div>
                      ) : (
                        <div className="h-px w-full bg-border/50 my-1" />
                      )}

                      {/* Bottom Row: Timestamp */}
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-auto pt-1">
                        <CalendarClock className="h-3 w-3 opacity-70" />
                        <span>{formatTime(n.time)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                <Gift className="h-10 w-10 opacity-20" />
                <p>Khách hàng này chưa có số may mắn nào.</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CustomerLuckyModal;
