import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Eye,
  MoreHorizontal,
  Trash2,
  Upload,
  Image as ImageIcon,
  FileText,
  Download,
} from "lucide-react";
import JoditEditor from "jodit-react";
import type { TProgram } from "@/react-query/services/program/program.service";
import { Tabs } from "@/components/ui/tabs";
import { ImageField } from "@/components/image-field";

export default function InfoSection({
  activeProgram,
  setActiveProgramPatch,
  setPreviewImage,
}: {
  activeProgram: TProgram;
  setActiveProgramPatch: (patch: Record<string, TProgram>) => void;
  setPreviewImage: (src: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pdfDragOver, setPdfDragOver] = useState(false);

  async function fileToDataUrl(file: File) {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleImage(f?: File | null) {
    if (!f) return;
    if (!f.type.startsWith("image/")) return;
    if (f.size > 2 * 1024 * 1024) {
      alert("Vui lòng chọn ảnh ≤ 2MB");
      return;
    }
    // setActiveProgramPatch({ im: await fileToDataUrl(f) });
  }

  async function handlePdf(f?: File | null) {
    if (!f) return;
    if (f.type !== "application/pdf") {
      alert("Chỉ chấp nhận PDF");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      alert("Vui lòng chọn PDF ≤ 5MB");
      return;
    }
    const dataUrl = await fileToDataUrl(f);
    // setActiveProgramPatch({
    //   rulesPdf: dataUrl,
    //   rulesPdfName: f.name,
    //   rulesPdfSize: f.size,
    // });
  }

  function prettySize(bytes?: number) {
    if (!bytes && bytes !== 0) return "";
    const units = ["B", "KB", "MB", "GB"];
    let i = 0;
    let n = bytes;
    while (n >= 1024 && i < units.length - 1) {
      n /= 1024;
      i++;
    }
    return `${n.toFixed(1)} ${units[i]}`;
  }

  return (
    <CardContent className="space-y-6 w-full">
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              className="opacity-70"
            >
              <circle cx="8" cy="8" r="8" />
            </svg>
            Thông tin chương trình
          </CardTitle>
          <CardDescription>
            <div className="space-y-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      Mã chương trình
                    </div>
                    <Input
                      value={activeProgram.code || ""}
                      placeholder="Mã chương trình"
                      className="max-w-40 uppercase font-medium"
                    />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="text-xs text-muted-foreground">
                      Tên chương trình
                    </div>
                    <Input
                      value={activeProgram.name}
                      className="flex-1"
                      placeholder="Tên chương trình"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      Trạng thái
                    </div>
                    <button
                      className={`shrink-0 inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] cursor-pointer transition ${
                        activeProgram.status
                          ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                          : "bg-neutral-50 border-neutral-200 text-neutral-600"
                      }`}
                    >
                      {activeProgram.status ? "Đang bật" : "Đang tắt"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Hình ảnh chương trình</div>
              <div className="text-xs text-muted-foreground">
                PNG/JPG/WebP • ≤ 2MB
              </div>
            </div>

            <Tabs defaultValue="zalo" className="w-full">
              <div className="grid gap-4 md:grid-cols-2">
                <ImageField
                  label="Banner"
                  hint="Tỉ lệ 3:1 • gợi ý 1500×500"
                  value={activeProgram?.image_banner || ""}
                  onChange={() => {}}
                  onClear={() => {}}
                />

                <ImageField
                  label="Thumbnail"
                  hint="Tỉ lệ 1:1 • gợi ý 600×600"
                  value={activeProgram?.image_thumbnail || ""}
                  onChange={() => {}}
                  onClear={() => {}}
                />
              </div>
            </Tabs>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Thời gian</div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">
                Thời gian bắt đầu và kết thúc chương trình
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Bắt đầu</div>
                  <Input
                    type="datetime-local"
                    value={activeProgram.time_start}
                    className="!text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Kết thúc</div>
                  <Input
                    type="datetime-local"
                    value={activeProgram.time_end}
                    min={activeProgram.time_start}
                    className="!text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* PDF uploader */}
          <div className="space-y-2">
            <div className="text-sm font-medium">
              Tệp PDF (thể lệ/hướng dẫn)
            </div>
            <div
              className={`relative rounded-lg border border-dashed p-4 transition ${
                pdfDragOver ? "bg-muted/30" : "bg-muted/10"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setPdfDragOver(true);
              }}
              onDragLeave={() => setPdfDragOver(false)}
              onDrop={async (e) => {
                e.preventDefault();
                setPdfDragOver(false);
                await handlePdf(e.dataTransfer.files?.[0]);
              }}
            >
              {!activeProgram.pdf_link ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <FileText className="h-5 w-5" />
                    <span>Kéo & thả PDF vào đây hoặc</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => pdfInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Tải PDF
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-5 w-5" />
                    <div className="min-w-0">
                      <div className="text-sm truncate">
                        {activeProgram.pdf_link || "file.pdf"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        window.open(activeProgram.pdf_link, "_blank")!
                      }
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Xem
                    </Button>
                    <a
                      href={activeProgram.pdf_link}
                      download={activeProgram.pdf_link || "rules.pdf"}
                      className="inline-flex"
                    >
                      <Button size="sm" variant="secondary">
                        <Download className="h-4 w-4 mr-2" />
                        Tải
                      </Button>
                    </a>
                    <Button size="sm" variant="destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Xoá
                    </Button>
                  </div>
                </div>
              )}
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={async (e) => handlePdf(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Mô tả ngắn</div>
            <div>
              <JoditEditor
                value={activeProgram.description_short}
                config={{
                  readonly: false,
                  height: 300,
                  placeholder: "Giới thiệu ngắn gọn về chương trình...",
                  beautifyHTML: true,
                  showXPathInStatusbar: false,
                  showCharsCounter: false,
                  showWordsCounter: false,
                  askBeforePasteHTML: false, // optional: avoid paste dialog
                  defaultActionOnPaste: "insert_as_html", // optional: default action on paste
                  defaultMode: 1,
                  buttons:
                    "bold,italic,underline,ul,ol,font,brush,paragraph,left,right,center,justify,undo,redo",
                }}
                tabIndex={1}
                className="text-sm"
                onChange={(newContent) => {}}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">
              Mô tả chi tiết và quy tắc tham gia
            </div>
            <div>
              <JoditEditor
                value={activeProgram.description}
                config={{
                  readonly: false,
                  height: 700,
                  placeholder: "Giới thiệu về chương trình...",
                  beautifyHTML: true,
                  showXPathInStatusbar: false,
                  showCharsCounter: false,
                  showWordsCounter: false,
                  askBeforePasteHTML: false, // optional: avoid paste dialog
                  defaultActionOnPaste: "insert_as_html", // optional: default action on paste
                  defaultMode: 1,
                  buttons:
                    "bold,italic,underline,ul,ol,font,brush,paragraph,left,right,center,justify,undo,redo",
                }}
                tabIndex={1}
                className="text-sm"
                onChange={(newContent) => {}}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </CardContent>
  );
}
