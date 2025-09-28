import * as React from "react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  CalendarDays,
  Download,
  Filter,
  LineChart as LineChartIcon,
  MoreHorizontal,
  RefreshCcw,
  Search,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

// ---------------- Mock data helpers ----------------
const phones = ["090", "091", "092", "093", "094", "096", "097", "098", "099"];
const LAST_NAMES = [
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
const MID = [
  "Văn",
  "Thị",
  "Minh",
  "Anh",
  "Ngọc",
  "Quốc",
  "Tuấn",
  "Thanh",
  "Hải",
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
const rand = (n: number) => Math.floor(Math.random() * n);
const pick = <T,>(arr: T[]) => arr[rand(arr.length)];
const randomName = () => `${pick(LAST_NAMES)} ${pick(MID)} ${pick(MID)}`;
const randomPhone = () =>
  `${pick(phones)}${Array.from({ length: 7 }, () => rand(10)).join("")}`;
const PROGRAMS = [
  { code: "TET25", name: "Tết 2025 – Lì xì vui vẻ" },
  { code: "BD10", name: "Sinh nhật 10 năm" },
  { code: "VIP", name: "Tri ân khách VIP" },
];
const PRIZES = [
  { id: "p1", name: "E-voucher 50k", stock: 200 },
  { id: "p2", name: "Combo Tết", stock: 120 },
  { id: "p3", name: "Jackpot 5,000,000đ", stock: 3 },
  { id: "p4", name: "Xe đạp mini", stock: 12 },
];

function buildData(rows = 160) {
  const now = new Date();
  const start = new Date(now);
  start.setMonth(now.getMonth() - 1);
  const reg: any[] = []; // registrations / participants
  const winners: any[] = [];
  for (let i = 0; i < rows; i++) {
    const d = new Date(
      start.getTime() + Math.random() * (now.getTime() - start.getTime())
    );
    const prog = pick(PROGRAMS);
    const row = {
      id: crypto.randomUUID(),
      name: Math.random() > 0.08 ? randomName() : "",
      phone: randomPhone(),
      address: Math.random() > 0.8 ? "" : `Q.${rand(12) + 1}, TP.HCM`,
      idCard:
        Math.random() > 0.85
          ? ""
          : `0${Array.from({ length: 11 }, () => rand(10)).join("")}`,
      program: prog.name,
      programCode: prog.code,
      note: Math.random() > 0.9 ? "Ghi chú mẫu" : "",
      drawAt: d.toISOString(),
      winAt:
        Math.random() > 0.7
          ? new Date(d.getTime() + rand(3) * 3600_000).toISOString()
          : "",
      prize: "",
    };
    reg.push(row);
    if (row.winAt) {
      const prize = pick(PRIZES);
      winners.push({
        ...row,
        prize: prize.name,
        winAt: row.winAt,
      });
    }
  }
  // aggregate for charts (by date)
  const days: Record<
    string,
    { date: string; participants: number; winners: number }
  > = {};
  reg.forEach((r) => {
    const d = r.drawAt.slice(0, 10);
    if (!days[d]) days[d] = { date: d, participants: 0, winners: 0 };
    days[d].participants++;
  });
  winners.forEach((w) => {
    const d = w.winAt.slice(0, 10);
    if (!days[d]) days[d] = { date: d, participants: 0, winners: 0 };
    days[d].winners++;
  });
  const trend = Object.values(days).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
  // prize summary
  const prizeCount: Record<string, number> = {};
  winners.forEach((w) => {
    prizeCount[w.prize] = (prizeCount[w.prize] || 0) + 1;
  });

  return { reg, winners, trend, prizeCount };
}

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("vi-VN", { dateStyle: "medium" });

// ---------------- Dashboard ----------------
export default function DashboardPage() {
  const [data] = useState(() => buildData(200));
  const [tab, setTab] = useState<"participants" | "winners">("participants");
  const [q, setQ] = useState("");
  const [program, setProgram] = useState<string>("all");
  const [prizeFilter, setPrizeFilter] = useState<string>("all");
  const [hidePhone, setHidePhone] = useState(false);

  const participants = data.reg;
  const winners = data.winners;

  const totalParticipants = participants.length;
  const totalLuckyNumbers = useMemo(
    () => participants.length + winners.length,
    [participants, winners]
  );

  const prizeSummary = useMemo(
    () => Object.entries(data.prizeCount).sort((a, b) => b[1] - a[1]),
    [data]
  );

  const rows = tab === "participants" ? participants : winners;

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return rows.filter((r) => {
      const okQ =
        !ql ||
        [
          r.name || "",
          r.phone,
          r.program,
          r.programCode,
          r.prize || "",
          r.address || "",
          r.idCard || "",
          r.note || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(ql);
      const okProgram =
        program === "all" || r.programCode === program || r.program === program;
      const okPrize =
        tab === "winners"
          ? prizeFilter === "all" || r.prize === prizeFilter
          : true;
      return okQ && okProgram && okPrize;
    });
  }, [rows, q, program, prizeFilter, tab]);

  // auto min width based on columns -> set Tailwind min-w and provide horizontal scroll
  const tableMinW = tab === "participants" ? 1200 : 1100;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Tổng quan chương trình</h1>
          <p className="text-sm text-muted-foreground">
            Dashboard theo dõi tham gia & trúng thưởng
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => window.location.reload()}
          >
            <RefreshCcw className="h-4 w-4" /> Tải lại
          </Button>
          <Button className="gap-2">
            <Download className="h-4 w-4" /> Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">
              Tổng số tham gia
            </div>
            <div className="mt-1 text-2xl font-semibold">
              {totalParticipants}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Trong 30 ngày qua
            </p>
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
            <p className="text-xs text-muted-foreground mt-1">
              Bao gồm số trúng và không trúng
            </p>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">
              Số người trúng thưởng
            </div>
            <div className="mt-1 text-2xl font-semibold">{winners.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tỷ lệ{" "}
              {(
                (winners.length / Math.max(1, participants.length)) *
                100
              ).toFixed(1)}
              %
            </p>
          </CardContent>
        </Card>
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">
              Giải phát ra (Top)
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {prizeSummary.slice(0, 3).map(([k, v]) => (
                <Badge
                  key={k}
                  variant={/jackpot/i.test(k) ? "destructive" : "default"}
                  className="rounded-full"
                >
                  {k}: {v}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-3 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <LineChartIcon className="h-4 w-4" />
              Xu hướng theo ngày
            </CardTitle>
            <CardDescription>Tham gia vs trúng thưởng</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.trend}
                margin={{ left: 8, right: 8, top: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => d.slice(5)}
                  fontSize={12}
                />
                <YAxis allowDecimals={false} fontSize={12} />
                <RTooltip
                  formatter={(v: any) => [v, ""]}
                  labelFormatter={(l) => fmtDate(l as string)}
                />
                <Line
                  type="monotone"
                  dataKey="participants"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="winners"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Phân bố theo giải</CardTitle>
            <CardDescription>Top giải được trúng</CardDescription>
          </CardHeader>
          <CardContent className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={prizeSummary.map(([k, v]) => ({ name: k, value: v }))}
                margin={{ left: 8, right: 8, top: 10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tickFormatter={(v) => String(v).slice(0, 8)}
                  fontSize={12}
                />
                <YAxis allowDecimals={false} fontSize={12} />
                <RTooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Danh sách</CardTitle>
              <CardDescription>
                Chia 2 tab: Tham gia & Trúng thưởng
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-[220px]">
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Tìm theo tên / SĐT / CT / giải..."
                  className="pl-8"
                />
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>
              <Select value={program} onValueChange={setProgram}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Chương trình" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả CT</SelectItem>
                  {PROGRAMS.map((p) => (
                    <SelectItem key={p.code} value={p.code}>
                      {p.code} – {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {tab === "winners" && (
                <Select value={prizeFilter} onValueChange={setPrizeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Giải thưởng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả giải</SelectItem>
                    {Object.keys(data.prizeCount).map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                variant={hidePhone ? "default" : "outline"}
                onClick={() => setHidePhone((v) => !v)}
              >
                {hidePhone ? "Hiện SĐT" : "Ẩn SĐT"}
              </Button>
            </div>
          </div>

          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as any)}
            className="mt-3"
          >
            <TabsList className="rounded-2xl bg-muted/40 p-1">
              <TabsTrigger
                value="participants"
                className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow"
              >
                Danh sách tham gia
              </TabsTrigger>
              <TabsTrigger
                value="winners"
                className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow"
              >
                Danh sách trúng thưởng
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <Separator />

        <CardContent className="pt-4">
          <div className="rounded-md border">
            {/* Horizontal scroll + auto min width */}
            <ScrollArea className="w-full">
              <div className={cn("min-w-[" + tableMinW + "]")}></div>
              <Table className={cn("text-sm min-w-[" + tableMinW + "]")}>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow className="[&>th]:h-10 [&>th]:px-3">
                    <TableHead className="w-10 text-center">#</TableHead>
                    <TableHead>Chương trình</TableHead>
                    <TableHead className="w-[100px]">Mã</TableHead>
                    <TableHead>Tên khách hàng</TableHead>
                    <TableHead>Số điện thoại</TableHead>
                    <TableHead>Địa chỉ</TableHead>
                    <TableHead>Căn cước</TableHead>
                    <TableHead>Ghi chú</TableHead>
                    <TableHead>Thời gian bốc số</TableHead>
                    {tab === "winners" && (
                      <TableHead>Thời gian trúng</TableHead>
                    )}
                    {tab === "winners" && <TableHead>Giải</TableHead>}
                    <TableHead className="w-[60px] text-right">…</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="[&>tr:nth-child(even)]:bg-muted/30">
                  {filtered.map((r, i) => (
                    <TableRow
                      key={(r as any).id}
                      className="[&>td]:px-3 [&>td]:py-2"
                    >
                      <TableCell className="text-center">{i + 1}</TableCell>
                      <TableCell className="truncate max-w-[260px]">
                        {r.program}
                      </TableCell>
                      <TableCell>{r.programCode}</TableCell>
                      <TableCell className="font-medium">
                        {r.name?.trim() || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono">
                        {hidePhone ? maskPhone(r.phone) : r.phone}
                      </TableCell>
                      <TableCell className="truncate max-w-[240px]">
                        {r.address || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="truncate max-w-[160px]">
                        {r.idCard || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="truncate max-w-[200px]">
                        {r.note || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>{fmtDateTime(r.drawAt)}</TableCell>
                      {tab === "winners" && (
                        <TableCell>
                          {r.winAt ? fmtDateTime(r.winAt) : "—"}
                        </TableCell>
                      )}
                      {tab === "winners" && (
                        <TableCell>
                          <Badge
                            variant={
                              /jackpot/i.test(r.prize)
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {r.prize}
                          </Badge>
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() =>
                                navigator.clipboard.writeText(r.phone)
                              }
                            >
                              Sao chép SĐT
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => alert(JSON.stringify(r, null, 2))}
                            >
                              Xem chi tiết
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={tab === "winners" ? 12 : 11}
                        className="h-[120px] text-center text-sm text-muted-foreground"
                      >
                        Không có dữ liệu
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function maskPhone(s: string) {
  if (s.length < 4) return "****";
  const tail = s.slice(-3);
  return "●".repeat(Math.max(0, s.length - 3)) + tail;
}
