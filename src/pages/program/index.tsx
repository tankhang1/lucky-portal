import React, { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { z } from "zod";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Trash2,
  Upload,
  ListChecks,
  Sparkles,
  Image as ImageIcon,
  Search,
  Copy,
  Eye,
  Download,
  UploadCloud,
  Save,
  Pencil,
  MoreHorizontal,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IconDotsVertical } from "@tabler/icons-react";

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const prizeSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  image: z.string().optional().or(z.literal("")).optional(),
  stock: z.number().int().nonnegative().default(0),
  note: z.string().optional().default(""),
});

const normalPrizeSchema = z
  .object({
    prizeId: z.string(),
    quantity: z.number().int().positive(),
    min: z.number().int().nonnegative().default(0),
    max: z.number().int().nonnegative().default(0),
    defaultDrawsPerNumber: z.number().int().nonnegative().default(0),
  })
  .refine((r) => r.min <= r.max, { message: "Min phải <= Max" });

const rangeSchema = z
  .object({
    min: z.number().int().nonnegative(),
    max: z.number().int().nonnegative(),
    defaultDrawsPerNumber: z.number().int().nonnegative().default(0),
    overrides: z
      .array(
        z.object({
          number: z.number().int().nonnegative(),
          draws: z.number().int().nonnegative(),
        })
      )
      .default([]),
  })
  .refine((r) => r.min <= r.max, { message: "Min phải <= Max" });

const programSchema = z.object({
  id: z.string(),
  programName: z.string().min(1, "Nhập tên chương trình"),
  image: z.string().optional().default(""),
  enabled: z.boolean().default(true),
  prizes: z.array(prizeSchema).default([]),
  normalPrizes: z.array(normalPrizeSchema).default([]),
  ranges: z.array(rangeSchema).default([]), // giữ để tương thích (không dùng UI)
  specialNumbers: z
    .array(
      z.object({
        value: z.number().int().nonnegative(),
        prize: z.string().min(1).optional(),
        number: z.number().int().nonnegative().optional(), // giữ để tương thích (không dùng UI)
        draws: z.number().int().nonnegative().optional(), // giữ để tương thích (không dùng UI)
        prizeId: z.string().optional(),
      })
    )
    .default([]),
});

type Prize = z.infer<typeof prizeSchema>;
type NormalPrize = z.infer<typeof normalPrizeSchema>;
type RangeRule = z.infer<typeof rangeSchema>;
type Program = z.infer<typeof programSchema>;
type CustomerRow = {
  index: number;
  name?: string;
  phone: string;
  attempts: number;
};
type Issue = { level: "error" | "warning"; message: string };

const parseCustomersCsv = async (file: File): Promise<CustomerRow[]> => {
  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const split = (s: string) => s.split(/,|;|\t/).map((x) => x.trim());
  const headerRaw = split(lines[0]).map((h) => h.toLowerCase());

  const nameKeys = [
    "name",
    "customer_name",
    "ten",
    "họ tên",
    "ho_ten",
    "full_name",
  ];
  const phoneKeys = [
    "phone",
    "sdt",
    "so_dien_thoai",
    "so",
    "number",
    "số điện thoại",
  ];
  const attemptsKeys = [
    "attempts",
    "luot",
    "tries",
    "số lượt quay",
    "luot_quay",
  ];

  const nameIdx = headerRaw.findIndex((h) => nameKeys.includes(h));
  const phoneIdx = headerRaw.findIndex((h) => phoneKeys.includes(h));
  const attemptsIdx = headerRaw.findIndex((h) => attemptsKeys.includes(h));

  const looksLikeHeader = phoneIdx >= 0 || attemptsIdx >= 0 || nameIdx >= 0;

  const rows: CustomerRow[] = [];
  let idx = 1;

  for (let i = looksLikeHeader ? 1 : 0; i < lines.length; i++) {
    const cols = split(lines[i]);

    let name = "";
    let phone = "";
    let attempts = 0;

    if (looksLikeHeader) {
      name = nameIdx >= 0 ? cols[nameIdx] || "" : "";
      phone = phoneIdx >= 0 ? cols[phoneIdx] || "" : cols[0] || "";
      attempts = attemptsIdx >= 0 ? Number(cols[attemptsIdx] || 0) : 0;
    } else {
      if (cols.length >= 3) {
        name = cols[0] || "";
        phone = cols[1] || "";
        attempts = Number(cols[2] || 0) || 0;
      } else if (cols.length === 2) {
        name = "";
        phone = cols[0] || "";
        attempts = Number(cols[1] || 0) || 0;
      } else {
        name = "";
        phone = cols[0] || "";
        attempts = 0;
      }
    }

    const normPhone = (phone || "").replace(/[^\d+]/g, "");
    if (!normPhone) continue;

    rows.push({
      index: idx++,
      name: name?.trim() ? name.trim() : undefined,
      phone: normPhone,
      attempts: Number.isFinite(attempts) ? attempts : 0,
    });
  }

  return rows;
};

