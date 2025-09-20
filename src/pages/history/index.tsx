import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Filter,
  Download,
  Calendar,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Eye,
  EyeOff,
  MoreHorizontal,
  Copy,
  Info,
  Plus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils"; // nếu bạn có helper; nếu không có, thay bằng join(" ")

type HistoryRow = {
  id: string;
  name?: string;
  phone: string;
  prize: string;
  program: string;
  wonAt: string; // ISO
};

// ---------------------- Demo Data Builder ----------------------
const VN_FIRST = [
  "Nguyễn",
  "Trần",
  "Lê",
  "Phạm",
  "Hoàng",
  "Vũ",
  "Võ",
  "Đỗ",
  "Bùi",
  "Phan",
  "Đặng",
  "Dương",
];
const VN_MID = [
  "Văn",
  "Thị",
  "Hữu",
  "Minh",
  "Anh",
  "Ngọc",
  "Quốc",
  "Phúc",
  "Tuấn",
  "Thanh",
  "Hải",
  "Thái",
];
const VN_LAST = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "Khoa",
  "Long",
  "Trang",
  "Lan",
  "Hạnh",
  "Linh",
  "My",
  "Huy",
  "Nam",
];
const PROGRAMS = [
  "Tết 2025 – Lì xì vui vẻ",
  "Sinh nhật 10 năm",
  "Kỷ niệm khách hàng",
];
const PRIZES = [
  "E-voucher 50k",
  "Combo Tết",
  "Jackpot 5,000,000đ",
  "Bộ quà sinh nhật",
  "Bộ quà 10 năm",
];

const rand = (n: number) => Math.floor(Math.random() * n);
const pick = <T,>(arr: T[]) => arr[rand(arr.length)];
const randomName = () => `${pick(VN_FIRST)} ${pick(VN_MID)} ${pick(VN_LAST)}`;
const randomPhone = () =>
  "0" +
  (9 + rand(1)).toString() +
  Array.from({ length: 8 }, () => rand(10)).join("");

const randomDateBetween = (from: Date, to: Date) =>
  new Date(from.getTime() + Math.random() * (to.getTime() - from.getTime()));

function buildDemoRows(count = 150): HistoryRow[] {
  const now = new Date();
  const first = new Date(now);
  first.setMonth(first.getMonth() - 2);

  const rows: HistoryRow[] = [];
  for (let i = 0; i < count; i++) {
    const program = pick(PROGRAMS);
    const prize = program.includes("Tết")
      ? pick(["E-voucher 50k", "Combo Tết", "Jackpot 5,000,000đ"])
      : program.includes("Sinh nhật")
      ? pick(["Bộ quà sinh nhật", "Bộ quà 10 năm"])
      : pick(["E-voucher 50k", "Combo Tết", "Bộ quà 10 năm"]);
    const withName = Math.random() > 0.12;
    rows.push({
      id: String(i + 1),
      name: withName ? randomName() : "",
      phone: randomPhone(),
      program,
      prize,
      wonAt: randomDateBetween(first, now).toISOString(),
    });
  }
  // sort newest first initially
  rows.sort((a, b) => +new Date(b.wonAt) - +new Date(a.wonAt));
  return rows;
}

