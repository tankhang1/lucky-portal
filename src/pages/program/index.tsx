import { useMemo, useState } from "react";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Plus,
  Trash2,
  Sparkles,
  Image as ImageIcon,
  Search,
  Copy,
  Pencil,
  Filter,
  Check,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { IconDotsVertical } from "@tabler/icons-react";
import Stepper from "@/components/stepper";
import { cn } from "@/lib/utils";
import InfoSection from "./components/Info";
import {
  useSearchGift,
  useSearchProgram,
} from "@/react-query/queries/program/program";
import PrizeSection from "./components/Prize";
import CustomerSection from "./components/Customer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SelectItem } from "@radix-ui/react-select";

export default function ProgramPage() {
  const { data: listProgram } = useSearchProgram({
    k: "",
  });
  // const [programs, setPrograms] = useState<TProgram[]>([]);
  const [search, setSearch] = useState("");
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
  const { data: gifts } = useSearchGift({
    campaignCode: activeProgram?.code,
  });
  const rangeNumberOnline = useMemo(() => {
    if (!activeProgram?.number_extra) return [];
    const list = activeProgram?.number_extra?.split(",");
    return list?.map((item) => {
      const [number, repeat, giftId] = item.split("@@");
      return {
        number,
        repeat,
        giftId,
      };
    });
  }, [activeProgram]);

  const addProgram = () => {};
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
        <Card className="lg:col-span-4 xl:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle>Danh sách chương trình</CardTitle>
            <CardDescription>
              Chọn, tìm kiếm, lọc, sắp xếp, nhân bản hoặc xoá
            </CardDescription>
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
                    Đang bật <Badge>{stats.enabled}</Badge>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={`justify-between ${
                      statusFilter === "disabled" ? "font-medium" : ""
                    }`}
                    onClick={() => setStatusFilter("disabled")}
                  >
                    Đang tắt <Badge variant="outline">{stats.disabled}</Badge>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <ScrollArea>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Badge variant="secondary">Tổng: {stats.total}</Badge>
                <Badge>Đang bật: {stats.enabled}</Badge>
                <Badge variant="outline">Đang tắt: {stats.disabled}</Badge>
              </div>
              <ScrollBar />
            </ScrollArea>

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
                            src={p.image_banner}
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
                          {p.code ? (
                            <span className="text-[11px] text-muted-foreground">
                              • {p.code}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          <Badge variant={p.status ? "default" : "secondary"}>
                            {p.status ? "Bật" : "Tắt"}
                          </Badge>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            aria-label="Mở thao tác"
                          >
                            <IconDotsVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" sideOffset={6}>
                          <DropdownMenuItem
                            onClick={() => {
                              setActiveId(p.id);
                              // duplicateProgram(p.id);
                            }}
                            className="flex items-center gap-2"
                          >
                            <Copy className="h-4 w-4" />
                            Sao chép
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setActiveId(p.id)}
                            className="flex items-center gap-2"
                          >
                            <Pencil className="h-4 w-4" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            // onClick={() => deleteProgram(p.id)}
                            className="flex items-center gap-2 text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                            Xoá
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}

                {filteredPrograms?.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-10">
                    Không tìm thấy chương trình
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-8 xl:col-span-9">
          <Stepper
            steps={[
              { id: "info", label: "Thông tin" },
              { id: "prizes", label: "Giải thưởng" },
              { id: "scenario", label: "Kịch bản" },
              { id: "client", label: "Khách hàng" },
            ]}
            orientation="horizontal"
            onValueChange={setStep}
            defaultValue={step}
            value={step}
          >
            {step === 0 && activeProgram && (
              <InfoSection activeProgram={activeProgram} />
            )}
            {step === 1 && <PrizeSection code={activeProgram.code} />}

            {step === 2 && (
              <div className="space-y-6 px-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Kịch bản chương trình</div>
                  <Badge
                    variant="secondary"
                    className="rounded-md px-2.5 py-1 text-[11px]"
                  >
                    Thiết lập hình thức & dãy số
                  </Badge>
                </div>

                <Card className="border-muted/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Hình thức quay thưởng
                    </CardTitle>
                    <CardDescription>Áp dụng cho Landing Page</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      {[
                        {
                          id: 0,
                          label: "Quay lồng cầu",
                          desc: "Trải nghiệm sự kiện trực tiếp",
                        },
                        {
                          id: 1,
                          label: "Quay online",
                          desc: "Tự động trên web/app",
                        },
                      ].map((opt) => {
                        const checked = activeProgram.type === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            className={cn(
                              "group flex items-start gap-3 rounded-lg border p-3 text-left transition",
                              checked
                                ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                                : "hover:bg-muted/40"
                            )}
                          >
                            <div
                              className={cn(
                                "grid h-5 w-5 place-items-center rounded-full border transition",
                                checked
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "border-muted-foreground/30 text-muted-foreground"
                              )}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0">
                              <div
                                className={cn(
                                  "text-sm",
                                  checked ? "font-medium" : "text-foreground"
                                )}
                              >
                                {opt.label}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {opt.desc}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {activeProgram.type === 0 && (
                  <Card className="border-muted/60">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">
                        Dãy số may mắn
                      </CardTitle>
                      <CardDescription>
                        Phạm vi A→B và số lần lặp cho mỗi số
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            Từ (A)
                          </div>
                          <div className="relative">
                            <Input
                              type="number"
                              inputMode="numeric"
                              className="pr-10"
                              value={activeProgram.number_start}
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-2 grid place-items-center text-xs text-muted-foreground">
                              A
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            Đến (B)
                          </div>
                          <div className="relative">
                            <Input
                              type="number"
                              inputMode="numeric"
                              className="pr-10"
                              value={activeProgram.number_end}
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-2 grid place-items-center text-xs text-muted-foreground">
                              B
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            Số lần lặp
                          </div>
                          <Input
                            type="number"
                            inputMode="numeric"
                            value={activeProgram.number_loop}
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Badge variant="secondary">
                          Tổng lượt dãy:{" "}
                          {Math.max(
                            0,
                            (activeProgram.number_end ?? 0) -
                              (activeProgram.number_start ?? 0) +
                              1
                          ) * Math.max(1, activeProgram.number_loop ?? 1)}
                        </Badge>
                        {(activeProgram.number_start ?? 0) >
                          (activeProgram.number_end ?? 0) && (
                          <span className="rounded-md bg-amber-50 px-2 py-1 text-[11px] text-amber-700 ring-1 ring-amber-200">
                            Lưu ý: A nên ≤ B
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activeProgram.type === 1 && (
                  <Card className="border-muted/60">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Số lẻ may mắn</CardTitle>
                      <CardDescription>
                        Thêm số ngoài dãy A→B, thiết lập lặp & giải thưởng
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Danh sách số lẻ
                        </div>
                        <Button size="sm" className="gap-2">
                          <Plus className="h-4 w-4" />
                          Thêm số
                        </Button>
                      </div>

                      <ScrollArea className="h-[300px] rounded-lg border">
                        <Table className="text-sm">
                          <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                            <TableRow className="[&>th]:h-9 [&>th]:px-3">
                              <TableHead className="w-[120px] text-left">
                                Số
                              </TableHead>
                              <TableHead className="w-[140px] text-left">
                                Số lần lặp
                              </TableHead>
                              <TableHead>Giải thưởng</TableHead>
                              <TableHead className="w-[92px] text-left">
                                Hành động
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="[&>tr:nth-child(even)]:bg-muted/30">
                            {(rangeNumberOnline ?? []).map(
                              (row, idx: number) => {
                                return (
                                  <TableRow
                                    key={idx}
                                    className="[&>td]:px-3 [&>td]:py-2"
                                  >
                                    <TableCell className="text-right">
                                      <Input
                                        type="number"
                                        inputMode="numeric"
                                        value={row.number}
                                      />
                                    </TableCell>

                                    <TableCell className="text-right">
                                      <Input
                                        type="number"
                                        inputMode="numeric"
                                        value={row.repeat ?? 1}
                                      />
                                    </TableCell>

                                    <TableCell>
                                      <Select value={row.giftId ?? ""}>
                                        <SelectTrigger className="w-[260px]">
                                          <SelectValue placeholder="Chọn giải thưởng" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectGroup>
                                            {gifts?.map((p) => (
                                              <SelectItem
                                                key={p.id}
                                                value={p.id.toString()}
                                              >
                                                {p.gift_name}
                                              </SelectItem>
                                            ))}
                                          </SelectGroup>
                                        </SelectContent>
                                      </Select>
                                    </TableCell>

                                    <TableCell className="text-right">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Xoá"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              }
                            )}

                            {rangeNumberOnline.length === 0 && (
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
                )}
              </div>
            )}
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
              src={previewImage!}
              alt=""
              className="w-full h-[400px] rounded-lg object-contain"
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
