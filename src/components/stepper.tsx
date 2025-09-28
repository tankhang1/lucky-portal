import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check } from "lucide-react";

type Step = {
  id: string;
  label: string;
  optional?: boolean;
  disabled?: boolean;
};
type Orientation = "horizontal" | "vertical";

type StepperProps = {
  steps: Step[];
  value?: number;
  defaultValue?: number;
  onValueChange?: (index: number) => void;
  orientation?: Orientation;
  className?: string;
  children?: React.ReactNode;
};

export function Stepper({
  steps,
  value,
  defaultValue = 0,
  onValueChange,
  orientation = "horizontal",
  children,
  className,
}: StepperProps) {
  const [internal, setInternal] = React.useState(defaultValue);
  const current = value ?? internal;

  const setCurrent = (i: number) => {
    if (i < 0 || i >= steps.length) return;
    onValueChange ? onValueChange(i) : setInternal(i);
  };

  const next = () => setCurrent(current + 1);
  const prev = () => setCurrent(current - 1);

  return (
    <div className={cn("w-full space-y-4", className)}>
      {orientation === "horizontal" ? (
        <div className="flex items-center gap-4 px-4">
          {steps.map((s, i) => {
            const complete = i < current;
            const active = i === current;
            return (
              <React.Fragment key={s.id}>
                <button
                  type="button"
                  disabled={s.disabled}
                  onClick={() => setCurrent(i)}
                  className={cn(
                    "flex items-center gap-2 outline-none !bg-white",
                    s.disabled && "opacity-50 cursor-not-allowed"
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  <span
                    className={cn(
                      "grid h-8 w-8 place-items-center rounded-full border text-sm",
                      complete &&
                        "bg-primary text-primary-foreground border-primary",
                      active && !complete && "border-primary text-primary",
                      !complete &&
                        !active &&
                        "border-muted-foreground/30 text-muted-foreground"
                    )}
                  >
                    {complete ? <Check className="h-4 w-4" /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      "text-sm",
                      active ? "font-medium" : "text-muted-foreground"
                    )}
                  >
                    {s.label}
                    {s.optional ? (
                      <span className="ml-1 text-[11px] text-muted-foreground">
                        (tuỳ chọn)
                      </span>
                    ) : null}
                  </span>
                </button>
                {i !== steps.length - 1 && (
                  <div className="flex-1">
                    <Separator className="hidden sm:block" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-4">
          {steps.map((s, i) => {
            const complete = i < current;
            const active = i === current;
            return (
              <div key={s.id} className="flex gap-3">
                <button
                  type="button"
                  disabled={s.disabled}
                  onClick={() => setCurrent(i)}
                  className={cn(
                    "mt-0.5 h-7 w-7 shrink-0 rounded-full border grid place-items-center text-xs",
                    complete &&
                      "bg-primary text-primary-foreground border-primary",
                    active &&
                      !complete &&
                      "border-primary text-primary font-semibold",
                    !complete &&
                      !active &&
                      "border-muted-foreground/30 text-muted-foreground",
                    s.disabled && "opacity-50 cursor-not-allowed"
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  {complete ? <Check className="h-4 w-4" /> : i + 1}
                </button>
                <div className="flex-1">
                  <div
                    className={cn(
                      "text-sm",
                      active ? "font-medium" : "text-muted-foreground"
                    )}
                  >
                    {s.label}
                    {s.optional ? (
                      <span className="ml-1 text-[11px] text-muted-foreground">
                        (tuỳ chọn)
                      </span>
                    ) : null}
                  </div>
                  {i !== steps.length - 1 && (
                    <div className="ml-3 border-l pl-6 pt-3">
                      <Separator />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {children}
      <div className="mt-4 flex items-center justify-between px-4">
        <Button variant="outline" disabled={current <= 0} onClick={prev}>
          Trước
        </Button>
        <div className="text-xs text-muted-foreground">
          Bước {current + 1}/{steps.length}
        </div>
        <Button disabled={current >= steps.length - 1} onClick={next}>
          Tiếp
        </Button>
      </div>
    </div>
  );
}
export default Stepper;
