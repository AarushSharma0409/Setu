import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  PropsWithChildren,
  ReactNode,
} from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-slate-950 text-white hover:bg-slate-800 focus-visible:ring-slate-500",
  secondary:
    "bg-white text-slate-950 ring-1 ring-slate-200 hover:bg-slate-50 focus-visible:ring-slate-500",
  ghost: "text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-500",
};

export function Button({
  className = "",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex min-h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60",
        buttonVariants[variant],
        className,
      ].join(" ")}
      {...props}
    />
  );
}

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={[
        "min-h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200",
        className,
      ].join(" ")}
      {...props}
    />
  );
}

export function Card({
  children,
  className = "",
}: PropsWithChildren<{ className?: string }>) {
  return (
    <section
      className={[
        "rounded-lg border border-slate-200 bg-white p-5 shadow-sm",
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}

export function PageContainer({
  children,
  className = "",
}: PropsWithChildren<{ className?: string }>) {
  return (
    <main
      className={[
        "mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8",
        className,
      ].join(" ")}
    >
      {children}
    </main>
  );
}

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
      {label}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  detail,
}: {
  title?: string;
  detail?: ReactNode;
}) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900">
      <p className="font-medium">{title}</p>
      {detail ? <div className="mt-1 text-red-700">{detail}</div> : null}
    </div>
  );
}