const defaultPrograms = (): Program[] => [
  {
    id: crypto.randomUUID(),
    programName: "Tết 2025 – Lì xì vui vẻ",
    image: "https://img.lovepik.com/photo/40079/9618.jpg_wh860.jpg",
    enabled: true,
    prizes: [
      {
        id: "p-evoucher",
        name: "E-voucher",
        image: "",
        stock: 1000,
        note: "Mỗi mã trị giá 50,000đ",
      },
      {
        id: "p-combo-tet",
        name: "Combo Tết",
        image: "",
        stock: 200,
        note: "Combo bao gồm nhiều sản phẩm",
      },
      {
        id: "p-jackpot",
        name: "Jackpot 5,000,000đ",
        image: "",
        stock: 5,
        note: "Giải đặc biệt",
      },
    ],
    normalPrizes: [
      {
        prizeId: "p-evoucher",
        quantity: 500,
        min: 0,
        max: 99,
        defaultDrawsPerNumber: 1,
      },
      {
        prizeId: "p-combo-tet",
        quantity: 50,
        min: 100,
        max: 199,
        defaultDrawsPerNumber: 2,
      },
    ],
    ranges: [],
    specialNumbers: [
      { value: 7777, prizeId: "p-jackpot" },
      { value: 2025, prizeId: "p-combo-tet" },
    ],
  },
  {
    id: crypto.randomUUID(),
    programName: "Sinh nhật 10 năm",
    image: "https://img.lovepik.com/photo/40079/9618.jpg_wh860.jpg",
    enabled: false,
    prizes: [
      {
        id: "p-birthday-kit",
        name: "Bộ quà sinh nhật",
        image: "",
        stock: 300,
        note: "Bộ quà sinh nhật đặc biệt",
      },
      {
        id: "p-10yrs",
        name: "Bộ quà 10 năm",
        image: "",
        stock: 100,
        note: "Bộ quà kỷ niệm 10 năm",
      },
    ],
    normalPrizes: [
      {
        prizeId: "p-birthday-kit",
        quantity: 150,
        min: 10,
        max: 99,
        defaultDrawsPerNumber: 1,
      },
    ],
    ranges: [],
    specialNumbers: [{ value: 1010, prizeId: "p-10yrs" }],
  },
];

const defaultCustomers: CustomerRow[] = [
  { index: 1, name: "Nguyen Van A", phone: "0901111222", attempts: 2 },
  { index: 2, name: "Tran B", phone: "+84903111222", attempts: 1 },
  { index: 3, name: "Le C", phone: "0987654321", attempts: 3 },
  { index: 4, name: "", phone: "0912345678", attempts: 1 },
  { index: 5, phone: "+84345678901", attempts: 2 },
];

const coveredByRanges = (ranges: RangeRule[], n: number) =>
  ranges.some((r) => n >= r.min && n <= r.max);

const validateProgram = (p: Program): Issue[] => {
  const issues: Issue[] = [];
  const parsed = programSchema.safeParse(p);
  if (!parsed.success)
    parsed.error.issues.forEach((e) =>
      issues.push({ level: "error", message: e.message })
    );

  const specialSet = new Set<number>();
  p.specialNumbers.forEach((s) => {
    if (specialSet.has(s.value))
      issues.push({ level: "error", message: `Số đặc biệt trùng ${s.value}` });
    specialSet.add(s.value);
    if (coveredByRanges(p.ranges, s.value))
      issues.push({
        level: "warning",
        message: `Số đặc biệt ${s.value} nằm trong 1 range`,
      });
    if (s.prizeId && !p.prizes.some((pr) => pr.id === s.prizeId))
      issues.push({
        level: "error",
        message: `Số đặc biệt ${s.value} tham chiếu prizeId không tồn tại`,
      });
    if (!s.prizeId && !s.prize)
      issues.push({
        level: "error",
        message: `Số đặc biệt ${s.value} thiếu prize hoặc prizeId`,
      });
  });

  p.normalPrizes.forEach((np, idx) => {
    if (!p.prizes.some((pr) => pr.id === np.prizeId))
      issues.push({
        level: "error",
        message: `Giải thường #${idx + 1} tham chiếu prizeId không tồn tại`,
      });
    if (np.min > np.max)
      issues.push({
        level: "error",
        message: `Giải chung #${idx + 1}: min phải <= max`,
      });
  });

  return issues;
};

const validateAll = (programs: Program[], customers: CustomerRow[]) => {
  const programIssues: Record<string, Issue[]> = {};
  programs.forEach((p) => (programIssues[p.id] = validateProgram(p)));
  const customerIssues: Issue[] = [];
  customers.forEach((c) => {
    if (!/^\+?\d{8,15}$/.test(c.phone))
      customerIssues.push({
        level: "warning",
        message: `SĐT không hợp lệ: ${c.phone}`,
      });
    if (!Number.isInteger(c.attempts) || c.attempts < 0)
      customerIssues.push({
        level: "error",
        message: `Attempts phải là số nguyên >= 0 cho ${c.phone}`,
      });
  });
  const ok =
    Object.values(programIssues).every((arr) =>
      arr.every((i) => i.level !== "error")
    ) && customerIssues.every((i) => i.level !== "error");
  return { programIssues, customerIssues, ok };
};

