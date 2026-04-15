import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "urgent" | "success";
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
      secondary: "bg-slate-700/50 text-slate-300 border border-slate-600/30",
      urgent: "bg-red-500/20 text-red-400 border border-red-500/30",
      success: "bg-green-500/20 text-green-400 border border-green-500/30",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
