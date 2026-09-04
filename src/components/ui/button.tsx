import type { ComponentPropsWithoutRef } from "react";
import { classNames } from "@/components/ui/class-names";

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
};

export function Button({ className, fullWidth = false, size = "md", variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={classNames("btn", `btn--${variant}`, size !== "md" && `btn--${size}`, fullWidth && "btn--full", className)}
      {...props}
    />
  );
}
