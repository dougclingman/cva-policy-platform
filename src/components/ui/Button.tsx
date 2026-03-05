import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variantClasses = {
  primary:   "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 border-transparent",
  secondary: "bg-white text-slate-700 hover:bg-gray-50 focus:ring-blue-500 border-gray-300",
  danger:    "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 border-transparent",
  ghost:     "bg-transparent text-slate-600 hover:bg-gray-100 focus:ring-blue-500 border-transparent",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
};

export function Button({ variant = "primary", size = "md", loading, children, className, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
}
