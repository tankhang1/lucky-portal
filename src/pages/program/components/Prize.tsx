import { useEffect, useState, useRef } from "react";
import ActionIcon from "@/components/action-icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAddProgramPrize,
  useDeactiveProgramPrize,
  useSearchGift,
  useUpdateProgramPrize,
} from "@/react-query/queries/program/program";
import type { TProgramPrizeReq } from "@/react-query/services/program/program.service";
import {
  Eye,
  ImageIcon,
  MoreHorizontal,
  Plus,
  Trash2,
  Upload,
  Pencil, // Icon Sửa
  Check, // Icon Lưu
  X, // Icon Hủy
} from "lucide-react";
import { toast } from "react-toastify";
import { queryClient } from "@/main";
import QUERY_KEY from "@/constants/key";
import { useUploadGift } from "@/react-query/queries/media/media";

// Mở rộng type để quản lý trạng thái local
type TPrizeState = TProgramPrizeReq & {
  isNew?: boolean;
  id?: string | number;
  status?: number;
};

// --- Helper: File to Base64 ---
const fileToDataUrl = async (file: File) => {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// --- Row Component ---
const PrizeRow = ({
  item,
  index,
  onSave,
  onDelete,
  onCancelNew, // Prop mới để xử lý hủy khi đang tạo mới
}: {
  item: TPrizeState;
  index: number;
  onSave: (item: TPrizeState) => Promise<void>; // Promise để xử lý loading nút Save
  onDelete: (item: TPrizeState) => void;
  onCancelNew: () => void;
}) => {
  // State quản lý chế độ Edit
  const [isEditing, setIsEditing] = useState(!!item.isNew);
  const [formData, setFormData] = useState<TPrizeState>(item);
  const [isSaving, setIsSaving] = useState(false); // Loading state cho nút Save row này

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: uploadGift } = useUploadGift();

  // Sync state nếu data cha thay đổi
  useEffect(() => {
    setFormData(item);
  }, [item]);

  const handleChange = (field: keyof TPrizeState, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveClick = async () => {
    setIsSaving(true);
    try {
      console.log(formData);
      await onSave(formData);
      setIsEditing(false); // Tắt chế độ edit sau khi lưu thành công
    } catch (error) {
      console.error("Save failed", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelClick = () => {
    if (item.isNew) {
      // Nếu là dòng mới chưa lưu mà bấm hủy -> Xóa luôn dòng đó
      onCancelNew();
    } else {
      // Nếu là dòng cũ -> Reset data về ban đầu và tắt edit
      setFormData(item);
      setIsEditing(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Vui lòng chọn ảnh ≤ 2MB");
      return;
    }
    if (!formData.gift_code) {
      alert("Vui lòng nhập mã giải thưởng");
      return;
    }
    if (file) {
      uploadGift(
        {
          c: formData.campaign_code,
          g: formData.gift_code,
          file: file,
        },
        {
          onSuccess: (message) => {
            console.log("image_thumbnail", message);
            setFormData((prev) => ({
              ...prev,
              gift_image: `${import.meta.env.VITE_API_URL}/image/${
                formData.gift_code
              }_${formData.campaign_code}.jpg`,
              gift_image_thumb: `${import.meta.env.VITE_API_URL}/image/${
                formData.gift_code
              }_${formData.campaign_code}.jpg`,
            }));
          },
          onError: () => {
            toast.error("Upload ảnh thất bại");
          },
        }
      );
    }
  };

  return (
    <TableRow
      className={`transition-colors [&>td]:px-3 [&>td]:py-2 ${
        isEditing ? "bg-muted/40" : "hover:bg-muted/50"
      }`}
    >
      <TableCell className="text-center">{index + 1}</TableCell>

      {/* Gift Name */}
      <TableCell>
        <Input
          disabled={!isEditing}
          value={formData.gift_name}
          onChange={(e) => handleChange("gift_name", e.target.value)}
          placeholder="Tên quà..."
          className={`h-8 ${
            !isEditing
              ? "border-transparent bg-transparent shadow-none px-0"
              : ""
          }`}
        />
      </TableCell>

      {/* Award Name */}
      <TableCell>
        <Input
          disabled={!isEditing}
          value={formData.award_name}
          onChange={(e) => handleChange("award_name", e.target.value)}
          placeholder="Tên giải..."
          className={`h-8 ${
            !isEditing
              ? "border-transparent bg-transparent shadow-none px-0"
              : ""
          }`}
        />
      </TableCell>

      {/* Image Handling - Chỉ cho phép sửa khi isEditing = true */}
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="relative group">
            {formData.gift_image ? (
              <img
                src={`${formData.gift_image}?t=${new Date().getTime()}`}
                alt=""
                className="h-10 w-10 rounded-md object-cover ring-1 ring-border bg-background"
              />
            ) : (
              <div className="h-10 w-10 rounded-md ring-1 ring-border flex items-center justify-center text-muted-foreground bg-muted/30">
                <ImageIcon className="h-4 w-4" />
              </div>
            )}

            {/* Chỉ hiện menu thao tác ảnh khi đang ở chế độ Edit */}
            {isEditing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute -right-2 -top-2 h-6 w-6 rounded-full shadow-sm"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {formData.gift_image ? "Đổi ảnh" : "Tải ảnh"}
                  </DropdownMenuItem>
                  {formData.gift_image && (
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          gift_image: "",
                          gift_image_thumb: "",
                        }));
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Xoá ảnh
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>
      </TableCell>

      {/* Gift Code */}
      <TableCell className="text-left">
        <Input
          disabled={!isEditing || (!item.isNew && !!item.gift_code)} // Code thường không cho sửa khi đã tạo
          value={formData.gift_code}
          onChange={(e) => handleChange("gift_code", e.target.value)}
          placeholder="Mã quà..."
          className={`h-8 font-mono text-xs${
            !isEditing
              ? "border-transparent bg-transparent shadow-none px-0"
              : ""
          }`}
        />
      </TableCell>

      {/* Limits */}
      <TableCell className="text-left">
        <Input
          disabled={!isEditing}
          type="number"
          min={0}
          value={formData.limits}
          onChange={(e) => handleChange("limits", Number(e.target.value))}
          className={`text-right h-8 ${
            !isEditing
              ? "border-transparent bg-transparent shadow-none px-0"
              : ""
          }`}
        />
      </TableCell>
      <TableCell className="text-center">
        <Input
          disabled={!isEditing}
          type="checkbox"
          value={formData.type_extra}
          onChange={(e) => handleChange("type_extra", Number(e.target.checked))}
          className={`text-right h-8 ${
            !isEditing
              ? "border-transparent bg-transparent shadow-none px-0"
              : ""
          }`}
        />
      </TableCell>
      <TableCell className="text-center">
        {!isEditing && (
          <Input
            disabled={true}
            type="text"
            value={formData.status === 1 ? "Hoạt động" : "Tạm ngưng"}
            className={`text-right h-8 border-transparent bg-transparent shadow-none px-0 ${
              formData.status === 1 ? "text-green-500" : "text-red-500"
            } `}
          />
        )}
      </TableCell>

      {/* Actions Column */}
      <TableCell className="text-center">
        <div className="flex items-center justify-end gap-1">
          {isEditing ? (
            <>
              {/* Nút Lưu */}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                onClick={handleSaveClick}
                disabled={isSaving}
              >
                <Check className="h-4 w-4" />
              </Button>
              {/* Nút Hủy */}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                onClick={handleCancelClick}
                disabled={isSaving}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              {/* Nút Sửa */}
              <ActionIcon label="Chỉnh sửa" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4" />
              </ActionIcon>
              {/* Nút Xóa */}
              {formData.status === 1 && (
                <ActionIcon label="Xoá" onClick={() => onDelete(item)}>
                  <Trash2 className="h-4 w-4" />
                </ActionIcon>
              )}
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};

// --- Main Container ---
const PrizeSection = ({ code }: { code: string }) => {
  const { data: gifts, isLoading } = useSearchGift({
    campaignCode: code,
    type: "0",
  });

  const [items, setItems] = useState<TPrizeState[]>([]);

  useEffect(() => {
    if (gifts) {
      const mapped = gifts.map((g: any) => ({
        campaign_code: code,
        award_name: g.award_name,
        gift_code: g.gift_code,
        gift_name: g.gift_name,
        gift_image: g.gift_image,
        gift_image_thumb: g.gift_image_thumb || g.gift_image,
        limits: g.limits || g.counter || 0,
        type_extra: g.type_extra || 0,
        id: g.id,
      }));
      setItems(mapped);
    }
  }, [gifts, code]);

  const { mutateAsync: addPrize } = useAddProgramPrize();
  const { mutateAsync: updatePrize } = useUpdateProgramPrize();
  const { mutate: deactivePrize } = useDeactiveProgramPrize();

  // Thêm dòng mới (IsNew = true)
  const handleAddRow = () => {
    const newItem: TPrizeState = {
      campaign_code: code,
      award_name: "",
      gift_code: "",
      gift_name: "",
      gift_image: "",
      gift_image_thumb: "",
      limits: 1,
      type_extra: 0,
      isNew: true, // Cờ đánh dấu để Row tự bật chế độ Edit
    };
    setItems((prev) => [newItem, ...prev]); // Thêm lên đầu danh sách cho dễ thấy
  };

  // Xử lý Lưu (Gọi API)
  const handleSaveItem = async (item: TPrizeState) => {
    const { isNew, id, ...payload } = item;

    // Validate cơ bản
    if (!payload.gift_code || !payload.award_name) {
      alert("Vui lòng nhập tên giải và mã quà");
      throw new Error("Validation failed");
    }

    if (isNew) {
      await addPrize(payload, {
        onSuccess: (data) => {
          setItems((prev) =>
            prev.map((p) => (p === item ? { ...item, isNew: false } : p))
          );
          toast.success(data.message);
        },
        onError: (error) => {
          //@ts-expect-error no check
          toast.error(error.response?.data?.message || "Đã có lỗi xảy ra!");
        },
        onSettled: () => {
          queryClient.invalidateQueries({
            queryKey: [QUERY_KEY.PROGRAM.GIFT_LIST],
          });
        },
      });
    } else {
      await updatePrize(payload, {
        onSuccess: (data) => {
          toast.success(data.message);
        },
        onError: (error) => {
          //@ts-expect-error no check
          toast.error(error.response?.data?.message || "Đã có lỗi xảy ra!");
        },
        onSettled: () => {
          queryClient.invalidateQueries({
            queryKey: [QUERY_KEY.PROGRAM.GIFT_LIST],
          });
        },
      });
    }
  };

  // Xử lý Xóa (API Deactive)
  const handleDeleteItem = (item: TPrizeState) => {
    if (confirm("Bạn có chắc chắn muốn xóa giải thưởng này?")) {
      const { isNew, id, ...payload } = item;
      deactivePrize(payload);
      // Optimistic update: Xóa khỏi list ngay lập tức
      setItems((prev) => prev.filter((i) => i.gift_code !== item.gift_code));
    }
  };

  // Xử lý Hủy dòng mới (Xóa khỏi UI)
  const handleCancelNewRow = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4 px-4">
      <div className="flex items-center justify-between">
        <div className="font-medium">Danh mục giải</div>
        <Button size="sm" onClick={handleAddRow} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm giải
        </Button>
      </div>

      <ScrollArea className="h-[360px] rounded-md border">
        <Table className="text-sm">
          <TableHeader className="sticky top-0 bg-background/95 backdrop-blur z-10">
            <TableRow className="[&>th]:h-10 [&>th]:px-3">
              <TableHead className="w-10 text-center">#</TableHead>
              <TableHead className="min-w-[180px]">Tên quà</TableHead>
              <TableHead className="min-w-[180px]">Tên giải</TableHead>
              <TableHead className="min-w-[100px]">Hình ảnh</TableHead>
              <TableHead className="min-w-[160px]">Mã quà</TableHead>
              <TableHead className="min-w-[140px] text-right">
                Số lượng
              </TableHead>
              <TableHead className="min-w-[80px] text-right">
                Quà Extra
              </TableHead>
              <TableHead className="min-w-[150px] text-right">
                Trạng thái
              </TableHead>
              <TableHead className="min-w-[100px] text-right">
                Hành động
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="[&>tr:nth-child(even)]:bg-muted/30">
            {items.map((item, i) => (
              <PrizeRow
                key={item.gift_code || `new-${i}`} // Key fallback cho item mới chưa có code
                index={i}
                item={item}
                onSave={handleSaveItem}
                onDelete={handleDeleteItem}
                onCancelNew={() => handleCancelNewRow(i)}
              />
            ))}
            {!isLoading && items.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  Chưa có giải thưởng nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default PrizeSection;
