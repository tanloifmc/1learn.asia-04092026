import type { ComponentPropsWithoutRef } from "react";
import { classNames } from "@/components/ui/class-names";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md";
  fullWidth?: boolean;
};

export function Button({ className, fullWidth = false, size = "md", variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={classNames("ui-button", `ui-button--${variant}`, `ui-button--${size}`, fullWidth && "ui-button--full", className)}
      {...props}
    />
  );
}
