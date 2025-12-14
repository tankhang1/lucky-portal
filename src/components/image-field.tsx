import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Image as ImageIcon,
  MoreHorizontal,
  Upload,
  Eye,
  Trash2,
} from "lucide-react";
import * as React from "react";

type ImageFieldProps = {
  label: string;
  hint?: string;
  value: string;
  onChange: (file: File) => void;
  onClear: () => void;
};

export function ImageField({
  label,
  hint,
  value,
  onChange,
  onClear,
}: ImageFieldProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);

  const pick = () => inputRef.current?.click();
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) return;
    if (f.size > 2 * 1024 * 1024) {
      alert("Vui lòng chọn ảnh ≤ 2MB");
      return;
    }
    onChange(f);
    e.currentTarget.value = "";
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{label}</CardTitle>
        {hint ? (
          <CardDescription className="text-[11px]">{hint}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>
        <div
          className="relative group"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (!f || !f.type.startsWith("image/")) return;
            if (f.size > 2 * 1024 * 1024) {
              alert("Vui lòng chọn ảnh ≤ 2MB");
              return;
            }
            onChange(f);
          }}
        >
          <div
            className="h-56 w-full overflow-hidden rounded-xl ring-1 ring-border bg-gradient-to-br from-muted/60 to-muted/20 grid place-items-center"
            onClick={pick}
          >
            {value ? (
              <img
                src={value}
                alt=""
                className="h-full w-full object-cover transition group-hover:scale-[1.01]"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
                <ImageIcon className="h-5 w-5" />
                <div>Nhấn để chọn ảnh hoặc kéo-thả vào đây</div>
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                className="absolute right-2 top-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={6}>
              <DropdownMenuItem
                className="flex items-center gap-2"
                onClick={pick}
              >
                <Upload className="h-4 w-4" />
                Tải ảnh
              </DropdownMenuItem>

              {value && (
                <DropdownMenuItem
                  className="flex items-center gap-2"
                  onClick={() => setPreview(value)}
                >
                  <Eye className="h-4 w-4" />
                  Xem lớn
                </DropdownMenuItem>
              )}

              {value && (
                <DropdownMenuItem
                  className="flex items-center gap-2 text-red-600"
                  onClick={onClear}
                >
                  <Trash2 className="h-4 w-4" />
                  Xoá ảnh
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFile}
          />
        </div>

        <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
          <DialogTrigger asChild></DialogTrigger>
          <DialogTitle></DialogTitle>
          <DialogContent className="max-w-3xl">
            {preview ? (
              <img
                src={preview}
                alt=""
                className="w-full h-auto rounded-xl object-contain"
              />
            ) : null}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
