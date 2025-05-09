import * as React from "react";
import { cn } from "@/lib/utils";

interface ChartConfig {
  default: { color: string };
  normal: { color: string };
  warning: { color: string };
  danger: { color: string };
}

interface ChartContainerProps {
  children: React.ReactNode;
  config: ChartConfig;
  className?: string;
}

export function ChartContainer({ children, config, className }: ChartContainerProps) {
  return (
    <div
      className={cn(
        'relative w-full h-full',
        className
      )}
      style={{
        '--chart-default': config.default.color,
        '--chart-normal': config.normal.color,
        '--chart-warning': config.warning.color,
        '--chart-danger': config.danger.color,
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
} 