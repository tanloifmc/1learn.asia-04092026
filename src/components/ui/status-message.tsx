import type { ReactNode } from "react";
import { classNames } from "@/components/ui/class-names";

type StatusMessageProps = {
  children: ReactNode;
  tone?: "error" | "info" | "success";
};

export function StatusMessage({ children, tone = "info" }: StatusMessageProps) {
  return <p className={classNames("ui-status-message", `ui-status-message--${tone}`)} role={tone === "error" ? "alert" : "status"}>{children}</p>;
}
