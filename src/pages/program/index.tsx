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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Plus,
  Trash2,
  Upload,
  Sparkles,
  Image as ImageIcon,
  Search,
  Copy,
  Eye,
  UploadCloud,
  Pencil,
  MoreHorizontal,
  Info,
  ArrowUpDown,
  Filter,
  CalendarClock,
  Check,
  GripVertical,
  Clock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconDotsVertical, IconTransferVertical } from "@tabler/icons-react";
import JoditEditor from "jodit-react";
import Stepper from "@/components/stepper";
import { ImageField } from "@/components/image-field";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { SortableRow, useSortableHandle } from "@/components/sortable-row";
import { Switch } from "@/components/ui/switch";
import ActionIcon from "@/components/action-icon";
import InfoSection from "./components/Info";
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
  prizeName: z.string().optional(),
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
  programCode: z.string().optional().default(""),
  slogan: z.string().optional().default(""),
  image: z.string().optional().default(""),
  enabled: z.boolean().default(true),
  shortSummary: z.string().optional().default(""),
  summary: z.string().optional().default(""),
  rules: z.array(z.string()).default([]),
  prizes: z.array(prizeSchema).default([]),
  normalPrizes: z.array(normalPrizeSchema).default([]),
  ranges: z.array(rangeSchema).default([]),
  clientFields: z.array(z.string()).default([]),
  reminder: z
    .object({
      enabled: z.boolean().default(false),
      sendAt: z.string().optional().default(""),
      message: z.string().optional().default(""),
      channel: z.enum(["sms", "zalo", "email"]).optional(),
    })
    .default({
      enabled: false,
      sendAt: "",
      message: "",
    }),
  zalo: z
    .object({
      banner: z.string().optional().default(""),
      thumb: z.string().optional().default(""),
    })
    .default({
      banner: "",
      thumb: "",
    }),
  landing: z
    .object({
      background: z.string().optional().default(""),
      thumb: z.string().optional().default(""),
    })
    .default({
      background: "",
      thumb: "",
    }),
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
  specialNumbers: z
    .array(
      z.object({
        value: z.number().int().nonnegative(),
        prize: z.string().min(1).optional(),
        number: z.number().int().nonnegative().optional(),
        draws: z.number().int().nonnegative().optional(),
        prizeId: z.string().optional(),
      })
    )
    .default([]),
  scenario: z.object({
    drawType: z.enum(["cage", "online"]).default("cage"),
    range: z.object({
      min: z.number().int().positive().default(0),
      max: z.number().int().positive().default(9999),
      repeat: z.number().int().positive().default(1),
    }),
    singles: z
      .array(
        z.object({
          value: z.number().int().nonnegative(),
          repeat: z.number().int().positive().default(1),
          prizeId: z.string().optional(),
        })
      )
      .default([]),
  }),
});