// ---------------------- Utils ----------------------
const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const toYMD = (isoOrDate: string | Date) => {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const exportToCsv = (rows: HistoryRow[]) => {
  const header = [
    "Tên",
    "Số điện thoại",
    "Giải thưởng",
    "Chương trình",
    "Ngày trúng thưởng",
  ];
  const csv = [
    header.join(","),
    ...rows.map((r) =>
      [
        r.name || "",
        r.phone,
        r.prize,
        r.program,
        new Date(r.wonAt).toISOString(),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lich-su-trung-thuong-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const maskPhone = (s: string, isMasked: boolean) => {
  if (!isMasked) return s;
  if (s.length < 4) return "****";
  const tail = s.slice(-3);
  return "●".repeat(Math.max(0, s.length - 3)) + tail;
};

const prizeVariant = (
  p: string
): "default" | "secondary" | "destructive" | "outline" => {
  if (/jackpot/i.test(p)) return "destructive";
  if (/combo|bộ quà/i.test(p)) return "default";
  return "secondary";
};

// ---------------------- Component ----------------------
type SortKey = "name" | "phone" | "prize" | "program" | "wonAt";
type SortDir = "asc" | "desc";

const HistoryPage: React.FC = () => {
  // data
  const [rows, setRows] = useState<HistoryRow[]>(() => buildDemoRows(150));

  // filters
  const [q, setQ] = useState("");
  const [program, setProgram] = useState<string>("all");
  const [prize, setPrize] = useState<string>("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  // sorting
  const [sortBy, setSortBy] = useState<SortKey>("wonAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // paging
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // phone mask
  const [hidePhone, setHidePhone] = useState(false);

  // form dialog
  const [openAdd, setOpenAdd] = useState(false);
  const [fName, setFName] = useState("");
  const [fPhone, setFPhone] = useState("");
  const [fProgram, setFProgram] = useState<string>("");
  const [fPrize, setFPrize] = useState<string>("");
  const [fNote, setFNote] = useState(""); // nếu muốn lưu chú thích (hiện chỉ hiển thị trong dialog detail)
  const [fDate, setFDate] = useState<string>(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); // localize datetime-local
    return d.toISOString().slice(0, 16);
  });

  const programs = useMemo(
    () => Array.from(new Set(rows.map((r) => r.program))),
    [rows]
  );
  const prizes = useMemo(
    () => Array.from(new Set(rows.map((r) => r.prize))),
    [rows]
  );

  // quick stats
  const total = rows.length;
  const uniquePhones = useMemo(
    () => new Set(rows.map((r) => r.phone)).size,
    [rows]
  );
  const prizeSummary = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r) => m.set(r.prize, (m.get(r.prize) || 0) + 1));
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    let list = rows.filter((r) => {
      const okQ =
        !ql ||
        [r.name || "", r.phone, r.prize, r.program]
          .join(" ")
          .toLowerCase()
          .includes(ql);
      const okProgram = program === "all" || r.program === program;
      const okPrize = prize === "all" || r.prize === prize;
      const okFrom = !from || toYMD(r.wonAt) >= from;
      const okTo = !to || toYMD(r.wonAt) <= to;
      return okQ && okProgram && okPrize && okFrom && okTo;
    });

    // sort
    list = list.sort((a, b) => {
      const factor = sortDir === "asc" ? 1 : -1;
      const av = a[sortBy]!;
      const bv = b[sortBy]!;
      if (sortBy === "wonAt") {
        return (new Date(av).getTime() - new Date(bv).getTime()) * factor;
      }
      return String(av).localeCompare(String(bv), "vi") * factor;
    });

    return list;
  }, [rows, q, program, prize, from, to, sortBy, sortDir]);

  const maxPage = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, maxPage);
  const visible = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  useEffect(() => {
    setPage(1); // reset page khi thay lọc
  }, [q, program, prize, from, to, pageSize]);

  const resetFilters = () => {
    setQ("");
    setProgram("all");
    setPrize("all");
    setFrom("");
    setTo("");
    setPage(1);
  };

  const toggleSort = (key: SortKey) => {
    if (key === sortBy) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir(key === "wonAt" ? "desc" : "asc");
    }
  };

  const quickRange = (type: "today" | "7d" | "month" | "all") => {
    const now = new Date();
    if (type === "all") {
      setFrom("");
      setTo("");
      return;
    }
    if (type === "today") {
      const y = toYMD(now);
      setFrom(y);
      setTo(y);
      return;
    }
    if (type === "7d") {
      const past = new Date(now);
      past.setDate(now.getDate() - 6);
      setFrom(toYMD(past));
      setTo(toYMD(now));
      return;
    }
    if (type === "month") {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setFrom(toYMD(first));
      setTo(toYMD(last));
      return;
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  const addRow = () => {
    const phone = fPhone.replace(/[^\d+]/g, "");
    const dt = fDate ? new Date(fDate) : new Date();
    if (!phone) {
      alert("Số điện thoại không hợp lệ");
      return;
    }
    if (!fProgram || !fPrize) {
      alert("Chọn chương trình và giải thưởng");
      return;
    }
    const row: HistoryRow = {
      id: crypto.randomUUID(),
      name: fName.trim() || "",
      phone,
      program: fProgram,
      prize: fPrize,
      wonAt: dt.toISOString(),
    };
    setRows((prev) => [row, ...prev]);
    setOpenAdd(false);
    // reset nhẹ
    setFName("");
    setFPhone("");
    setFNote("");
  };

  const newestWithin24h = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    return diff < 24 * 60 * 60 * 1000;
  };

  return (
    <div className="p-6 space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                Lịch sử trúng thưởng
              </CardTitle>
              <CardDescription>
                Tìm kiếm, lọc, thêm thủ công và xuất CSV danh sách người trúng
                thưởng.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => exportToCsv(filtered)}
              >
                <Download className="h-4 w-4" />
                Xuất CSV
              </Button>
              <Button
                variant={hidePhone ? "default" : "outline"}
                className="gap-2"
                onClick={() => setHidePhone((v) => !v)}
                title={hidePhone ? "Hiện SĐT đầy đủ" : "Ẩn SĐT"}
              >
                {hidePhone ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
                {hidePhone ? "Hiện SĐT" : "Ẩn SĐT"}
              </Button>

              <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Thêm kết quả
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Thêm kết quả trúng thưởng</DialogTitle>
                    <DialogDescription>
                      Nhập thông tin và lưu.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3 pt-2">
                    <div className="grid grid-cols-4 items-center gap-2">
                      <Label className="col-span-1 text-sm text-muted-foreground">
                        Tên KH
                      </Label>
                      <Input
                        className="col-span-3"
                        placeholder="Tuỳ chọn"
                        value={fName}
                        onChange={(e) => setFName(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-2">
                      <Label className="col-span-1 text-sm text-muted-foreground">
                        Số ĐT
                      </Label>
                      <Input
                        className="col-span-3"
                        placeholder="090..."
                        value={fPhone}
                        onChange={(e) => setFPhone(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-2">
                      <Label className="col-span-1 text-sm text-muted-foreground">
                        Chương trình
                      </Label>
                      <Select value={fProgram} onValueChange={setFProgram}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Chọn chương trình" />
                        </SelectTrigger>
                        <SelectContent>
                          {[...new Set([...PROGRAMS, ...programs])].map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-2">
                      <Label className="col-span-1 text-sm text-muted-foreground">
                        Giải thưởng
                      </Label>
                      <Select value={fPrize} onValueChange={setFPrize}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Chọn giải thưởng" />
                        </SelectTrigger>
                        <SelectContent>
                          {[...new Set([...PRIZES, ...prizes])].map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-2">
                      <Label className="col-span-1 text-sm text-muted-foreground">
                        Thời gian
                      </Label>
                      <Input
                        className="col-span-3"
                        type="datetime-local"
                        value={fDate}
                        onChange={(e) => setFDate(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-2">
                      <Label className="col-span-1 text-sm text-muted-foreground">
                        Ghi chú
                      </Label>
                      <Textarea
                        className="col-span-3"
                        value={fNote}
                        onChange={(e) => setFNote(e.target.value)}
                        placeholder="(tuỳ chọn) Ví dụ: đã gọi xác nhận, giao quà ngày ..."
                      />
                    </div>
                  </div>
                  <DialogFooter className="pt-2">
                    <Button variant="outline" onClick={() => setOpenAdd(false)}>
                      Huỷ
                    </Button>
                    <Button onClick={addRow}>Lưu</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 gap-2 flex">
            <div className="relative w-full">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm theo tên, SĐT, giải thưởng, chương trình..."
                className="pl-9"
              />
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>

            <div className="relative">
              <Select value={program} onValueChange={setProgram}>
                <SelectTrigger>
                  <SelectValue placeholder="Chương trình" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả chương trình</SelectItem>
                  {programs.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Select value={prize} onValueChange={setPrize}>
              <SelectTrigger>
                <SelectValue placeholder="Giải thưởng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả giải thưởng</SelectItem>
                {prizes.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Preset
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Khoảng nhanh</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => quickRange("today")}>
                  Hôm nay
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => quickRange("7d")}>
                  7 ngày qua
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => quickRange("month")}>
                  Tháng này
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => quickRange("all")}>
                  Tất cả
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" className="gap-2" onClick={resetFilters}>
              <RotateCcw className="h-4 w-4" />
              Xoá lọc
            </Button>
          </div>
        </CardHeader>

        {/* Quick stats */}
        <CardContent className="pb-0">
          <div className="grid gap-3 md:grid-cols-3">
            <Card className="border-dashed">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">
                  Tổng lượt trúng
                </div>
                <div className="mt-1 text-2xl font-semibold">{total}</div>
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">
                  Số lượng tham gia
                </div>
                <div className="mt-1 text-2xl font-semibold">
                  {uniquePhones}
                </div>
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">
                  Phân bố theo giải (Top)
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {prizeSummary.slice(0, 4).map(([k, v]) => (
                    <Badge
                      key={k}
                      variant={prizeVariant(k)}
                      className="rounded-full"
                    >
                      {k}: {v}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>

        <Separator />

        <CardContent className="pt-4">
          <ScrollArea className="h-[520px] rounded-md border">
            <Table className="text-sm">
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow className="[&>th]:h-10 [&>th]:px-3">
                  <TableHead className="w-10 text-center">#</TableHead>

                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("name")}
                  >
                    <div className="inline-flex items-center gap-1">
                      Tên
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                    </div>
                  </TableHead>

                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("phone")}
                  >
                    <div className="inline-flex items-center gap-1">
                      Số điện thoại
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                    </div>
                  </TableHead>

                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("prize")}
                  >
                    <div className="inline-flex items-center gap-1">
                      Giải thưởng
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                    </div>
                  </TableHead>

                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("program")}
                  >
                    <div className="inline-flex items-center gap-1">
                      Chương trình
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                    </div>
                  </TableHead>

                  <TableHead
                    className="w-[230px] cursor-pointer select-none"
                    onClick={() => toggleSort("wonAt")}
                  >
                    <div className="inline-flex items-center gap-1">
                      Ngày trúng thưởng
                      <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />
                    </div>
                  </TableHead>

                  <TableHead className="w-[70px] text-right">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody className="[&>tr:nth-child(even)]:bg-muted/30">
                {visible.map((r, idx) => (
                  <TableRow
                    key={r.id}
                    className="[&>td]:px-3 [&>td]:py-2 hover:bg-muted/50"
                  >
                    <TableCell className="text-center">
                      {(safePage - 1) * pageSize + idx + 1}
                    </TableCell>

                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {/* Avatar chữ cái */}
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px]">
                          {(r.name && r.name[0]) || "?"}
                        </div>
                        <div>
                          {r.name?.trim() ? (
                            r.name
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                          {newestWithin24h(r.wonAt) && (
                            <Badge
                              className="ml-2 h-5 rounded-full px-2 text-[11px]"
                              variant="outline"
                            >
                              Mới
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="font-mono">
                      <div className="flex items-center gap-2">
                        <span>{maskPhone(r.phone, hidePhone)}</span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                className="rounded p-1 hover:bg-muted"
                                onClick={() => copyToClipboard(r.phone)}
                                title="Sao chép SĐT"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Sao chép SĐT</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={prizeVariant(r.prize)}
                        className="rounded-full"
                      >
                        {r.prize}
                      </Badge>
                    </TableCell>

                    <TableCell className="truncate max-w-[260px]">
                      {r.program}
                    </TableCell>

                    <TableCell>{formatDateTime(r.wonAt)}</TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => copyToClipboard(r.phone)}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Sao chép SĐT
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => alert(JSON.stringify(r, null, 2))}
                          >
                            <Info className="mr-2 h-4 w-4" />
                            Xem chi tiết
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}

                {visible.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-[120px] text-center">
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        Không có dữ liệu phù hợp
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>

          {/* footer */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              Hiển thị <span className="font-medium">{visible.length}</span> /{" "}
              <span className="font-medium">{filtered.length}</span> kết quả
              {filtered.length !== rows.length && <> (tổng {rows.length})</>}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span>Kích thước trang</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    setPageSize(Number(v));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-8 w-[86px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 25, 50, 100].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="outline"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-[120px] text-center text-sm">
                  Trang <span className="font-medium">{safePage}</span> /{" "}
                  {maxPage}
                </div>
                <Button
                  size="icon"
                  variant="outline"
                  disabled={safePage >= maxPage}
                  onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HistoryPage;
