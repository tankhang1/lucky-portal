import React from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

type ErrorPageProps = {
  status?: number | string;
  title?: string;
  message?: string;
  onRetry?: () => void;
  homeHref?: string;
};

const ErrorPage: React.FC<ErrorPageProps> = ({
  status = 500,
  title = "Có lỗi xảy ra",
  message = "Đã có lỗi không mong muốn. Vui lòng thử lại sau hoặc quay về trang chủ.",
  onRetry,
  homeHref = "/",
}) => {
  const handleRetry = () => {
    if (onRetry) onRetry();
    else if (typeof window !== "undefined") window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 to-background flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        <div className="relative overflow-hidden rounded-2xl border bg-white shadow-sm">
          {/* Accent strip */}

          <div className="p-8 sm:p-10">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 ring-1 ring-rose-100">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="text-sm uppercase tracking-wider text-rose-600/80">
                  Lỗi {status}
                </div>
                <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
              </div>
            </div>

            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              {message}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={handleRetry}
                className="inline-flex items-center gap-2 rounded-xl border !bg-black text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition"
              >
                <RotateCcw className="h-4 w-4" />
                Thử lại
              </button>

              <a
                href={"/auth"}
                className="inline-flex items-center gap-2 rounded-xl border border-input bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50 transition"
              >
                <Home className="h-4 w-4" />
                Về trang chủ
              </a>
            </div>
          </div>
        </div>

        {/* subtle footer hint */}
        <div className="mt-4 text-center text-xs text-muted-foreground">
          Nếu vấn đề tiếp diễn, vui lòng liên hệ hỗ trợ.
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
