import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import dayjs from "dayjs";
// Added Music and AudioLines icons
import {
  Eye,
  Trash2,
  Upload,
  FileText,
  Download,
  Music,
  AudioLines,
  SaveIcon,
  Loader,
} from "lucide-react";
import JoditEditor from "jodit-react";
import type { TProgram } from "@/react-query/services/program/program.service";
import { Tabs } from "@/components/ui/tabs";
import { ImageField } from "@/components/image-field";
import { IconBrandMiniprogram } from "@tabler/icons-react";
import { useUpdateProgramInfo } from "@/react-query/queries/program/program";
import { toast } from "react-toastify";
import { queryClient } from "@/main";
import QUERY_KEY from "@/constants/key";

export default function InfoSection({
  activeProgram,
}: {
  activeProgram: TProgram;
}) {
  const { mutate: updateProgram, isPending: isUpdatingProgram } =
    useUpdateProgramInfo();
  const [formData, setFormData] = useState<TProgram>(activeProgram);

  useEffect(() => {
    setFormData(activeProgram);
  }, [activeProgram]);

  const updateField = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const pdfInputRef = useRef<HTMLInputElement | null>(null);
  const voiceInputRef = useRef<HTMLInputElement | null>(null); // Ref for audio input

  const [pdfDragOver, setPdfDragOver] = useState(false);
  const [voiceDragOver, setVoiceDragOver] = useState(false); // State for audio drag

  const fileToDataUrl = async (file: File) => {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handlePdf = async (f?: File | null) => {
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
    updateField("pdf_link", dataUrl);
  };

  // New: Handle Audio Files
  const handleVoice = async (f?: File | null) => {
    if (!f) return;
    // Basic check for audio types
    if (!f.type.startsWith("audio/")) {
      alert("Chỉ chấp nhận file âm thanh (MP3, WAV, M4A...)");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      alert("Vui lòng chọn file âm thanh ≤ 10MB");
      return;
    }
    const dataUrl = await fileToDataUrl(f);
    updateField("audio_link", dataUrl);
  };
  const handleUpdate = () => {
    if (activeProgram) {
      updateProgram(
        {
          code: formData.code,
          description: formData.description,
          time_start_number: +dayjs(new Date(formData.time_start || "")).format(
            "YYYYMMDDHHmm"
          ),
          time_end_number: +dayjs(new Date(formData.time_end || "")).format(
            "YYYYMMDDHHmm"
          ),
          audio_link: formData.audio_link || "",
          description_short: formData.description_short,
          image_banner: formData.image_banner,
          image_thumbnail: formData.image_thumbnail,
          name: formData.name,
          pdf_link: formData.pdf_link || "",
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
    console.log("form", formData);
  };
  return (
    <CardContent className="space-y-6 w-full">
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IconBrandMiniprogram />
              Thông tin chương trình
            </div>
            <Button
              className="font-medium!"
              onClick={handleUpdate}
              disabled={isUpdatingProgram}
            >
              {isUpdatingProgram ? <Loader /> : <SaveIcon />}
              {isUpdatingProgram ? "Đang xử lí..." : " Lưu"}
            </Button>
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
                      value={formData.code || ""}
                      onChange={(e) => updateField("code", e.target.value)}
                      placeholder="Mã chương trình"
                      className="max-w-40 uppercase font-medium"
                    />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="text-xs text-muted-foreground">
                      Tên chương trình
                    </div>
                    <Input
                      value={formData.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      className="flex-1"
                      placeholder="Tên chương trình"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">
                      Trạng thái
                    </div>
                    <button
                      onClick={() => updateField("status", !formData.status)}
                      className={`shrink-0 inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] cursor-pointer transition ${
                        formData.status
                          ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                          : "bg-neutral-50 border-neutral-200 text-neutral-600"
                      }`}
                    >
                      {formData.status ? "Đang bật" : "Đang tắt"}
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

            <Tabs defaultValue="banner" className="w-full">
              <div className="grid gap-4 md:grid-cols-2">
                <ImageField
                  label="Banner"
                  hint="Tỉ lệ 3:1 • gợi ý 1500×500"
                  value={formData?.image_banner || ""}
                  onChange={(val) => updateField("image_banner", val)}
                  onClear={() => updateField("image_banner", null)}
                />

                <ImageField
                  label="Thumbnail"
                  hint="Tỉ lệ 1:1 • gợi ý 600×600"
                  value={formData?.image_thumbnail || ""}
                  onChange={(val) => updateField("image_thumbnail", val)}
                  onClear={() => updateField("image_thumbnail", null)}
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
                    value={formData.time_start || ""}
                    onChange={(e) => updateField("time_start", e.target.value)}
                    className="!text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Kết thúc</div>
                  <Input
                    type="datetime-local"
                    value={formData.time_end || ""}
                    onChange={(e) => updateField("time_end", e.target.value)}
                    min={formData.time_start}
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
              {!formData.pdf_link ? (
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
                        {formData.pdf_link || "file.pdf"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => window.open(formData.pdf_link, "_blank")!}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Xem
                    </Button>
                    <a
                      href={formData.pdf_link}
                      download={formData.pdf_link || "rules.pdf"}
                      className="inline-flex"
                    >
                      <Button size="sm" variant="secondary">
                        <Download className="h-4 w-4 mr-2" />
                        Tải
                      </Button>
                    </a>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateField("pdf_link", null)}
                    >
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

          {/* -------------------------------------------------------- */}
          {/* NEW: VOICE / AUDIO UPLOADER SECTION                      */}
          {/* -------------------------------------------------------- */}
          <div className="space-y-2">
            <div className="text-sm font-medium">
              Tệp âm thanh (Voice giới thiệu)
            </div>
            <div
              className={`relative rounded-lg border border-dashed p-4 transition ${
                voiceDragOver ? "bg-muted/30" : "bg-muted/10"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setVoiceDragOver(true);
              }}
              onDragLeave={() => setVoiceDragOver(false)}
              onDrop={async (e) => {
                e.preventDefault();
                setVoiceDragOver(false);
                await handleVoice(e.dataTransfer.files?.[0]);
              }}
            >
              {!formData.audio_link ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <AudioLines className="h-5 w-5" />
                    <span>Kéo & thả file âm thanh hoặc</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => voiceInputRef.current?.click()}
                  >
                    <Music className="h-4 w-4 mr-2" />
                    Tải Voice
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Music className="h-5 w-5 text-emerald-600" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-emerald-700">
                          Đã tải lên tệp âm thanh
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateField("audio_link", null)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Xoá
                    </Button>
                  </div>
                  {/* Audio Preview Player */}
                  <audio
                    controls
                    className="w-full h-8 block"
                    src={formData.audio_link}
                  />
                </div>
              )}
              <input
                ref={voiceInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={async (e) => handleVoice(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          {/* -------------------------------------------------------- */}

          <div className="space-y-2">
            <div className="text-sm font-medium">Mô tả ngắn</div>
            <div>
              <JoditEditor
                value={formData.description_short}
                config={{
                  readonly: false,
                  height: 300,
                  placeholder: "Giới thiệu ngắn gọn về chương trình...",
                  beautifyHTML: true,
                  defaultMode: 1,
                  buttons:
                    "bold,italic,underline,ul,ol,font,brush,paragraph,left,right,center,justify,undo,redo",
                }}
                tabIndex={1}
                className="text-sm"
                onBlur={(newContent) =>
                  updateField("description_short", newContent)
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">
              Mô tả chi tiết và quy tắc tham gia
            </div>
            <div>
              <JoditEditor
                value={formData.description}
                config={{
                  readonly: false,
                  height: 700,
                  placeholder: "Giới thiệu về chương trình...",
                  beautifyHTML: true,
                  defaultMode: 1,
                  buttons:
                    "bold,italic,underline,ul,ol,font,brush,paragraph,left,right,center,justify,undo,redo",
                }}
                tabIndex={1}
                className="text-sm"
                onBlur={(newContent) => updateField("description", newContent)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </CardContent>
  );
}
