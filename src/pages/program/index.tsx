import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Sparkles,
  Image as ImageIcon,
  Search,
  Filter,
  X,
  CheckCircle2,
  Clock,
  FileText,
  Ban,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import Stepper from "@/components/stepper";
import { cn } from "@/lib/utils";
import InfoSection from "./components/Info";
import {
  useDeleteProgramInfo,
  useSearchProgram,
} from "@/react-query/queries/program/program";
import PrizeSection from "./components/Prize";
import CustomerSection from "./components/Customer";

import ActionIcon from "@/components/action-icon";
import { toast } from "react-toastify";
import { queryClient } from "@/main";
import QUERY_KEY from "@/constants/key";
import type { TSearchProgramRes } from "@/react-query/services/program/program.service";
import LuckyExtra from "./components/LuckyExtra";
import { useCheckTokenExpire } from "@/react-query/queries/auth/auth";
export const statusConfig: Record<
  number,
  { label: string; className: string; icon: React.ReactNode }
> = {
  "1": {
    label: "Hoạt động",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    icon: <CheckCircle2 className="w-3 h-3 mr-1" />, // Optional: thêm icon cho đẹp
  },
  "0": {
    label: "Chờ kích hoạt",
    className: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
    icon: <Clock className="w-3 h-3 mr-1" />,
  },
  "-1": {
    label: "Bản nháp",
    className: "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
    icon: <FileText className="w-3 h-3 mr-1" />,
  },
  "2": {
    label: "Đã huỷ",
    className: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
    icon: <Ban className="w-3 h-3 mr-1" />,
  },
  "3": {
    label: "Hết hạn",
    className: "border-gray-200 bg-gray-100 text-gray-500",
    icon: <AlertCircle className="w-3 h-3 mr-1" />,
  },
};
export default function ProgramPage() {
  const { data: programs, isLoading: isLoadingPrograms } = useSearchProgram({
    k: "",
  });
  const { mutate: deleteProgramInfo } = useDeleteProgramInfo();
  const { mutate: checkToken } = useCheckTokenExpire();
  const [search, setSearch] = useState("");
  const [listProgram, setListProgram] = useState<TSearchProgramRes>([]);
  const [activeId, setActiveId] = useState<number>(-1);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "enabled" | "disabled"
  >("all");

  const activeProgram = useMemo(
    () => listProgram?.find((p) => p.id === activeId)!,
    [listProgram, activeId]
  );

  const addProgram = () => {
    const now = new Date();
    setStep(0);
    setListProgram((prev) => [
      {
        id: -1,
        uuid: "",
        code: "",
        name: "",

        time_create: now.toISOString(),
        time_create_number: now.getTime(),
        time_start: undefined,
        time_start_number: 0,
        time_end: undefined,
        time_end_number: 0,
        time_deactive: undefined,
        time_deactive_number: 0,
        time_active: undefined,
        time_active_number: 0,

        status: -1,
        type: 1,

        image_thumbnail: "",
        image_banner: "",
        pdf_link: "",
        audio_link: "",

        description: "",
        description_short: "",

        number_start: 0,
        number_end: 0,
        number_loop: 0,
        number_extra: "",
      },
      ...prev,
    ]);
  };
  const onDeleteProgramInfo = (code: string) => {
    if (confirm(`Bạn có chắc chắn muốn tạm dừng chương trình ${code}`)) {
      deleteProgramInfo(
        {
          code,
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
  };
  const stats = useMemo(() => {
    const total = listProgram?.length || 0;
    const enabled = listProgram?.filter((p) => p.status === 1).length || 0;
    const disabled = total - enabled;
    return { total, enabled, disabled };
  }, [listProgram]);

  const filteredPrograms = useMemo(() => {
    const q = search.toLowerCase();
    let list = listProgram?.filter((p) => p.name.toLowerCase().includes(q));
    if (statusFilter !== "all") {
      list = list?.filter((p) =>
        statusFilter === "enabled" ? p.status : !p.status
      );
    }
    return list;
  }, [listProgram, search, statusFilter]);
  useEffect(() => {
    if (listProgram && listProgram?.length > 0 && !activeId) {
      setActiveId(listProgram?.[0]?.id);
    }
  }, [listProgram]);
  useEffect(() => {
    if (programs && programs.length > 0) {
      setListProgram(programs);
    }
  }, [programs]);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      checkToken(
        {
          token: token,
        },
        {
          onSuccess: (isExpire) => {
            if (isExpire) {
              localStorage.clear();
              location.replace("/");
              alert("Đã hết phiên đăng nhập, vui lòng đăng nhập lại");
            }
          },
        }
      );
    } else {
      localStorage.clear();
      location.replace("/");
      alert("Đã hết phiên đăng nhập, vui lòng đăng nhập lại");
    }
  }, [location.pathname]);
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-2xl font-semibold">
          <Sparkles className="h-6 w-6" /> Trình tạo chương trình giải thưởng
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={addProgram} className="gap-2">
            <Plus className="h-4 w-4" />
            Tạo chương trình
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="col-span-4">
          <CardHeader className="pb-3">
            <CardTitle>Danh sách chương trình</CardTitle>
            <CardDescription>Chọn, tìm kiếm, lọc</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo tên…"
                  className="pl-9"
                />
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    className={`justify-between ${
                      statusFilter === "all" ? "font-medium" : ""
                    }`}
                    onClick={() => setStatusFilter("all")}
                  >
                    Tất cả <Badge variant="secondary">{stats.total}</Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={`justify-between ${
                      statusFilter === "enabled" ? "font-medium" : ""
                    }`}
                    onClick={() => setStatusFilter("enabled")}
                  >
                    Đang hoạt động <Badge>{stats.enabled}</Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={`justify-between ${
                      statusFilter === "disabled" ? "font-medium" : ""
                    }`}
                    onClick={() => setStatusFilter("disabled")}
                  >
                    Khác <Badge variant="outline">{stats.disabled}</Badge>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <ScrollArea className="h-[520px]">
              <div className="space-y-2">
                {filteredPrograms?.map((p) => {
                  const active = p.id === activeId;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setActiveId(p.id)}
                      className={`
    group grid grid-cols-[64px_1fr_auto] items-center gap-3 rounded-xl border p-3 transition-colors cursor-pointer
    ${active ? "border-primary bg-background" : "hover:bg-muted/30"}
  `}
                    >
                      <div className="h-16 w-16 overflow-hidden rounded-lg ring-1 ring-border bg-muted/20">
                        {p.image_banner ? (
                          <img
                            src={`${p.image_banner}?t=${new Date().getTime()}`}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full grid place-content-center text-[10px] text-muted-foreground">
                            <ImageIcon className="h-3 w-3 mr-1" />
                            Ảnh
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center flex-wrap gap-2">
                          <div className="font-medium truncate">{p.name}</div>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          <Badge
                            variant={"outline"}
                            className={cn(
                              "px-2.5 py-0.5 text-xs font-medium transition-colors", // Base styles
                              statusConfig[p.status].className
                            )}
                          >
                            {statusConfig[p.status].icon}
                            {statusConfig[p.status].label}
                          </Badge>
                        </div>
                      </div>

                      {p.id === -1 ? (
                        <ActionIcon
                          onClick={() => setListProgram(listProgram.slice(1))}
                          label={"Xoá"}
                        >
                          <X className="h-4 w-4" color="red" />
                        </ActionIcon>
                      ) : (
                        p.status < 2 && (
                          <ActionIcon
                            onClick={() => onDeleteProgramInfo(p.code)}
                            label={"Huỷ"}
                          >
                            <Ban className="h-4 w-4" color="red" />
                          </ActionIcon>
                        )
                      )}
                    </div>
                  );
                })}
                {isLoadingPrograms && (
                  <div className="flex items-center gap-2 justify-center">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang xử lí...
                  </div>
                )}
                {!isLoadingPrograms && filteredPrograms?.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-10">
                    Không tìm thấy chương trình
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="col-span-8">
          <Stepper
            steps={[
              { id: "info", label: "Thông tin" },
              { id: "prizes", label: "Giải thưởng" },
              { id: "lucky_number", label: "Số may mắn" },
              { id: "client", label: "Khách hàng" },
            ]}
            orientation="horizontal"
            onValueChange={(value) => {
              if (activeProgram?.code) {
                setStep(value);
              } else {
                alert("Vui lòng hoàn thành bước 1");
              }
            }}
            defaultValue={step}
            value={step}
            activeProgram={activeProgram}
          >
            {step === 0 && activeProgram && (
              <InfoSection activeProgram={activeProgram} />
            )}
            {step === 1 && <PrizeSection code={activeProgram?.code} />}

            {step === 2 && <LuckyExtra activeProgram={activeProgram} />}
            {step === 3 && <CustomerSection code={activeProgram?.code} />}
          </Stepper>
        </Card>
        <Dialog
          open={previewImage !== null}
          onOpenChange={() => setPreviewImage(null)}
        >
          <DialogTitle></DialogTitle>
          <DialogContent>
            <img
              src={`${previewImage}?t=${new Date().getTime()}`}
              alt=""
              className="w-full h-[400px] rounded-lg object-contain"
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