type Prize = z.infer<typeof prizeSchema>;
type RangeRule = z.infer<typeof rangeSchema>;
type Program = z.infer<typeof programSchema>;
type CustomerRow = {
  index: number;
  name?: string;
  phone: string;
  attempts: number;
};

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
    programCode: "TET2025",
    image: "https://img.lovepik.com/photo/40079/9618.jpg_wh860.jpg",
    slogan: "Chúc bạn một năm mới an khang thịnh vượng",
    enabled: true,
    summary: `<p><span style="font-size: 14px;">Chương trình tri ân khách hàng dịp tết 2025. Tham gia quay số nhận e-voucher và quà Tết hấp dẫn.</span></p><ul><li><span style="font-size: 14px;">Mỗi số điện thoại được tham gia theo số lượt quay được cấp.</span></li><li><span style="font-size: 14px;">Giải thưởng không quy đổi thành tiền mặt.</span></li><span style="font-size: 14px;"><br></span></ul>`,
    shortSummary: "Chương trình Tết 2025 với nhiều phần quà hấp dẫn.",
    clientFields: ["name", "email"],
    reminder: {
      enabled: false,
      sendAt: "",
      message: "",
    },
    landing: {
      background: "https://img.lovepik.com/photo/40079/9618.jpg_wh860.jpg",
      thumb: "https://img.lovepik.com/photo/40079/9618.jpg_wh860.jpg",
    },
    zalo: {
      banner: "https://img.lovepik.com/photo/40079/9618.jpg_wh860.jpg",
      thumb: "https://img.lovepik.com/photo/40079/9618.jpg_wh860.jpg",
    },
    rules: [
      "Mỗi số điện thoại được tham gia theo số lượt quay được cấp.",
      "Giải thưởng không quy đổi thành tiền mặt.",
      "BTC có quyền điều chỉnh thể lệ khi cần thiết.",
    ],
    prizes: [
      {
        id: "p-evoucher",
        name: "E-voucher 50K",
        prizeName: "Voucher 50.000đ",
        image: "",
        stock: 1000,
        note: "Mã trị giá 50.000đ",
      },
      {
        id: "p-combo-tet",
        name: "Combo Tết",
        prizeName: "Combo quà Tết",
        image: "",
        stock: 200,
        note: "Gồm nhiều sản phẩm",
      },
      {
        id: "p-jackpot",
        name: "Jackpot 5,000,000đ",
        prizeName: "Giải đặc biệt 5.000.000đ",
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
    scenario: {
      drawType: "online",
      range: { min: 0, max: 9999, repeat: 1 },
      singles: [],
    },
  },
  {
    id: crypto.randomUUID(),
    programName: "Sinh nhật 10 năm",
    image: "https://img.lovepik.com/photo/40079/9618.jpg_wh860.jpg",
    programCode: "BDAY10",
    slogan: "Kỷ niệm 10 năm – Quay là trúng",
    enabled: false,
    reminder: {
      enabled: false,
      sendAt: "",
      message: "",
    },
    landing: {
      background: "https://img.lovepik.com/photo/40079/9618.jpg_wh860.jpg",
      thumb: "https://img.lovepik.com/photo/40079/9618.jpg_wh860.jpg",
    },
    zalo: {
      banner: "https://img.lovepik.com/photo/40079/9618.jpg_wh860.jpg",
      thumb: "https://img.lovepik.com/photo/40079/9618.jpg_wh860.jpg",
    },
    summary:
      "Kỷ niệm 10 năm, tham gia quay số để nhận bộ quà đặc biệt dành riêng cho sự kiện.",
    shortSummary: "Kỷ niệm 10 năm với bộ quà đặc biệt.",
    clientFields: ["name", "email", "address"],
    rules: [
      "Áp dụng cho khách hàng mời tham dự sự kiện.",
      "Thông tin người trúng thưởng phải trùng khớp khi nhận quà.",
    ],
    prizes: [
      {
        id: "p-birthday-kit",
        name: "Bộ quà sinh nhật",
        prizeName: "Bộ quà 10 năm",
        image: "",
        stock: 300,
        note: "",
      },
      { id: "p-10yrs", name: "Bộ quà 10 năm", image: "", stock: 100, note: "" },
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
    scenario: {
      drawType: "online",
      range: { min: 0, max: 9999, repeat: 1 },
      singles: [],
    },
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

export default function ProgramPage() {
  const [programs, setPrograms] = useState<Program[]>(defaultPrograms());
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState(programs[0].id);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [customers, setCustomers] = useState<CustomerRow[]>(defaultCustomers);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAttempts, setNewAttempts] = useState<string>("");
  const fileRef = useRef<HTMLInputElement | null>(null);
  const excelRef = useRef<HTMLInputElement | null>(null);
  const [step, setStep] = useState(0);
  const [openHistory, setOpenHistory] = React.useState(false);
  const [historyOf, setHistoryOf] = React.useState<CustomerRow | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "enabled" | "disabled"
  >("all");

  const [sortBy, setSortBy] = useState<"name" | "prizes">("name");
  const activeProgram = useMemo(
    () => programs.find((p) => p.id === activeId)!,
    [programs, activeId]
  );
  const historyByPhone: Record<
    string,
    Array<{ at: string; action: string; result?: string }>
  > = {
    // "0901111222": [{ at: "2025-01-12 09:00", action: "Tham gia bốc số", result: "Số 2025" }],
  };

  const setActiveProgramPatch = (patch: Partial<Program>) =>
    setPrograms((prev) =>
      prev.map((p) => (p.id === activeId ? { ...p, ...patch } : p))
    );

  const addProgram = () => {
    const p: Program = {
      id: crypto.randomUUID(),
      programCode: "",
      programName: `Chương trình #${programs.length + 1}`,
      image: "",
      slogan: "",
      enabled: true,
      shortSummary: "",
      summary: "",
      zalo: {
        banner: "",
        thumb: "",
      },
      landing: {
        background: "",
        thumb: "",
      },
      rules: [],
      prizes: [],
      normalPrizes: [],
      ranges: [],
      clientFields: [],
      specialNumbers: [],
      reminder: {
        enabled: false,
        sendAt: "",
        message: "",
      },
      startedAt: undefined,
      endedAt: undefined,
      scenario: {
        drawType: "cage",
        range: { min: 0, max: 9999, repeat: 1 },
        singles: [],
      },
    };
    setPrograms((x) => [...x, p]);
    setActiveId(p.id);
  };
  const stats = useMemo(() => {
    const total = programs.length;
    const enabled = programs.filter((p) => p.enabled).length;
    const disabled = total - enabled;
    return { total, enabled, disabled };
  }, [programs]);

  const filteredPrograms = useMemo(() => {
    const q = search.toLowerCase();
    let list = programs.filter((p) => p.programName.toLowerCase().includes(q));
    if (statusFilter !== "all") {
      list = list.filter((p) =>
        statusFilter === "enabled" ? p.enabled : !p.enabled
      );
    }
    list = list.sort((a, b) => {
      if (sortBy === "name") return a.programName.localeCompare(b.programName);
      return (b.prizes?.length || 0) - (a.prizes?.length || 0);
    });
    return list;
  }, [programs, search, statusFilter, sortBy]);
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

  const handleCsvFiles = async (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    const rows = await parseCustomersCsv(f);
    setCustomers(rows);
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
        landing: r.landing,
        zalo: r.zalo,
        shortSummary: String(r.shortSummary || ""),
        programCode: String(r.programCode || r.code || ""),
        clientFields: r.clientFields || [],
        slogan: String(r.slogan || ""),
        enabled: toBool(r.enabled ?? true),
        summary: String(r.summary || ""),
        rules: String(r.rules || "")
          .split(/\r?\n/)
          .map((s: string) => s.trim())
          .filter(Boolean),
        prizes: [],
        normalPrizes: [],
        ranges: [],
        specialNumbers: [],
        reminder: {
          enabled: toBool(r.reminderEnabled ?? r.reminder?.enabled ?? false),
          sendAt: String(r.reminderSendAt || r.reminder?.sendAt || ""),
          message: String(r.reminderMessage || r.reminder?.message || ""),
        },
        startedAt: r.startedAt ? String(r.startedAt) : undefined,
        endedAt: r.endedAt ? String(r.endedAt) : undefined,
        scenario: {
          drawType:
            r.drawType === "cage" || r.drawType === "online"
              ? r.drawType
              : "online",
          range: {
            min: Number(r.rangeMin ?? 0) || 0,
            max: Number(r.rangeMax ?? 9999) || 9999,
            repeat: Number(r.rangeRepeat ?? 1) || 1,
          },
          singles: [],
        },
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem
                    className={sortBy === "name" ? "font-medium" : ""}
                    onClick={() => setSortBy("name")}
                  >
                    Tên (A → Z)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className={sortBy === "prizes" ? "font-medium" : ""}
                    onClick={() => setSortBy("prizes")}
                  >
                    Nhiều giải thưởng
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
                {filteredPrograms.map((p) => {
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
                        {p.image ? (
                          <img
                            src={p.image}
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
                          <div className="font-medium truncate">
                            {p.programName}
                          </div>
                          {p.programCode ? (
                            <span className="text-[11px] text-muted-foreground">
                              • {p.programCode}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          <Badge variant={p.enabled ? "default" : "secondary"}>
                            {p.enabled ? "Bật" : "Tắt"}
                          </Badge>
                          <span>Giải: {p.prizes.length}</span>
                          <span>Đặc biệt: {p.specialNumbers.length}</span>
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
                              duplicateProgram(p.id);
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
                            onClick={() => deleteProgram(p.id)}
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
          <Stepper
            steps={[
              { id: "info", label: "Thông tin" },
              { id: "prizes", label: "Giải thưởng" },
              { id: "images", label: "Hình ảnh" },
              { id: "scenario", label: "Kịch bản" },
              { id: "client", label: "Khách hàng" },
            ]}
            orientation="horizontal"
            onValueChange={setStep}
            defaultValue={step}
            value={step}
          >
            {step === 0 && (
              <InfoSection
                activeProgram={activeProgram}
                setActiveProgramPatch={setActiveProgramPatch}
                setPreviewImage={setPreviewImage}
              />
            )}
            {step === 1 && (
              <div className="space-y-4 px-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Danh mục giải</div>
                  <Button size="sm" onClick={addPrize} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Thêm giải
                  </Button>
                </div>
                <ScrollArea className="h-[360px] rounded-md border">
                  <Table className="text-sm">
                    <TableHeader className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                      <TableRow className="[&>th]:h-10 [&>th]:px-3">
                        <TableHead className="w-10 text-center">#</TableHead>
                        <TableHead className="min-w-[220px]">
                          Tên giải
                        </TableHead>
                        <TableHead className="min-w-[220px]">
                          Giải thưởng
                        </TableHead>
                        <TableHead className="min-w-[100px]">
                          Hình ảnh
                        </TableHead>
                        <TableHead className="w-[120px] text-right">
                          Số lượng giải
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
                            <Input
                              value={pr.prizeName}
                              onChange={(e) =>
                                updatePrize(i, { prizeName: e.target.value })
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
                                      <DropdownMenuItem
                                        onClick={() =>
                                          setPreviewImage(pr.image!)
                                        }
                                      >
                                        <div className="flex items-center gap-2">
                                          <Eye className="h-4 w-4" />
                                          Xem ảnh
                                        </div>
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
                            <Textarea
                              className="min-h-[38px]"
                              value={pr.note || ""}
                              onChange={(e) =>
                                updatePrize(i, { note: e.target.value })
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <ActionIcon
                              label="Xoá"
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
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-4 px-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Hình ảnh chương trình</div>
                  <div className="text-xs text-muted-foreground">
                    PNG/JPG/WebP • ≤ 2MB
                  </div>
                </div>

                <Tabs defaultValue="zalo" className="w-full">
                  <TabsList className="rounded-xl bg-muted/40 p-1">
                    <TabsTrigger value="zalo" className="rounded-lg px-3 py-2">
                      Zalo mini app
                    </TabsTrigger>
                    <TabsTrigger
                      value="landing"
                      className="rounded-lg px-3 py-2"
                    >
                      Landing Page
                    </TabsTrigger>
                  </TabsList>

                  {/* Zalo mini app */}
                  <TabsContent value="zalo" className="space-y-4 pt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <ImageField
                        label="Banner"
                        hint="Tỉ lệ 3:1 • gợi ý 1500×500"
                        value={activeProgram?.zalo?.banner || ""}
                        onChange={async (file) =>
                          setActiveProgramPatch({
                            zalo: {
                              ...(activeProgram?.zalo || {}),
                              banner: await fileToDataUrl(file),
                            },
                          })
                        }
                        onClear={() =>
                          setActiveProgramPatch({
                            zalo: {
                              ...(activeProgram?.zalo || {}),
                              banner: "",
                            },
                          })
                        }
                      />

                      <ImageField
                        label="Thumbnail"
                        hint="Tỉ lệ 1:1 • gợi ý 600×600"
                        value={activeProgram?.zalo?.thumb || ""}
                        onChange={async (file) =>
                          setActiveProgramPatch({
                            zalo: {
                              ...(activeProgram?.zalo || {}),
                              thumb: await fileToDataUrl(file),
                            },
                          })
                        }
                        onClear={() =>
                          setActiveProgramPatch({
                            zalo: {
                              ...(activeProgram?.zalo || {}),
                              thumb: "",
                            },
                          })
                        }
                      />
                    </div>
                  </TabsContent>

                  {/* Landing Page */}
                  <TabsContent value="landing" className="space-y-4 pt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <ImageField
                        label="Thumbnail (x2 size)"
                        hint="Tỉ lệ 16:9 • gợi ý 2400×1350"
                        value={activeProgram?.landing?.thumb || ""}
                        onChange={async (file) =>
                          setActiveProgramPatch({
                            landing: {
                              ...activeProgram.landing,
                              thumb: await fileToDataUrl(file),
                            },
                          })
                        }
                        onClear={() =>
                          setActiveProgramPatch({
                            landing: {
                              ...activeProgram.landing,
                              thumb: "",
                            },
                          })
                        }
                      />

                      <ImageField
                        label="Background"
                        hint="Full HD trở lên • gợi ý ≥ 1920×1080"
                        value={activeProgram?.landing?.background || ""}
                        onChange={async (file) =>
                          setActiveProgramPatch({
                            landing: {
                              ...activeProgram.landing,
                              background: await fileToDataUrl(file),
                            },
                          })
                        }
                        onClear={() =>
                          setActiveProgramPatch({
                            landing: {
                              ...activeProgram.landing,
                              background: "",
                            },
                          })
                        }
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
            {step === 3 && (
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
                          id: "cage",
                          label: "Quay lồng cầu",
                          desc: "Trải nghiệm sự kiện trực tiếp",
                        },
                        {
                          id: "online",
                          label: "Quay online",
                          desc: "Tự động trên web/app",
                        },
                      ].map((opt) => {
                        const checked =
                          (activeProgram.scenario?.drawType ?? "online") ===
                          opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() =>
                              setActiveProgramPatch({
                                scenario: {
                                  ...(activeProgram.scenario ?? {}),
                                  drawType: opt.id as "cage" | "online",
                                },
                              })
                            }
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

                {activeProgram.scenario.drawType === "online" && (
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
                              value={activeProgram.scenario?.range?.min ?? 0}
                              onChange={(e) =>
                                setActiveProgramPatch({
                                  scenario: {
                                    ...(activeProgram.scenario ?? {}),
                                    range: {
                                      ...(activeProgram.scenario?.range ?? {}),
                                      min: Number(e.target.value) || 0,
                                    },
                                  },
                                })
                              }
                              className="pr-10"
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
                              value={activeProgram.scenario?.range?.max ?? 0}
                              onChange={(e) =>
                                setActiveProgramPatch({
                                  scenario: {
                                    ...(activeProgram.scenario ?? {}),
                                    range: {
                                      ...(activeProgram.scenario?.range ?? {}),
                                      max: Number(e.target.value) || 0,
                                    },
                                  },
                                })
                              }
                              className="pr-10"
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
                            value={activeProgram.scenario?.range?.repeat ?? 1}
                            onChange={(e) =>
                              setActiveProgramPatch({
                                scenario: {
                                  ...(activeProgram.scenario ?? {}),
                                  range: {
                                    ...(activeProgram.scenario?.range ?? {}),
                                    repeat: Math.max(
                                      1,
                                      Number(e.target.value) || 1
                                    ),
                                  },
                                },
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Badge variant="secondary">
                          Tổng lượt dãy:{" "}
                          {Math.max(
                            0,
                            (activeProgram.scenario?.range?.max ?? 0) -
                              (activeProgram.scenario?.range?.min ?? 0) +
                              1
                          ) *
                            Math.max(
                              1,
                              activeProgram.scenario?.range?.repeat ?? 1
                            )}
                        </Badge>
                        {(activeProgram.scenario?.range?.min ?? 0) >
                          (activeProgram.scenario?.range?.max ?? 0) && (
                          <span className="rounded-md bg-amber-50 px-2 py-1 text-[11px] text-amber-700 ring-1 ring-amber-200">
                            Lưu ý: A nên ≤ B
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activeProgram.scenario.drawType === "online" && (
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
                        <Button
                          size="sm"
                          className="gap-2"
                          onClick={() =>
                            setActiveProgramPatch({
                              scenario: {
                                ...(activeProgram.scenario ?? {}),
                                singles: [
                                  ...((activeProgram.scenario
                                    ?.singles as any[]) ?? []),
                                  { value: 0, repeat: 1, prizeId: "" },
                                ],
                              },
                            })
                          }
                        >
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
                            {(activeProgram.scenario?.singles ?? []).map(
                              (row: any, idx: number) => {
                                const min =
                                  activeProgram.scenario?.range?.min ?? 0;
                                const max =
                                  activeProgram.scenario?.range?.max ?? 0;
                                const inRange =
                                  row.value >= min && row.value <= max;

                                return (
                                  <TableRow
                                    key={idx}
                                    className="[&>td]:px-3 [&>td]:py-2"
                                  >
                                    <TableCell className="text-right">
                                      <Input
                                        type="number"
                                        inputMode="numeric"
                                        value={row.value}
                                        onChange={(e) => {
                                          const v = Number(e.target.value) || 0;
                                          const next = (
                                            activeProgram.scenario?.singles ??
                                            []
                                          ).map((x: any, i: number) =>
                                            i === idx ? { ...x, value: v } : x
                                          );
                                          setActiveProgramPatch({
                                            scenario: {
                                              ...(activeProgram.scenario ?? {}),
                                              singles: next,
                                            },
                                          });
                                        }}
                                        className={cn(
                                          inRange && "border-amber-400"
                                        )}
                                      />
                                      {inRange && (
                                        <div className="mt-1 text-[10px] text-amber-600">
                                          Số này trùng dãy A→B
                                        </div>
                                      )}
                                    </TableCell>

                                    <TableCell className="text-right">
                                      <Input
                                        type="number"
                                        inputMode="numeric"
                                        value={row.repeat ?? 1}
                                        onChange={(e) => {
                                          const v = Math.max(
                                            1,
                                            Number(e.target.value) || 1
                                          );
                                          const next = (
                                            activeProgram.scenario?.singles ??
                                            []
                                          ).map((x: any, i: number) =>
                                            i === idx ? { ...x, repeat: v } : x
                                          );
                                          setActiveProgramPatch({
                                            scenario: {
                                              ...(activeProgram.scenario ?? {}),
                                              singles: next,
                                            },
                                          });
                                        }}
                                      />
                                    </TableCell>

                                    <TableCell>
                                      <Select
                                        value={row.prizeId ?? ""}
                                        onValueChange={(val) => {
                                          const next = (
                                            activeProgram.scenario?.singles ??
                                            []
                                          ).map((x: any, i: number) =>
                                            i === idx
                                              ? { ...x, prizeId: val }
                                              : x
                                          );
                                          setActiveProgramPatch({
                                            scenario: {
                                              ...(activeProgram.scenario ?? {}),
                                              singles: next,
                                            },
                                          });
                                        }}
                                      >
                                        <SelectTrigger className="w-[260px]">
                                          <SelectValue placeholder="Chọn giải thưởng" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectGroup>
                                            {activeProgram.prizes.map((p) => (
                                              <SelectItem
                                                key={p.id}
                                                value={p.id}
                                              >
                                                {p.name}
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
                                        onClick={() => {
                                          const next = (
                                            activeProgram.scenario?.singles ??
                                            []
                                          ).filter(
                                            (_: any, i: number) => i !== idx
                                          );
                                          setActiveProgramPatch({
                                            scenario: {
                                              ...(activeProgram.scenario ?? {}),
                                              singles: next,
                                            },
                                          });
                                        }}
                                        aria-label="Xoá"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              }
                            )}

                            {(activeProgram.scenario?.singles ?? []).length ===
                              0 && (
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

                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <Badge variant="secondary">
                          Tổng lượt dãy:{" "}
                          {Math.max(
                            0,
                            (activeProgram.scenario?.range?.max ?? 0) -
                              (activeProgram.scenario?.range?.min ?? 0) +
                              1
                          ) *
                            Math.max(
                              1,
                              activeProgram.scenario?.range?.repeat ?? 1
                            )}
                        </Badge>
                        <Badge>
                          Số lẻ:{" "}
                          {(activeProgram.scenario?.singles ?? []).length}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
            {step === 4 && (
              <div className="space-y-6 px-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Khách hàng</div>
                  <div className="text-xs text-muted-foreground">
                    Thông tin khách hàng tham gia chương trình
                  </div>
                </div>

                {/* DANH SÁCH KHÁCH HÀNG + DRAG & DROP + LỊCH SỬ */}
                <Card className="border-muted/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Danh sách khách hàng
                    </CardTitle>
                    <CardDescription>
                      Kéo-thả để sắp xếp ưu tiên
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Thêm nhanh */}
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                        <Input
                          className="sm:col-span-3"
                          placeholder="Tên KH"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                        />
                        <Input
                          className="sm:col-span-3"
                          placeholder="Số điện thoại"
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                        />
                        <Input
                          className="sm:col-span-3"
                          placeholder="Mã khách hàng"
                        />
                        <Input
                          className="sm:col-span-2"
                          placeholder="Số lượt quay"
                          type="number"
                          inputMode="numeric"
                          value={newAttempts}
                          onChange={(e) => setNewAttempts(e.target.value)}
                        />
                        <Button
                          className="sm:col-span-1"
                          onClick={addOneCustomer}
                          disabled={!canAdd}
                        >
                          Thêm
                        </Button>
                      </div>
                      {!canAdd && newPhone.length > 0 && (
                        <div className="mt-1 text-xs text-destructive">
                          Số điện thoại không hợp lệ
                        </div>
                      )}
                    </div>

                    {/* Import / Export */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileRef.current?.click()}
                      >
                        Tải CSV
                      </Button>
                      <Input
                        ref={fileRef}
                        type="file"
                        accept=".csv,.txt"
                        className="hidden"
                        onChange={(e) => handleCsvFiles(e.target.files)}
                      />
                      <Button variant="outline" size="sm" onClick={exportJson}>
                        Xuất JSON
                      </Button>
                      <div className="ml-auto text-xs text-muted-foreground">
                        Kéo icon để sắp xếp. Nhấn đồng hồ để xem lịch sử.
                      </div>
                    </div>

                    {/* Bảng với drag handle + history dialog */}
                    <DndContext
                      collisionDetection={closestCenter}
                      onDragEnd={({ active, over }) => {
                        if (!over || active.id === over.id) return;
                        const oldIndex = customers.findIndex(
                          (c) => String(c.index) === String(active.id)
                        );
                        const newIndex = customers.findIndex(
                          (c) => String(c.index) === String(over.id)
                        );
                        const next = arrayMove(
                          customers,
                          oldIndex,
                          newIndex
                        ).map((c, i) => ({ ...c, index: i + 1 }));
                        setCustomers(next);
                      }}
                    >
                      <ScrollArea className="h-[360px] rounded-md border">
                        <Table className="text-sm">
                          <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                            <TableRow className="[&>th]:h-10 [&>th]:px-3">
                              <TableHead className="w-6"></TableHead>
                              <TableHead className="w-10 text-center">
                                #
                              </TableHead>
                              <TableHead className="min-w-[180px]">
                                Tên khách hàng
                              </TableHead>
                              <TableHead className="min-w-[160px]">
                                Số điện thoại
                              </TableHead>
                              <TableHead className="min-w-[140px]">
                                Mã KH
                              </TableHead>
                              <TableHead className="w-[120px] text-right">
                                Số lượt quay
                              </TableHead>
                              <TableHead className="w-[130px] text-right">
                                Hành động
                              </TableHead>
                            </TableRow>
                          </TableHeader>

                          <SortableContext
                            items={customers.map((c) => String(c.index))}
                            strategy={verticalListSortingStrategy}
                          >
                            <TableBody className="[&>tr:nth-child(even)]:bg-muted/30">
                              {customers.map((c, i) => (
                                <SortableRow key={c.index} id={String(c.index)}>
                                  <TableCell className="px-3 py-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="cursor-grab active:cursor-grabbing"
                                      {...useSortableHandle(String(c.index))}
                                      aria-label="Kéo để sắp xếp"
                                    >
                                      <GripVertical className="h-4 w-4" />
                                    </Button>
                                  </TableCell>

                                  <TableCell className="text-center px-3 py-2">
                                    {i + 1}
                                  </TableCell>

                                  <TableCell className="px-3 py-2">
                                    <Input
                                      value={c.name ?? ""}
                                      onChange={(e) =>
                                        setCustomers((prev) =>
                                          prev.map((r, idx) =>
                                            idx === i
                                              ? { ...r, name: e.target.value }
                                              : r
                                          )
                                        )
                                      }
                                    />
                                  </TableCell>

                                  <TableCell className="px-3 py-2">
                                    <Input
                                      value={c.phone}
                                      onChange={(e) =>
                                        setCustomers((prev) =>
                                          prev.map((r, idx) =>
                                            idx === i
                                              ? { ...r, phone: e.target.value }
                                              : r
                                          )
                                        )
                                      }
                                    />
                                  </TableCell>

                                  <TableCell className="px-3 py-2">
                                    <Input
                                      value={(c as any).customerCode ?? ""}
                                      onChange={(e) =>
                                        setCustomers((prev) =>
                                          prev.map((r, idx) =>
                                            idx === i
                                              ? ({
                                                  ...r,
                                                  customerCode: e.target.value,
                                                } as any)
                                              : r
                                          )
                                        )
                                      }
                                    />
                                  </TableCell>

                                  <TableCell className="px-3 py-2 text-right">
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
                                                  attempts: Number.isFinite(v)
                                                    ? v
                                                    : 0,
                                                }
                                              : r
                                          )
                                        );
                                      }}
                                    />
                                  </TableCell>

                                  <TableCell className="px-3 py-2 text-right">
                                    <div className="flex justify-end gap-1.5">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          setHistoryOf(c);
                                          setOpenHistory(true);
                                        }}
                                        aria-label="Xem lịch sử"
                                      >
                                        <Clock className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                          setCustomers((prev) =>
                                            prev.filter((_, idx) => idx !== i)
                                          )
                                        }
                                        aria-label="Xoá"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </SortableRow>
                              ))}

                              {customers.length === 0 && (
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
                          </SortableContext>
                        </Table>
                        <ScrollBar orientation="vertical" />
                      </ScrollArea>
                    </DndContext>
                  </CardContent>
                </Card>

                {/* NHẮC NHỞ KHÁCH HÀNG */}
                <Card className="border-muted/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Nhắc nhở tham gia bốc số
                    </CardTitle>
                    <CardDescription>
                      Thiết lập kênh & lịch gửi (UI minh hoạ)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-3">
                    <Select
                      value={activeProgram.reminder?.channel ?? "sms"}
                      onValueChange={(v) =>
                        setActiveProgramPatch({
                          reminder: {
                            ...(activeProgram.reminder ?? {}),
                            channel: v as "sms" | "zalo" | "email",
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kênh gửi" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="zalo">Zalo OA</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      type="datetime-local"
                      value={activeProgram.reminder?.sendAt ?? ""}
                      onChange={(e) =>
                        setActiveProgramPatch({
                          reminder: {
                            ...(activeProgram.reminder ?? {}),
                            sendAt: e.target.value,
                          },
                        })
                      }
                    />

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={!!activeProgram.reminder?.enabled}
                        onCheckedChange={(v) =>
                          setActiveProgramPatch({
                            reminder: {
                              ...(activeProgram.reminder ?? {}),
                              enabled: v,
                            },
                          })
                        }
                        id="reminder-enable"
                      />
                      <Label htmlFor="reminder-enable">Bật nhắc nhở</Label>
                      <Button variant="outline" size="sm" className="ml-auto">
                        Gửi thử
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* POPUP LỊCH SỬ */}
                <Dialog open={openHistory} onOpenChange={setOpenHistory}>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Lịch sử khách hàng</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                      {historyOf ? (
                        <>
                          <div className="text-sm">
                            <span className="font-medium">
                              {historyOf.name ?? "Không tên"}
                            </span>{" "}
                            <span className="text-muted-foreground">
                              ({historyOf.phone})
                            </span>
                          </div>
                          <div className="rounded-md border">
                            <Table className="text-sm">
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Thời gian</TableHead>
                                  <TableHead>Hành động</TableHead>
                                  <TableHead>Kết quả</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(historyByPhone[historyOf.phone] ?? []).map(
                                  (h: any, i: number) => (
                                    <TableRow key={i}>
                                      <TableCell className="whitespace-nowrap">
                                        {h.at}
                                      </TableCell>
                                      <TableCell>{h.action}</TableCell>
                                      <TableCell>{h.result ?? "—"}</TableCell>
                                    </TableRow>
                                  )
                                )}
                                {(historyByPhone[historyOf.phone] ?? [])
                                  .length === 0 && (
                                  <TableRow>
                                    <TableCell
                                      colSpan={3}
                                      className="text-center text-muted-foreground"
                                    >
                                      Chưa có lịch sử
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          Chưa chọn khách hàng
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button onClick={() => setOpenHistory(false)}>
                        Đóng
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </Stepper>
        </Card>
        <Dialog
          open={previewImage !== null}
          onOpenChange={() => setPreviewImage(null)}
        >
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
