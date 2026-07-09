import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, required, error, hint, children, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center gap-1">
        <label className="text-[12px] font-semibold text-neutral-600 dark:text-neutral-400 tracking-wide uppercase">
          {label}
        </label>
        {required && <span className="text-red-500 text-[13px] leading-none mt-0.5">*</span>}
      </div>
      <div className={cn(error && "[&_input]:border-red-400 [&_input]:dark:border-red-500 [&_.phone-wrap]:border-red-400")}>
        {children}
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-red-500 dark:text-red-400">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <p className="text-[11px] font-medium">{error}</p>
        </div>
      )}
      {hint && !error && (
        <p className="text-[11px] text-neutral-400 dark:text-neutral-500">{hint}</p>
      )}
    </div>
  );
}
