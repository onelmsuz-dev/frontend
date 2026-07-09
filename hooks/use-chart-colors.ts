"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function useChartColors() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return {
    grid: isDark ? "#262626" : "#f0f0f0",
    axis: isDark ? "#525252" : "#9ca3af",
    tooltip: isDark ? "#171717" : "#ffffff",
    tooltipBorder: isDark ? "#404040" : "#e5e7eb",
    tooltipText: isDark ? "#e5e5e5" : "#111827",
  };
}