function TableEmpty({
  colSpan,
  children,
}: {
  colSpan: number;
  children: React.ReactNode;
}) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-[88px] text-center">
        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <div className="text-sm">{children}</div>
        </div>
      </TableCell>
    </TableRow>
  );
}

function ActionIcon({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClick}
            className="h-8 w-8"
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function ProgramPage() {
  const [programs, setPrograms] = useState<Program[]>(defaultPrograms());
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState(programs[0].id);
  const [issues, setIssues] = useState<{
    programIssues: Record<string, Issue[]>;
    customerIssues: Issue[];
  } | null>(null);
  const [customers, setCustomers] = useState<CustomerRow[]>(defaultCustomers);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAttempts, setNewAttempts] = useState<string>("");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const excelRef = useRef<HTMLInputElement | null>(null);

  const [showPreview, setShowPreview] = useState(false);

  const activeProgram = useMemo(
    () => programs.find((p) => p.id === activeId)!,
    [programs, activeId]
  );
  const filteredPrograms = useMemo(
    () =>
      programs.filter((p) =>
        p.programName.toLowerCase().includes(search.toLowerCase())
      ),
    [programs, search]
  );

  const setActiveProgramPatch = (patch: Partial<Program>) =>
    setPrograms((prev) =>
      prev.map((p) => (p.id === activeId ? { ...p, ...patch } : p))
    );

  const addProgram = () => {
    const p: Program = {
      id: crypto.randomUUID(),
      programName: `Chương trình #${programs.length + 1}`,
      image: "",
      enabled: true,
      prizes: [],
      normalPrizes: [],
      ranges: [],
      specialNumbers: [],
    };
    setPrograms((x) => [...x, p]);
    setActiveId(p.id);
  };
  const duplicateProgram = (id: string) => {
    const src = programs.find((x) => x.id === id);
    if (!src) return;
    const cloned: Program = JSON.parse(JSON.stringify(src));
    cloned.id = crypto.randomUUID();
    cloned.programName = `${src.programName} (Copy)`;
    setPrograms((x) => [...x, cloned]);
    setActiveId(cloned.id);
  };
  const deleteProgram = (id: string) => {
    const next = programs.filter((p) => p.id !== id);
    setPrograms(next);
    if (next.length) setActiveId(next[0].id);
  };

  const addPrize = () =>
    setActiveProgramPatch({
      prizes: [
        ...activeProgram.prizes,
        { id: crypto.randomUUID(), name: "", image: "", stock: 0, note: "" },
      ],
    });
  const updatePrize = (i: number, patch: Partial<Prize>) => {
    const prizes = [...activeProgram.prizes];
    prizes[i] = { ...prizes[i], ...patch } as Prize;
    setActiveProgramPatch({ prizes });
  };
  const removePrize = (i: number) => {
    const prizes = [...activeProgram.prizes];
    const removed = prizes.splice(i, 1)[0];
    const normalPrizes = activeProgram.normalPrizes.filter(
      (n) => n.prizeId !== removed.id
    );
    const specialNumbers = activeProgram.specialNumbers.map((s) =>
      s.prizeId === removed.id ? { ...s, prizeId: undefined } : s
    );
    setActiveProgramPatch({ prizes, normalPrizes, specialNumbers });
  };

  const addNormalPrize = () => {
    if (!activeProgram.prizes.length) return;
    setActiveProgramPatch({
      normalPrizes: [
        ...activeProgram.normalPrizes,
        {
          prizeId: activeProgram.prizes[0].id,
          quantity: 1,
          min: 0,
          max: 0,
          defaultDrawsPerNumber: 0,
        },
      ],
    });
  };
  const updateNormalPrize = (i: number, patch: Partial<NormalPrize>) => {
    const arr = [...activeProgram.normalPrizes];
    arr[i] = { ...arr[i], ...patch } as NormalPrize;
    setActiveProgramPatch({ normalPrizes: arr });
  };
  const removeNormalPrize = (i: number) => {
    const arr = [...activeProgram.normalPrizes];
    arr.splice(i, 1);
    setActiveProgramPatch({ normalPrizes: arr });
  };

  const addSpecial = () =>
    setActiveProgramPatch({
      specialNumbers: [
        ...activeProgram.specialNumbers,
        { value: 0, prize: "", prizeId: undefined, number: 0, draws: 0 },
      ],
    });
  const updateSpecial = (
    idx: number,
    patch: Partial<Program["specialNumbers"][number]>
  ) => {
    const arr = [...activeProgram.specialNumbers];
    arr[idx] = { ...arr[idx], ...patch };
    setActiveProgramPatch({ specialNumbers: arr });
  };
  const removeSpecial = (idx: number) => {
    const arr = [...activeProgram.specialNumbers];
    arr.splice(idx, 1);
    setActiveProgramPatch({ specialNumbers: arr });
  };
  const handleCsvFiles = async (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    const rows = await parseCustomersCsv(f);
    setCustomers(rows);
  };

  const onDropCsv: React.DragEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault();
    await handleCsvFiles(e.dataTransfer.files);
  };

  const addOneCustomer = () => {
    const phone = newPhone.replace(/[^\d+]/g, "");
    const attempts = Number(newAttempts) || 0;
    if (!phone) return;
    setCustomers((prev) => [
      ...prev,
      {
        index: prev.length + 1,
        name: newName.trim() || undefined,
        phone,
        attempts,
      },
    ]);
    setNewName("");
    setNewPhone("");
    setNewAttempts("");
  };

  const canAdd = !!newPhone.replace(/[^\d+]/g, "");
  const runValidate = () => {
    const v = validateAll(programs, customers);
    setIssues({
      programIssues: v.programIssues,
      customerIssues: v.customerIssues,
    });
    if (v.ok) alert("✅ Dữ liệu hợp lệ");
  };

  const exportJson = () => {
    const data = JSON.stringify({ programs, customers }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prize-config.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importExcel = async (file: File) => {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const toRows = (name: string) =>
      XLSX.utils.sheet_to_json<any>(wb.Sheets[name] || {}, { defval: "" });

    const toBool = (v: any) =>
      String(v).trim().toLowerCase() === "true" ||
      v === 1 ||
      v === "1" ||
      v === true;

    const progRows = toRows("Programs");
    if (!progRows.length) {
      alert("Thiếu sheet 'Programs'");
      return;
    }

    const programById: Record<string, Program> = {};
    progRows.forEach((r: any, i: number) => {
      const id = String(r.id || crypto.randomUUID());
      programById[id] = {
        id,
        image: String(r.image || r.programImage || ""),
        programName: String(
          r.programName || r.name || `Chương trình #${i + 1}`
        ),
        enabled: toBool(r.enabled ?? true),
        prizes: [],
        normalPrizes: [],
        ranges: [],
        specialNumbers: [],
      };
    });

    const programsImported: Program[] = Object.values(programById);
    const firstId = programsImported[0]?.id;

    toRows("Prizes").forEach((r: any) => {
      const pid = String(r.programId || r.program_id || firstId);
      const p = programById[pid];
      if (!p) return;
      p.prizes.push({
        id: String(r.prizeId || r.id || crypto.randomUUID()),
        name: String(r.name || ""),
        image: r.image ? String(r.image) : "",
        stock: Number(r.stock ?? 0) || 0,
        note: r.note ? String(r.note) : "",
      });
    });

    toRows("NormalPrizes").forEach((r: any) => {
      const pid = String(r.programId || r.program_id || firstId);
      const p = programById[pid];
      if (!p) return;
      p.normalPrizes.push({
        prizeId: String(r.prizeId || r.prize_id || ""),
        quantity: Number(r.quantity ?? 1) || 1,
        min: Number(r.min ?? 0) || 0,
        max: Number(r.max ?? 0) || 0,
        defaultDrawsPerNumber:
          Number(r.defaultDrawsPerNumber ?? r.default ?? 0) || 0,
      });
    });

    toRows("Specials").forEach((r: any) => {
      const pid = String(r.programId || r.program_id || firstId);
      const p = programById[pid];
      if (!p) return;
      p.specialNumbers.push({
        value: Number(r.value ?? 0) || 0,
        prize: r.prize ? String(r.prize) : undefined,
        prizeId: r.prizeId ? String(r.prizeId) : undefined,
      });
    });

    const custRows = toRows("Customers");
    const importedCustomers: CustomerRow[] = custRows
      .map((r: any, idx: number) => ({
        index: Number(r.index ?? idx + 1),
        phone: String(r.phone || r.sdt || r.number || ""),
        attempts: Number(r.attempts ?? 0) || 0,
      }))
      .filter((r) => r.phone);

    setPrograms(programsImported);
    setCustomers(
      importedCustomers.length ? importedCustomers : defaultCustomers
    );
    if (programsImported[0]?.id) setActiveId(programsImported[0].id);
    else if (programsImported.length === 0)
      alert("Không có chương trình hợp lệ trong Excel");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-2xl font-semibold">
          <Sparkles className="h-6 w-6" /> Trình tạo chương trình giải thưởng
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={excelRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importExcel(f);
              if (e.currentTarget) e.currentTarget.value = "";
            }}
          />
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => excelRef.current?.click()}
          >
            <UploadCloud className="h-4 w-4" />
            Nhập Excel
          </Button>

          <Button variant="outline" className="gap-2" onClick={runValidate}>
            <ListChecks className="h-4 w-4" />
            Xác thực
          </Button>

          <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogTrigger asChild>
              <Button variant="secondary" className="gap-2">
                <Eye className="h-4 w-4" />
                Xem trước JSON
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Xem trước JSON</DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[420px] rounded border p-2">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify({ programs, customers }, null, 2)}
                </pre>
              </ScrollArea>
              <DialogFooter>
                <Button onClick={exportJson} className="gap-2">
                  <Download className="h-4 w-4" />
                  Xuất
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

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
            <CardDescription>Chọn, tìm kiếm, nhân bản hoặc xoá</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm chương trình..."
                className="pl-9"
              />
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
            <ScrollArea className="h-[520px] rounded border">
              <div className="p-2 space-y-2">
                {filteredPrograms.map((p) => {
                  const active = p.id === activeId;
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                        active
                          ? "shadow-sm border-primary/30"
                          : "hover:bg-muted/30"
                      }`}
                    >
                      <div
                        onClick={() => setActiveId(p.id)}
                        className="text-left cursor-pointer flex-1 py-2 space-y-2 px-1"
                      >
                        <div className="font-medium line-clamp-1">
                          {p.programName}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <Badge variant={p.enabled ? "default" : "secondary"}>
                            {p.enabled ? "Bật" : "Tắt"}
                          </Badge>
                          <span>Giải thưởng: {p.prizes.length}</span>
                          <span>Đặc biệt: {p.specialNumbers.length}</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <IconDotsVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => duplicateProgram(p.id)}
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
                            onClick={() => deleteProgram(p.id)}
                            className="flex items-center gap-2 text-red-600"
                          >
                            <Trash2
                              className="h-4 w-4"
                              color="oklch(57.7% 0.245 27.325)"
                            />
                            Xoá
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
                {filteredPrograms.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-10">
                    Không tìm thấy chương trình
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="lg:col-span-8 xl:col-span-9">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-4">
              {/* Thumbnail chương trình (kéo-thả để đổi ảnh) */}
              <div
                className="relative group"
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (!f || !f.type.startsWith("image/")) return;
                  if (f.size > 2 * 1024 * 1024) {
                    alert("Vui lòng chọn ảnh ≤ 2MB");
                    return;
                  }
                  setActiveProgramPatch({ image: await fileToDataUrl(f) });
                }}
              >
                <div className="h-14 w-20 overflow-hidden rounded-xl ring-1 ring-border bg-gradient-to-br from-muted/60 to-muted/20">
                  {activeProgram.image ? (
                    <img
                      src={activeProgram.image}
                      alt=""
                      className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="h-full w-full grid place-content-center text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <ImageIcon className="h-3 w-3" />
                        Ảnh chương trình
                      </div>
                    </div>
                  )}
                </div>

                {/* Overlay action */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute right-1 top-1 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={6}>
                    <DropdownMenuItem
                      className="flex items-center gap-2"
                      onClick={() =>
                        document.getElementById("program-image-input")?.click()
                      }
                    >
                      <Upload className="h-4 w-4" />
                      Tải ảnh mới
                    </DropdownMenuItem>

                    {activeProgram.image && (
                      <DropdownMenuItem>
                        <Dialog>
                          <DialogTrigger asChild>
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              Xem lớn
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <img
                              src={activeProgram.image}
                              alt=""
                              className="w-full h-auto rounded-xl object-contain"
                            />
                          </DialogContent>
                        </Dialog>
                      </DropdownMenuItem>
                    )}

                    {activeProgram.image && (
                      <DropdownMenuItem
                        className="flex items-center gap-2 text-red-600"
                        onClick={() => setActiveProgramPatch({ image: "" })}
                      >
                        <Trash2 className="h-4 w-4" />
                        Xoá ảnh
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* input file ẩn */}
                <input
                  id="program-image-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    if (f.size > 2 * 1024 * 1024) {
                      alert("Vui lòng chọn ảnh ≤ 2MB");
                      return;
                    }
                    setActiveProgramPatch({ image: await fileToDataUrl(f) });
                  }}
                />
              </div>

              {/* Tên chương trình – tối giản, không viền */}
              <Input
                value={activeProgram.programName}
                onChange={(e) =>
                  setActiveProgramPatch({ programName: e.target.value })
                }
                className="max-w-60"
                placeholder="Tên chương trình"
              />

              {/* Nút bên phải */}
              <div className="ml-auto flex items-center gap-2">
                <Button
                  size="sm"
                  variant={activeProgram.enabled ? "default" : "outline"}
                  className="min-w-[104px]"
                  onClick={() =>
                    setActiveProgramPatch({ enabled: !activeProgram.enabled })
                  }
                >
                  {activeProgram.enabled ? "Đang bật" : "Đang tắt"}
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => console.log({ programs, customers })}
                >
                  <Save className="h-4 w-4" />
                  Lưu
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="prizes" className="w-full">
              <TabsList className="flex flex-wrap gap-1 rounded-2xl bg-muted/40 p-1">
                <TabsTrigger
                  value="prizes"
                  className="rounded-xl px-3 py-2 transition-colors
               data-[state=active]:bg-white data-[state=active]:text-foreground
               data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border"
                >
                  Danh mục giải
                </TabsTrigger>

                <TabsTrigger
                  value="normal"
                  className="rounded-xl px-3 py-2 transition-colors
               data-[state=active]:bg-white data-[state=active]:text-foreground
               data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border"
                >
                  Giải chung
                </TabsTrigger>

                <TabsTrigger
                  value="specials"
                  className="rounded-xl px-3 py-2 transition-colors
               data-[state=active]:bg-white data-[state=active]:text-foreground
               data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border"
                >
                  Số đặc biệt
                </TabsTrigger>

                <TabsTrigger
                  value="customers"
                  className="rounded-xl px-3 py-2 transition-colors
               data-[state=active]:bg-white data-[state=active]:text-foreground
               data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-border"
                >
                  Khách hàng
                </TabsTrigger>
              </TabsList>

              {/* PRIZES */}
              <TabsContent value="prizes" className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Danh mục giải</div>
                  <Button size="sm" onClick={addPrize} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Thêm giải thưởng
                  </Button>
                </div>
                <ScrollArea className="h-[360px] rounded-md border">
                  <Table className="text-sm">
                    <TableHeader className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                      <TableRow className="[&>th]:h-10 [&>th]:px-3">
                        <TableHead className="w-10 text-center">#</TableHead>
                        <TableHead className="min-w-[220px]">Tên</TableHead>
                        <TableHead className="min-w-[260px]">
                          Hình ảnh
                        </TableHead>
                        <TableHead className="w-[120px] text-right">
                          Tồn kho
                        </TableHead>
                        <TableHead className="min-w-[160px]">Ghi chú</TableHead>
                        <TableHead className="w-[90px] text-right">
                          Hành động
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="[&>tr:nth-child(even)]:bg-muted/30">
                      {activeProgram.prizes.map((pr, i) => (
                        <TableRow
                          key={pr.id}
                          className="hover:bg-muted/50 transition-colors [&>td]:px-3 [&>td]:py-2"
                        >
                          <TableCell className="text-center">{i + 1}</TableCell>
                          <TableCell>
                            <Input
                              value={pr.name}
                              onChange={(e) =>
                                updatePrize(i, { name: e.target.value })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="relative group">
                                {pr.image ? (
                                  <img
                                    src={pr.image}
                                    alt=""
                                    className="h-16 w-16 rounded-xl object-cover ring-1 ring-border transition group-hover:brightness-90"
                                  />
                                ) : (
                                  <div className="h-16 w-16 rounded-xl ring-1 ring-border flex items-center justify-center text-[10px] text-muted-foreground bg-muted/30">
                                    <ImageIcon className="h-3 w-3 mr-1" />
                                    Trống
                                  </div>
                                )}

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="secondary"
                                      className="absolute right-1 top-1 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition"
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    sideOffset={6}
                                  >
                                    <DropdownMenuItem
                                      className="flex items-center gap-2"
                                      onClick={() =>
                                        document
                                          .getElementById(`pr-image-${i}`)
                                          ?.click()
                                      }
                                    >
                                      <Upload className="h-4 w-4" />
                                      Đổi ảnh
                                    </DropdownMenuItem>
                                    {pr.image && (
                                      <DropdownMenuItem>
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <div className="flex items-center gap-2">
                                              <Eye className="h-4 w-4" />
                                              Xem ảnh
                                            </div>
                                          </DialogTrigger>
                                          <DialogContent className="max-w-2xl">
                                            <img
                                              src={pr.image}
                                              alt=""
                                              className="w-full h-auto rounded-lg object-contain"
                                            />
                                          </DialogContent>
                                        </Dialog>
                                      </DropdownMenuItem>
                                    )}
                                    {pr.image && (
                                      <DropdownMenuItem
                                        className="flex items-center gap-2 text-red-600"
                                        onClick={() =>
                                          updatePrize(i, { image: "" })
                                        }
                                      >
                                        <Trash2
                                          className="h-4 w-4"
                                          color="oklch(57.7% 0.245 27.325)"
                                        />
                                        Xoá ảnh
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              <input
                                id={`pr-image-${i}`}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const f = e.target.files?.[0];
                                  if (!f) return;
                                  updatePrize(i, {
                                    image: await fileToDataUrl(f),
                                  });
                                }}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              inputMode="numeric"
                              type="number"
                              value={pr.stock}
                              onChange={(e) =>
                                updatePrize(i, {
                                  stock: Number(e.target.value) || 0,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={pr.note || ""}
                              onChange={(e) =>
                                updatePrize(i, { note: e.target.value })
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <ActionIcon
                              label="Delete"
                              onClick={() => removePrize(i)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </ActionIcon>
                          </TableCell>
                        </TableRow>
                      ))}
                      {activeProgram.prizes.length === 0 && (
                        <TableEmpty colSpan={6}>No prizes</TableEmpty>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>

              {/* NORMAL PRIZES (gồm khoảng số) */}
              <TabsContent value="normal" className="space-y-6 pt-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Giải chung</div>
                  <Button size="sm" onClick={addNormalPrize} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Thêm
                  </Button>
                </div>
                <ScrollArea className="h-[490px] rounded-md border">
                  <Table className="text-sm">
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow className="[&>th]:h-10 [&>th]:px-3">
                        <TableHead className="w-10 text-center">#</TableHead>
                        <TableHead>Giải thưởng</TableHead>
                        <TableHead className="w-[140px] text-right">
                          Số lượng
                        </TableHead>
                        <TableHead className="w-[140px] text-right">
                          Số nhỏ nhất
                        </TableHead>
                        <TableHead className="w-[140px] text-right">
                          Số lớn nhất
                        </TableHead>
                        <TableHead className="w-[180px] text-right">
                          Lượt quay mặc định
                        </TableHead>
                        <TableHead className="w-[90px] text-right">
                          Hành động
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="[&>tr:nth-child(even)]:bg-muted/30">
                      {activeProgram.normalPrizes.map((np, i) => (
                        <TableRow
                          key={`${np.prizeId}-${i}`}
                          className="hover:bg-muted/50 transition-colors [&>td]:px-3 [&>td]:py-2"
                        >
                          <TableCell className="text-center">{i + 1}</TableCell>
                          <TableCell>
                            <Select
                              value={np.prizeId}
                              onValueChange={(v) =>
                                updateNormalPrize(i, { prizeId: v })
                              }
                            >
                              <SelectTrigger className="w-[260px]">
                                <SelectValue placeholder="Chọn giải thưởng" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectGroup>
                                  {activeProgram.prizes.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                      {p.name}
                                    </SelectItem>
                                  ))}
                                </SelectGroup>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              className="text-right"
                              type="number"
                              value={np.quantity}
                              onChange={(e) =>
                                updateNormalPrize(i, {
                                  quantity: Number(e.target.value) || 1,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              className="text-right"
                              type="number"
                              value={np.min}
                              onChange={(e) =>
                                updateNormalPrize(i, {
                                  min: Number(e.target.value) || 0,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              className="text-right"
                              type="number"
                              value={np.max}
                              onChange={(e) =>
                                updateNormalPrize(i, {
                                  max: Number(e.target.value) || 0,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              className="text-right"
                              type="number"
                              value={np.defaultDrawsPerNumber}
                              onChange={(e) =>
                                updateNormalPrize(i, {
                                  defaultDrawsPerNumber:
                                    Number(e.target.value) || 0,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <ActionIcon
                              label="Delete"
                              onClick={() => removeNormalPrize(i)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </ActionIcon>
                          </TableCell>
                        </TableRow>
                      ))}
                      {activeProgram.normalPrizes.length === 0 && (
                        <TableEmpty colSpan={7}>
                          Không có giải thưởng
                        </TableEmpty>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>

              {/* SPECIAL NUMBERS */}
              <TabsContent value="specials" className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Giải đặc biệt</div>
                  <Button size="sm" onClick={addSpecial} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Thêm
                  </Button>
                </div>
                <ScrollArea className="h-[490px] rounded-md border">
                  <Table className="text-sm">
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow className="[&>th]:h-10 [&>th]:px-3">
                        <TableHead className="w-10 text-center">#</TableHead>
                        <TableHead className="w-[120px] text-right">
                          Số đặc biệt
                        </TableHead>
                        <TableHead className="min-w-[260px]">
                          Giải thưởng
                        </TableHead>
                        <TableHead className="min-w-[160px]">
                          Số lượng
                        </TableHead>
                        <TableHead className="min-w-[160px]">
                          Số lượt quay
                        </TableHead>
                        <TableHead className="w-[90px] text-right">
                          Hành động
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="[&>tr:nth-child(even)]:bg-muted/30">
                      {activeProgram.specialNumbers.map((s, i) => {
                        return (
                          <TableRow
                            key={`${s.value}-${i}`}
                            className="hover:bg-muted/50 transition-colors [&>td]:px-3 [&>td]:py-2"
                          >
                            <TableCell className="text-center">
                              {i + 1}
                            </TableCell>
                            <TableCell className="text-right">
                              <Input
                                className="text-right"
                                type="number"
                                value={s.value}
                                onChange={(e) =>
                                  updateSpecial(i, {
                                    value: Number(e.target.value) || 0,
                                  })
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Select
                                  value={s.prizeId ?? "none"}
                                  onValueChange={(v) =>
                                    updateSpecial(i, {
                                      prizeId: v === "none" ? undefined : v,
                                    })
                                  }
                                >
                                  <SelectTrigger className="w-[240px]">
                                    <SelectValue placeholder="Catalog prize" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectGroup>
                                      <SelectItem value="none">—</SelectItem>
                                      {activeProgram.prizes.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                          {p.name}
                                        </SelectItem>
                                      ))}
                                    </SelectGroup>
                                  </SelectContent>
                                </Select>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                className="text-right"
                                type="number"
                                value={s.number}
                                onChange={(e) =>
                                  updateSpecial(i, {
                                    number: Number(e.target.value) || 0,
                                  })
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                className="text-right"
                                type="number"
                                value={s.draws}
                                onChange={(e) =>
                                  updateSpecial(i, {
                                    draws: Number(e.target.value) || 0,
                                  })
                                }
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <ActionIcon
                                label="Delete"
                                onClick={() => removeSpecial(i)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </ActionIcon>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {activeProgram.specialNumbers.length === 0 && (
                        <TableEmpty colSpan={6}>
                          Không có số đặc biệt
                        </TableEmpty>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>

              {/* CUSTOMERS */}
              <TabsContent value="customers" className="space-y-4 pt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Tải lên CSV</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={onDropCsv}
                        onClick={() => fileRef.current?.click()}
                        className="group cursor-pointer rounded-xl border border-dashed bg-muted/40 px-4 py-6 text-center transition hover:bg-muted/60"
                      >
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-background ring-1 ring-border transition group-hover:scale-105">
                          <Upload className="h-5 w-5" />
                        </div>
                        <div className="mt-3 font-medium">
                          Kéo & thả tệp vào đây
                        </div>
                        <div className="text-xs text-muted-foreground">
                          hoặc nhấn để chọn .csv / .txt
                        </div>
                        <Input
                          ref={fileRef}
                          type="file"
                          accept=".csv,.txt"
                          className="hidden"
                          onChange={(e) => handleCsvFiles(e.target.files)}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Thêm mới</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-6 gap-2">
                        <div className="sm:col-span-2">
                          <Input
                            placeholder="Tên KH (tuỳ chọn)"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Input
                            placeholder="Số điện thoại"
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value)}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Input
                            placeholder="Số lượt quay"
                            type="number"
                            inputMode="numeric"
                            value={newAttempts}
                            onChange={(e) => setNewAttempts(e.target.value)}
                          />
                        </div>
                      </div>
                      <Button
                        className="w-full gap-2"
                        onClick={addOneCustomer}
                        disabled={!canAdd}
                      >
                        <Plus className="h-4 w-4" />
                        Thêm khách hàng
                      </Button>
                      {!canAdd && newPhone.length > 0 && (
                        <div className="text-xs text-destructive">
                          Số điện thoại không hợp lệ
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <div className="text-xs font-medium mb-2">
                    Định dạng hỗ trợ
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Tên khách hàng, Số điện thoại, Số lượt quay</li>
                    <li>• Hoặc: Số điện thoại, Số lượt quay</li>
                    <li>• Hoặc: Số điện thoại (mặc định 0 lượt)</li>
                  </ul>
                  <div className="mt-2 grid grid-cols-1 gap-1 rounded-md bg-muted/40 p-2 text-xs font-mono">
                    <code>Nguyen Van A,0901234567,2</code>
                    <code>0901234567,2</code>
                    <code>0901234567</code>
                  </div>
                  <div className="mt-2 text-[11px] text-muted-foreground">
                    Phân tách bằng dấu phẩy, chấm phẩy hoặc tab. Mã hóa UTF-8.
                  </div>
                </div>
                <Separator />
                <ScrollArea className="h-[360px] rounded-md border">
                  <Table className="text-sm">
                    <TableHeader>
                      <TableRow className="[&>th]:h-10 [&>th]:px-3">
                        <TableHead className="w-10 text-center">#</TableHead>
                        <TableHead>Tên khách hàng</TableHead>
                        <TableHead>Số điện thoại</TableHead>
                        <TableHead className="w-[140px] text-right">
                          Số lượt quay
                        </TableHead>
                        <TableHead className="w-[90px] text-right">
                          Hành động
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="[&>tr:nth-child(even)]:bg-muted/30">
                      {customers.map((c, i) => (
                        <TableRow
                          key={i}
                          className="hover:bg-muted/50 transition-colors [&>td]:px-3 [&>td]:py-2"
                        >
                          <TableCell className="text-center">{i + 1}</TableCell>
                          <TableCell className="font-medium">
                            <Input
                              value={c.name}
                              onChange={(e) => {
                                const v = e.target.value;
                                setCustomers((prev) =>
                                  prev.map((r, idx) =>
                                    idx === i ? { ...r, name: v } : r
                                  )
                                );
                              }}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <Input
                              value={c.phone}
                              onChange={(e) => {
                                const v = e.target.value;
                                setCustomers((prev) =>
                                  prev.map((r, idx) =>
                                    idx === i ? { ...r, phone: v } : r
                                  )
                                );
                              }}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              className="text-right"
                              type="number"
                              value={c.attempts}
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                setCustomers((prev) =>
                                  prev.map((r, idx) =>
                                    idx === i
                                      ? {
                                          ...r,
                                          attempts: Number.isFinite(v) ? v : 0,
                                        }
                                      : r
                                  )
                                );
                              }}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <ActionIcon
                              label="Delete"
                              onClick={() =>
                                setCustomers((prev) =>
                                  prev.filter((_, idx) => idx !== i)
                                )
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </ActionIcon>
                          </TableCell>
                        </TableRow>
                      ))}
                      {customers.length === 0 && (
                        <TableEmpty colSpan={4}>No data</TableEmpty>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
