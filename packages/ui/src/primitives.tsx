import {
  forwardRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type LabelHTMLAttributes,
  type PropsWithChildren,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

type ButtonVariant =
  "primary" | "secondary" | "outline" | "ghost" | "danger" | "link";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "setu-button-primary",
  secondary: "setu-button-secondary",
  outline: "setu-button-outline",
  ghost: "setu-button-ghost",
  danger: "setu-button-danger",
  link: "setu-button-link",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "setu-button-sm",
  md: "setu-button-md",
  lg: "setu-button-lg",
  icon: "setu-button-icon",
};

export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      children,
      className,
      disabled,
      loading = false,
      size = "md",
      variant = "primary",
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        aria-busy={loading || undefined}
        className={cx(
          "setu-button",
          buttonVariants[variant],
          buttonSizes[size],
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Spinner size="sm" label="" /> : null}
        <span>{loading ? "Working…" : children}</span>
      </button>
    );
  },
);

export const IconButton = forwardRef<HTMLButtonElement, ButtonProps>(
  function IconButton(props, ref) {
    return (
      <Button
        ref={ref}
        aria-label={props["aria-label"] ?? "Action"}
        size="icon"
        {...props}
      />
    );
  },
);

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx("setu-input", className)} {...props} />;
}

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cx("setu-input setu-textarea", className)}
      {...props}
    />
  );
});

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx("setu-input", className)} {...props} />;
}

export function FormField({
  children,
  description,
  error,
  htmlFor,
  label,
  required,
}: PropsWithChildren<{
  description?: ReactNode;
  error?: ReactNode;
  htmlFor: string;
  label: string;
  required?: boolean;
}>) {
  const descriptionId = `${htmlFor}-description`;
  const errorId = `${htmlFor}-error`;
  return (
    <div className="setu-field">
      <label className="setu-label" htmlFor={htmlFor}>
        {label}
        {required ? (
          <span aria-hidden="true" className="setu-required" />
        ) : null}
      </label>
      {description ? (
        <p className="setu-field-description" id={descriptionId}>
          {description}
        </p>
      ) : null}
      {children}
      {error ? (
        <p className="setu-field-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Card({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLElement>>) {
  return (
    <section className={cx("setu-card", className)} {...props}>
      {children}
    </section>
  );
}

export function PageContainer({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLElement>>) {
  return (
    <main
      className={cx("setu-page-container", className)}
      id={props.id ?? "main-content"}
      {...props}
    >
      {children}
    </main>
  );
}

export function PageHeader({
  actions,
  eyebrow,
  title,
  description,
}: {
  actions?: ReactNode;
  eyebrow?: string;
  title: string;
  description?: ReactNode;
}) {
  return (
    <header className="setu-page-header">
      <div>
        {eyebrow ? <p className="setu-eyebrow">{eyebrow}</p> : null}
        <h1 className="setu-page-title">{title}</h1>
        {description ? (
          <p className="setu-page-description">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="setu-page-actions">{actions}</div> : null}
    </header>
  );
}

export function SectionHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="setu-section-header">
      <div>
        <h2 className="setu-section-title">{title}</h2>
        {description ? (
          <p className="setu-section-description">{description}</p>
        ) : null}
      </div>
      {actions ? <div>{actions}</div> : null}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  return (
    <span className={cx("setu-badge", `setu-badge-${tone}`)}>{children}</span>
  );
}

const statusTone = (
  status: string,
): "neutral" | "success" | "warning" | "danger" | "info" => {
  if (["APPROVED", "RESOLVED", "ACTIVE", "UPLOADED"].includes(status))
    return "success";
  if (
    [
      "PENDING_REVIEW",
      "PENDING_VERIFICATION",
      "VIEWED",
      "CONTACTED",
      "IN_PROGRESS",
      "NEW",
    ].includes(status)
  )
    return "warning";
  if (
    ["REJECTED", "SUSPENDED", "CLOSED", "WITHDRAWN", "DISABLED"].includes(
      status,
    )
  )
    return "danger";
  return "neutral";
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone(status)}>{status.replaceAll("_", " ")}</Badge>;
}

export function Alert({
  children,
  title,
  tone = "info",
}: {
  children?: ReactNode;
  title?: string;
  tone?: "info" | "success" | "warning" | "danger";
}) {
  return (
    <div
      className={cx("setu-alert", `setu-alert-${tone}`)}
      role={tone === "danger" ? "alert" : "status"}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      {children ? (
        <div className={title ? "mt-1" : undefined}>{children}</div>
      ) : null}
    </div>
  );
}

export function Spinner({
  label = "Loading",
  size = "md",
}: {
  label?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      aria-label={label || undefined}
      className={cx(
        "setu-spinner",
        size === "sm" ? "setu-spinner-sm" : "setu-spinner-md",
      )}
      role="status"
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cx("setu-skeleton", className)} />;
}

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="setu-state" role="status">
      <Spinner />
      <span>{label}</span>
    </div>
  );
}

export function EmptyState({
  action,
  description,
  title,
  icon,
}: {
  action?: ReactNode;
  description?: ReactNode;
  title: string;
  icon?: ReactNode;
}) {
  return (
    <div className="setu-empty-state">
      {icon ? (
        <div className="setu-empty-icon" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <h2 className="setu-section-title">{title}</h2>
      {description ? (
        <p className="setu-state-description">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  detail,
  action,
}: {
  title?: string;
  detail?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="setu-alert setu-alert-danger" role="alert">
      <p className="font-semibold">{title}</p>
      {detail ? <div className="mt-1">{detail}</div> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Progress({ value, label }: { value: number; label?: string }) {
  const safeValue = Math.min(100, Math.max(0, value));
  return (
    <div className="setu-progress-wrapper">
      {label ? (
        <div className="mb-1 flex justify-between text-xs font-medium">
          <span>{label}</span>
          <span>{safeValue}%</span>
        </div>
      ) : null}
      <div
        aria-label={label ?? "Progress"}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={safeValue}
        className="setu-progress"
        role="progressbar"
      >
        <span style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

export function SkipLink() {
  return (
    <a className="setu-skip-link" href="#main-content">
      Skip to content
    </a>
  );
}

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cx("setu-label", props.className)} {...props} />;
}
