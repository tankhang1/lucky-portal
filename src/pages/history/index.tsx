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
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  MoreHorizontal,
  Copy,
  Info,
  Trash2,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  useGetProgramLuckyHistory,
  useSearchProgram,
  // Assuming you have a delete/update mutation hook. If not, this is a placeholder.
} from "@/react-query/queries/program/program";
import { toast } from "react-toastify"; // Assuming you use toastify
import { queryClient } from "@/main"; // Adjust path to your queryClient
import QUERY_KEY from "@/constants/key"; // Adjust path to your query keys

// ---------------------- Types ----------------------
type HistoryRow = {
  id: string; // The specific Lucky Number ID
  id_program: number; // Needed for API calls usually
  name?: string;
  phone: string;
  prize: string;
  program: string;
  programCode?: string;
  wonAt?: string;
  drawAt: string;
  address?: string;
  idCard?: string;
  note?: string;
};

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
  if (isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
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
  if (!p) return "outline";
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
  // data
  const [rows, setRows] = useState<HistoryRow[]>([]);

  // filters
  const [q, setQ] = useState("");
  const [program, setProgram] = useState<{ name: string; code: string } | null>(
    null
  );
  const [prize, setPrize] = useState<string>("all");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  // sorting
  const [sortBy, setSortBy] = useState<SortKey>("drawAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // paging
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 2. Fetch Data with Filters
  const { data: listProgram } = useSearchProgram({ k: "" });

  // Pass the search (k), program code (c), and prize (g) to the backend
  const { data: histories, isLoading } = useGetProgramLuckyHistory({
    c: program?.code || "",
    g: prize === "all" ? "" : prize,
    k: q,
  });

  // phone mask
  const [hidePhone, setHidePhone] = useState(false);

  // tabs
  const [tab, setTab] = useState<TabKey>("participants");

  // options
  const programs = useMemo(
    () =>
      listProgram?.map((item) => ({
        name: item.name,
        code: item.code,
      })),
    [listProgram]
  );

  const prizes = useMemo(
    () => Array.from(new Set(rows.map((r) => r.prize).filter(Boolean))),
    [rows]
  );

  // ---------------------- Handlers ----------------------

  const totalParticipations = rows.length;
  const totalLuckyNumbers = rows.reduce((acc) => acc + 1, 0);
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

  // Client-side Filtering + Sorting
  // We keep Date filtering client-side for flexibility
  const filtered = useMemo(() => {
    let list = baseList.filter((r) => {
      // Date Logic
      const dateToCheck = tab === "winners" ? r.wonAt : r.drawAt;
      const ymd = toYMD(dateToCheck || "");
      const okFrom = !from || ymd >= from;
      const okTo = !to || ymd <= to;

      return okFrom && okTo;
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
  }, [baseList, from, to, sortBy, sortDir, tab]);

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
    setProgram(null);
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
      toast.success("Đã sao chép SĐT");
    } catch {}
  };

  const newestWithin24h = (iso?: string) =>
    iso ? Date.now() - new Date(iso).getTime() < 24 * 3600_000 : false;

  const onPickPrize = (name: string) => {
    setPrize(name || "all");
    setTab("winners");
  };

  // 3. Sync API data to State
  useEffect(() => {
    if (!histories || !listProgram) return;

    setRows(
      histories.map((item: any, index: number) => ({
        id: item.id || index.toString(),
        id_program: item.id_program,
        drawAt: item.time,
        phone: item.consumer_phone,
        prize: item.award_name || "",
        program: program?.name || item.program_name || "", // Fallback if API returns program name
        address: item.address || "",
        idCard: item.number.toString(),
        name: item.consumer_name,
        note: "",
        programCode: program?.code || "",
        wonAt: item.award_time,
      }))
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
                Tìm kiếm, lọc, xem danh sách <b>tham gia</b> hoặc{" "}
                <b>trúng thưởng</b>.
              </CardDescription>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 gap-2 grid grid-cols-1 sm:grid-cols-2 lg:flex flex-wrap items-end">
            <div className="relative w-full lg:w-auto lg:flex-1 min-w-[200px]">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm theo tên, SĐT, giải thưởng, mã CT..."
                className="pl-9"
              />
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>

            <Select
              value={program?.code || "all"}
              onValueChange={(v) => {
                if (v === "all") setProgram(null);
                else {
                  const p = programs?.find((i) => i.code === v);
                  if (p) setProgram(p);
                }
              }}
            >
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="Chương trình">
                  {program ? program.name : "Tất cả chương trình"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả chương trình</SelectItem>
                {programs?.map((p) => (
                  <SelectItem key={p.code} value={p.code}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={prize} onValueChange={setPrize}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="Giải thưởng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả giải thưởng</SelectItem>
                {/* Dynamically filter prizes based on available data or hardcode standard ones */}
                {prizes.length > 0 ? (
                  prizes.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-xs text-muted-foreground text-center">
                    Chưa có giải thưởng
                  </div>
                )}
              </SelectContent>
            </Select>

            {/* Date Inputs */}
            <div className="flex items-center gap-2 w-full lg:w-auto">
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full lg:w-[140px]"
                title="Từ ngày"
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full lg:w-[140px]"
                title="Đến ngày"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                variant="secondary"
                size="sm"
                className="gap-2"
                onClick={() => quickRange("today")}
              >
                <Filter className="h-3.5 w-3.5" /> Hôm nay
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => quickRange("7d")}
              >
                7 ngày
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={resetFilters}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Quick stats */}
        <CardContent className="pb-0">
          <div className="grid gap-3 md:grid-cols-3">
            <Card className="border-dashed shadow-none">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">
                  Tổng lượt tham gia
                </div>
                <div className="mt-1 text-2xl font-semibold">
                  {isLoading ? "..." : totalParticipations}
                </div>
              </CardContent>
            </Card>
            <Card className="border-dashed shadow-none">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">
                  Tổng mã dự thưởng
                </div>
                <div className="mt-1 text-2xl font-semibold">
                  {isLoading ? "..." : totalLuckyNumbers}
                </div>
              </CardContent>
            </Card>
            <Card className="border-dashed shadow-none">
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">
                  Phân bố giải thưởng
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {prizeSummary.slice(0, 8).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => onPickPrize(k)}
                      title="Lọc theo giải này"
                      className="rounded-full ring-1 ring-border px-2.5 py-1 text-xs hover:bg-muted transition-colors"
                    >
                      <span className={cn("mr-1 inline-flex")}>
                        <Badge
                          variant={prizeVariant(k)}
                          className="rounded-full px-1.5 py-0 text-[10px] h-4"
                        >
                          {k}
                        </Badge>
                      </span>
                      <span className="text-muted-foreground font-medium">
                        ({v})
                      </span>
                    </button>
                  ))}
                  {prizeSummary.length === 0 && (
                    <span className="text-xs text-muted-foreground">
                      Chưa có dữ liệu trúng thưởng
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>

        <Separator className="my-4" />

        {/* Tabs */}
        <CardContent className="pt-0">
          <Tabs
            value={tab}
            onValueChange={(v) => {
              const key = v as TabKey;
              setTab(key);
              setPage(pageCache[key] ?? 1);
            }}
            className="w-full"
          >
            <TabsList className="flex flex-wrap gap-1 rounded-lg bg-muted/40 p-1 w-fit">
              <TabsTrigger
                value="participants"
                className="px-4 py-2"
                onClick={() =>
                  setPageCache((m) => ({ ...m, participants: page }))
                }
              >
                Danh sách tham gia
              </TabsTrigger>
              <TabsTrigger
                value="winners"
                className="px-4 py-2"
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

// ---------------------- Table (reusable) ----------------------
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
    <div className="space-y-4 w-full">
      <ScrollArea className="h-[520px] rounded-md border">
        <Table className="text-sm">
          <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
            <TableRow className="[&>th]:h-10 [&>th]:px-3">
              <TableHead className="w-10 text-center">#</TableHead>
              {headerCell("Chương trình", "program")}
              {headerCell("Số quay thưởng", "idCard", "w-[110px]")}
              {headerCell("Tên khách hàng", "name")}
              {headerCell("Số điện thoại", "phone")}
              {headerCell("Thời gian tham gia", "drawAt", "w-[180px]")}
              {headerCell("Thời gian trúng", "wonAt", "w-[180px]")}
              <TableHead className="w-[60px] text-right">#</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="[&>tr:nth-child(even)]:bg-muted/30">
            {rows.map((r, idx) => (
              <TableRow
                key={r.id}
                className="[&>td]:px-3 [&>td]:py-2 hover:bg-muted/50"
              >
                <TableCell className="text-center text-muted-foreground">
                  {(page - 1) * pageSize + idx + 1}
                </TableCell>

                <TableCell className="truncate max-w-[200px]">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-xs md:text-sm">
                      {r.program}
                    </span>
                    {r.prize && r.wonAt && (
                      <span className="flex">
                        <Badge
                          variant={prizeVariant(r.prize)}
                          className="rounded-sm px-1.5 py-0 text-[10px] font-normal"
                        >
                          {r.prize}
                        </Badge>
                      </span>
                    )}
                  </div>
                </TableCell>

                <TableCell className="font-mono">{r.idCard}</TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                      {(r.name && r.name[0]) || "?"}
                    </div>
                    <div className="flex flex-col">
                      <span>{r.name?.trim() || "—"}</span>
                      {(mode === "participants"
                        ? newestWithin24h(r.drawAt)
                        : newestWithin24h(r.wonAt)) && (
                        <span className="text-[10px] text-green-600 font-medium">
                          Mới
                        </span>
                      )}
                    </div>
                  </div>
                </TableCell>

                <TableCell className="font-mono">
                  <div className="flex items-center gap-1.5">
                    <span>{maskPhone(r.phone, hidePhone)}</span>
                    <TooltipProvider>
                      <Tooltip delayDuration={100}>
                        <TooltipTrigger asChild>
                          <button
                            className="rounded p-1 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => copyToClipboard(r.phone)}
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Sao chép SĐT</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>

                <TableCell className="text-muted-foreground text-xs md:text-sm">
                  {formatDateTime(r.drawAt)}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs md:text-sm">
                  {r.wonAt ? formatDateTime(r.wonAt) : "—"}
                </TableCell>

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => copyToClipboard(r.phone)}
                      >
                        <Copy className="mr-2 h-4 w-4" /> Sao chép SĐT
                      </DropdownMenuItem>
                      {/* Placeholder for detail view if you have a modal */}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}

            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="h-[120px] text-center">
                  <div className="flex flex-col items-center justify-center text-sm text-muted-foreground gap-2">
                    <Info className="h-8 w-8 opacity-20" />
                    <span>Không có dữ liệu phù hợp</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Footer Paging */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="text-sm text-muted-foreground">
          Hiển thị{" "}
          <span className="font-medium text-foreground">{rows.length}</span> /{" "}
          <span className="font-medium text-foreground">{totalFiltered}</span>{" "}
          kết quả
          {totalFiltered !== totalAll && <> (trong tổng số {totalAll})</>}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground hidden sm:inline">
              Hàng mỗi trang
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => onPageSize(Number(v))}
            >
              <SelectTrigger className="h-8 w-[70px]">
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

          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => onPage(Math.max(1, page - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[80px] text-center text-sm font-medium">
              {page} / {maxPage}
            </div>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
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
