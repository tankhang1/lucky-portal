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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Filter,
  Download,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useGetProgramLuckyHistory } from "@/react-query/queries/program/program";

// ---------------------- Types ----------------------
type HistoryRow = {
  id: string;
  name?: string;
  phone: string;
  prize: string; // tên giải trúng (nếu chỉ tham gia mà chưa trúng, để "")
  program: string;
  programCode?: string; // Mã CT
  wonAt?: string; // ISO – có nghĩa là đã trúng
  drawAt: string; // ISO – thời gian bốc số (tham gia)
  address?: string;
  idCard?: string; // CCCD
  note?: string;
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
  { name: "Tết 2025 – Lì xì vui vẻ", code: "TET25" },
  { name: "Sinh nhật 10 năm", code: "B10Y" },
  { name: "Kỷ niệm khách hàng", code: "CUST" },
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

function buildDemoRows(count = 200): HistoryRow[] {
  const now = new Date();
  const first = new Date(now);
  first.setMonth(first.getMonth() - 2);

  const rows: HistoryRow[] = [];
  for (let i = 0; i < count; i++) {
    const pg = pick(PROGRAMS);
    const prizePool = pg.name.includes("Tết")
      ? ["E-voucher 50k", "Combo Tết", "Jackpot 5,000,000đ"]
      : pg.name.includes("Sinh nhật")
      ? ["Bộ quà sinh nhật", "Bộ quà 10 năm"]
      : ["E-voucher 50k", "Combo Tết", "Bộ quà 10 năm"];
    const joinedAt = randomDateBetween(first, now);
    const isWinner = Math.random() > 0.55; // ~45% chỉ tham gia, chưa trúng
    const wonAt = isWinner
      ? new Date(joinedAt.getTime() + rand(5) * 3600_000)
      : undefined;
    const withName = Math.random() > 0.12;

    rows.push({
      id: crypto.randomUUID(),
      name: withName ? randomName() : "",
      phone: randomPhone(),
      program: pg.name,
      programCode: pg.code,
      prize: isWinner ? pick(prizePool) : "",
      drawAt: joinedAt.toISOString(),
      wonAt: wonAt?.toISOString(),
      address: Math.random() > 0.7 ? "Q.1, TP.HCM" : "",
      idCard: Math.random() > 0.75 ? "0790xxxxxx" : "",
      note: Math.random() > 0.85 ? "Đã gọi xác nhận" : "",
    });
  }

  // newest first by drawAt
  rows.sort((a, b) => +new Date(b.drawAt) - +new Date(a.drawAt));
  return rows;
}

// ---------------------- Utils ----------------------
const formatDateTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString("vi-VN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";

const toYMD = (isoOrDate: string | Date) => {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const exportToCsv = (rows: HistoryRow[]) => {
  const header = [
    "Chương trình",
    "Mã",
    "Tên",
    "Số điện thoại",
    "Địa chỉ",
    "Căn cước",
    "Giải thưởng",
    "Ghi chú",
    "Thời gian bốc số",
    "Thời gian trúng thưởng",
  ];
  const csv = [
    header.join(","),
    ...rows.map((r) =>
      [
        r.program,
        r.programCode || "",
        r.name || "",
        r.phone,
        r.address || "",
        r.idCard || "",
        r.prize || "",
        r.note || "",
        r.drawAt ? new Date(r.drawAt).toISOString() : "",
        r.wonAt ? new Date(r.wonAt).toISOString() : "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lich-su-${Date.now()}.csv`;
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
type SortKey =
  | "name"
  | "phone"
  | "prize"
  | "program"
  | "programCode"
  | "idCard"
  | "drawAt"
  | "wonAt";
type SortDir = "asc" | "desc";
type TabKey = "participants" | "winners";

const HistoryPage: React.FC = () => {
  const { data: histories } = useGetProgramLuckyHistory({
    c: "tungbunghethu1",
  });
  // data
  const [rows, setRows] = useState<HistoryRow[]>([]);

  // filters
  const [q, setQ] = useState("");
  const [program, setProgram] = useState<string>("all");
  const [prize, setPrize] = useState<string>("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  // sorting
  const [sortBy, setSortBy] = useState<SortKey>("drawAt");
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
  const [fNote, setFNote] = useState("");
  const [fDateDraw, setFDateDraw] = useState<string>(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [fDateWin, setFDateWin] = useState<string>("");

  // tabs
  const [tab, setTab] = useState<TabKey>("participants");

  // options
  const programs = useMemo(
    () => Array.from(new Set(rows.map((r) => r.program))),
    [rows]
  );
  const prizes = useMemo(
    () => Array.from(new Set(rows.map((r) => r.prize).filter(Boolean))),
    [rows]
  );

  // Quick stats
  const totalParticipations = rows.length; // Tổng lượt tham gia
  const totalLuckyNumbers = rows.reduce((acc) => acc + 1, 0); // = rows.length (mỗi lượt bốc 1 số)
  const prizeSummary = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r) => {
      if (r.wonAt && r.prize) m.set(r.prize, (m.get(r.prize) || 0) + 1);
    });
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [rows]);

  const programCodes = useMemo(() => {
    const m = new Map<string, string>();
    rows.forEach(
      (r) => r.program && r.programCode && m.set(r.program, r.programCode)
    );
    return m;
  }, [rows]);

  // Derived lists by tab
  const baseList = useMemo(() => {
    return tab === "winners" ? rows.filter((r) => !!r.wonAt) : rows;
  }, [rows, tab]);

  // Filtering + sorting
  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    let list = baseList.filter((r) => {
      const okQ =
        !ql ||
        [r.name || "", r.phone, r.prize || "", r.program, r.programCode || ""]
          .join(" ")
          .toLowerCase()
          .includes(ql);
      const okProgram = program === "all" || r.program === program;
      const okPrize = prize === "all" || r.prize === prize;
      const okFrom =
        !from || toYMD(tab === "winners" ? r.wonAt || "" : r.drawAt) >= from;
      const okTo =
        !to || toYMD(tab === "winners" ? r.wonAt || "" : r.drawAt) <= to;
      return okQ && okProgram && okPrize && okFrom && okTo;
    });

    // sort
    list = list.sort((a, b) => {
      const factor = sortDir === "asc" ? 1 : -1;
      const av = a[sortBy] as any;
      const bv = b[sortBy] as any;
      if (sortBy === "drawAt" || sortBy === "wonAt") {
        return (
          (new Date(av || 0).getTime() - new Date(bv || 0).getTime()) * factor
        );
      }
      return String(av ?? "").localeCompare(String(bv ?? ""), "vi") * factor;
    });

    return list;
  }, [baseList, q, program, prize, from, to, sortBy, sortDir, tab]);

  const [pageCache, setPageCache] = useState<Record<TabKey, number>>({
    participants: 1,
    winners: 1,
  });
  const maxPage = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, maxPage);
  const visible = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [q, program, prize, from, to, pageSize, tab]);

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
      setSortDir(key === "drawAt" || key === "wonAt" ? "desc" : "asc");
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
    const dtDraw = fDateDraw ? new Date(fDateDraw) : new Date();
    const dtWin = fDateWin ? new Date(fDateWin) : undefined;

    if (!phone) {
      alert("Số điện thoại không hợp lệ");
      return;
    }
    if (!fProgram) {
      alert("Chọn chương trình");
      return;
    }

    const pg = PROGRAMS.find((x) => x.name === fProgram) || { code: "" };
    const row: HistoryRow = {
      id: crypto.randomUUID(),
      name: fName.trim() || "",
      phone,
      program: fProgram,
      programCode: pg.code || "",
      prize: fPrize || "",
      drawAt: dtDraw.toISOString(),
      wonAt: dtWin ? dtWin.toISOString() : undefined,
      note: fNote || "",
    };
    setRows((prev) => [row, ...prev]);
    setOpenAdd(false);
    setFName("");
    setFPhone("");
    setFNote("");
    setFPrize("");
    setFDateWin("");
  };

  const newestWithin24h = (iso?: string) =>
    iso ? Date.now() - new Date(iso).getTime() < 24 * 3600_000 : false;

  // grid click => set filter prize
  const onPickPrize = (name: string) => {
    setPrize(name || "all");
    setTab("winners");
  };

  useEffect(() => {
    setRows(
      histories?.map((item, index) => ({
        id: index.toString(),
        drawAt: item.time,
        phone: item.consumer_phone,
        prize: item.award_name,
        program: "tung bung ",
        address: "",
        idCard: item.number.toString(),
        name: item.consumer_name,
        note: "",
        programCode: "",
        wonAt: item.award_time,
      })) || []
    );
  }, [histories]);
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                Lịch sử bốc số & trúng thưởng
              </CardTitle>
              <CardDescription>
                Tìm kiếm, lọc, thêm thủ công, xuất CSV. Chuyển tab để xem{" "}
                <b>tham gia</b> hoặc <b>trúng thưởng</b>.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {/* <Button
                variant="outline"
                className="gap-2"
                onClick={() => exportToCsv(filtered)}
              >
                <Download className="h-4 w-4" /> Xuất CSV
              </Button> */}
              {/* <Button
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
              </Button> */}
              {/* 
              <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" /> Thêm bản ghi
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Thêm tham gia / trúng thưởng</DialogTitle>
                    <DialogDescription>
                      Điền thông tin và lưu.
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
                          {[
                            ...new Set([
                              ...PROGRAMS.map((p) => p.name),
                              ...programs,
                            ]),
                          ].map((p) => (
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
                          <SelectValue placeholder="(tuỳ chọn) chọn nếu đã trúng" />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIZES.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-2">
                      <Label className="col-span-1 text-sm text-muted-foreground">
                        Thời gian bốc số
                      </Label>
                      <Input
                        className="col-span-3"
                        type="datetime-local"
                        value={fDateDraw}
                        onChange={(e) => setFDateDraw(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-2">
                      <Label className="col-span-1 text-sm text-muted-foreground">
                        Thời gian trúng
                      </Label>
                      <Input
                        className="col-span-3"
                        type="datetime-local"
                        value={fDateWin}
                        onChange={(e) => setFDateWin(e.target.value)}
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
                        placeholder="(tuỳ chọn) ví dụ: đã gọi xác nhận..."
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
              </Dialog> */}
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 gap-2 grid grid-cols-1 sm:grid-cols-2 lg:flex">
            <div className="relative w-full">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm theo tên, SĐT, giải thưởng, mã CT..."
                className="pl-9"
              />
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>

            <Select value={program} onValueChange={setProgram}>
              <SelectTrigger className="w-full lg:w-[220px]">
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

            <Select value={prize} onValueChange={setPrize}>
              <SelectTrigger className="w-full lg:w-[220px]">
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

            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="gap-2"
                onClick={() => quickRange("today")}
              >
                <Filter className="h-4 w-4" /> Hôm nay
              </Button>
              <Button variant="secondary" onClick={() => quickRange("7d")}>
                7 ngày
              </Button>
              <Button variant="secondary" onClick={() => quickRange("month")}>
                Tháng này
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={resetFilters}
              >
                <RotateCcw className="h-4 w-4" /> Xoá lọc
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Quick stats */}
        <CardContent className="pb-0">
          <div className="grid gap-3 md:grid-cols-3">
            <Card className="border-dashed">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">
                  Tổng số lượt tham gia
                </div>
                <div className="mt-1 text-2xl font-semibold">
                  {totalParticipations}
                </div>
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">
                  Tổng số may mắn bốc
                </div>
                <div className="mt-1 text-2xl font-semibold">
                  {totalLuckyNumbers}
                </div>
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">
                  Grid view giải (click để lọc)
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {prizeSummary.slice(0, 8).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => onPickPrize(k)}
                      title="Lọc theo giải"
                      className="rounded-full ring-1 ring-border px-2.5 py-1 text-xs hover:bg-muted"
                    >
                      <span className={cn("mr-1 inline-flex")}>
                        <Badge
                          variant={prizeVariant(k)}
                          className="rounded-full"
                        >
                          {k}
                        </Badge>
                      </span>
                      <span className="text-muted-foreground">({v})</span>
                    </button>
                  ))}
                  {prizeSummary.length === 0 && (
                    <span className="text-xs text-muted-foreground">
                      Chưa có dữ liệu trúng
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>

        <Separator />

        {/* Tabs */}
        <CardContent className="pt-4">
          <Tabs
            value={tab}
            onValueChange={(v) => {
              const key = v as TabKey;
              setTab(key);
              setPage(pageCache[key] ?? 1);
            }}
            className="w-full"
          >
            <TabsList className="flex flex-wrap gap-1 rounded-2xl bg-muted/40 p-1">
              <TabsTrigger
                value="participants"
                className="rounded-xl px-3 py-2 data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border"
                onClick={() =>
                  setPageCache((m) => ({ ...m, participants: page }))
                }
              >
                Danh sách tham gia
              </TabsTrigger>
              <TabsTrigger
                value="winners"
                className="rounded-xl px-3 py-2 data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border"
                onClick={() => setPageCache((m) => ({ ...m, winners: page }))}
              >
                Danh sách trúng thưởng
              </TabsTrigger>
            </TabsList>

            <TabsContent value="participants" className="mt-4">
              <DataTable
                rows={visible}
                totalFiltered={filtered.length}
                totalAll={baseList.length}
                page={safePage}
                pageSize={pageSize}
                maxPage={maxPage}
                onPage={(p) => setPage(p)}
                onPageSize={(n) => {
                  setPageSize(n);
                  setPage(1);
                }}
                toggleSort={toggleSort}
                sortBy={sortBy}
                sortDir={sortDir}
                hidePhone={hidePhone}
                programCodes={programCodes}
                mode="participants"
                copyToClipboard={copyToClipboard}
                newestWithin24h={newestWithin24h}
              />
            </TabsContent>

            <TabsContent value="winners" className="mt-4">
              <DataTable
                rows={visible}
                totalFiltered={filtered.length}
                totalAll={baseList.length}
                page={safePage}
                pageSize={pageSize}
                maxPage={maxPage}
                onPage={(p) => setPage(p)}
                onPageSize={(n) => {
                  setPageSize(n);
                  setPage(1);
                }}
                toggleSort={toggleSort}
                sortBy={sortBy}
                sortDir={sortDir}
                hidePhone={hidePhone}
                programCodes={programCodes}
                mode="winners"
                copyToClipboard={copyToClipboard}
                newestWithin24h={newestWithin24h}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// ---------------------- Table (reusable cho 2 tab) ----------------------
function DataTable(props: {
  rows: HistoryRow[];
  totalFiltered: number;
  totalAll: number;
  page: number;
  pageSize: number;
  maxPage: number;
  onPage: (p: number) => void;
  onPageSize: (n: number) => void;
  sortBy: SortKey;
  sortDir: SortDir;
  toggleSort: (key: SortKey) => void;
  hidePhone: boolean;
  programCodes: Map<string, string>;
  mode: "participants" | "winners";
  copyToClipboard: (text: string) => void;
  newestWithin24h: (iso?: string) => boolean;
}) {
  const {
    rows,
    totalFiltered,
    totalAll,
    page,
    pageSize,
    maxPage,
    onPage,
    onPageSize,
    sortBy,
    sortDir,
    toggleSort,
    hidePhone,
    programCodes,
    mode,
    copyToClipboard,
    newestWithin24h,
  } = props;

  const headerCell = (label: string, key: SortKey, extra?: string) => (
    <TableHead
      className={cn("cursor-pointer select-none", extra)}
      onClick={() => toggleSort(key)}
    >
      <div className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown
          className={cn(
            "h-3.5 w-3.5 opacity-60",
            sortBy === key ? (sortDir === "asc" ? "rotate-180" : "") : ""
          )}
        />
      </div>
    </TableHead>
  );

  return (
    <div className="space-y-4 w-[calc(100vw-350px)]">
      <ScrollArea className="h-[520px] rounded-md border">
        <Table className="text-sm">
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow className="[&>th]:h-10 [&>th]:px-3">
              <TableHead className="w-10 text-center">#</TableHead>
              {headerCell("Chương trình", "program")}
              {headerCell("Số quay thưởng", "idCard", "w-[90px]")}
              {headerCell("Tên khách hàng", "name")}
              {headerCell("Số điện thoại", "phone")}
              {headerCell("Thời gian bốc số", "drawAt", "w-[200px]")}
              {headerCell("Thời gian trúng thưởng", "wonAt", "w-[200px]")}
              <TableHead className="w-[72px] text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="[&>tr:nth-child(even)]:bg-muted/30">
            {rows.map((r, idx) => (
              <TableRow
                key={r.id}
                className="[&>td]:px-3 [&>td]:py-2 hover:bg-muted/50"
              >
                <TableCell className="text-center">
                  {(page - 1) * pageSize + idx + 1}
                </TableCell>

                <TableCell className="truncate max-w-[220px]">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{r.program}</span>
                    {r.prize && r.wonAt && (
                      <Badge
                        variant={prizeVariant(r.prize)}
                        className="rounded-full"
                      >
                        {r.prize}
                      </Badge>
                    )}
                  </div>
                </TableCell>

                <TableCell className="font-mono">{r.idCard}</TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px]">
                      {(r.name && r.name[0]) || "?"}
                    </div>
                    <div>
                      {r.name?.trim() ? (
                        r.name
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                      {(mode === "participants"
                        ? newestWithin24h(r.drawAt)
                        : newestWithin24h(r.wonAt)) && (
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

                <TableCell>{formatDateTime(r.drawAt)}</TableCell>
                <TableCell>{formatDateTime(r.wonAt)}</TableCell>

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => navigator.clipboard.writeText(r.phone)}
                      >
                        <Copy className="mr-2 h-4 w-4" /> Sao chép SĐT
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => alert(JSON.stringify(r, null, 2))}
                      >
                        <Info className="mr-2 h-4 w-4" /> Xem chi tiết
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}

            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} className="h-[120px] text-center">
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Không có dữ liệu phù hợp
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          Hiển thị <span className="font-medium">{rows.length}</span> /{" "}
          <span className="font-medium">{totalFiltered}</span> kết quả
          {totalFiltered !== totalAll && <> (tổng {totalAll})</>}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span>Kích thước trang</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => onPageSize(Number(v))}
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
              disabled={page <= 1}
              onClick={() => onPage(Math.max(1, page - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[120px] text-center text-sm">
              Trang <span className="font-medium">{page}</span> / {maxPage}
            </div>
            <Button
              size="icon"
              variant="outline"
              disabled={page >= maxPage}
              onClick={() => onPage(Math.min(maxPage, page + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HistoryPage;
