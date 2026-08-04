import type { ReactNode } from "react";

type FormFieldProps = {
  children: ReactNode;
  error?: string;
  hint?: string;
  label: string;
};

export function FormField({ children, error, hint, label }: FormFieldProps) {
  return (
    <label className="ui-field">
      <span className="ui-field__label">{label}</span>
      {children}
      {hint ? <span className="ui-field__hint">{hint}</span> : null}
      {error ? <span className="ui-field__error" role="alert">{error}</span> : null}
    </label>
  );
}
