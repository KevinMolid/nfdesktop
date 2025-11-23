import React from "react";

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

type ButtonProps = {
  children: React.ReactNode;
  variant?:
    | "primary"
    | "secondary"
    | "tertiary"
    | "destructive"
    | "transparent";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  ref?: any;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  iconLeft,
  iconRight,
  className,
  ref,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        // Base button styles
        "inline-flex items-center justify-center font-medium rounded-md transition-colors select-none whitespace-nowrap",
        "focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer",

        // SIZES
        {
          xs: "h-7 px-2 text-xs",
          sm: "h-8 px-3 text-sm",
          md: "h-10 px-4 text-base",
          lg: "h-12 px-6 text-lg",
          xl: "h-14 px-8 text-xl",
        }[size],

        // VARIANTS
        {
          primary:
            "bg-(--brand-color) text-white hover:bg-(--brand2-color) focus:ring-(--text-color)",
          secondary:
            "bg-(--text2-color) text-(--main-bg-color) hover:bg-(--text-color) focus:ring-(--text-color)",
          tertiary:
            "bg-(--bg4-color) text-(--text4-color) hover:bg-(--bg5-color) focus:ring-(--text-color)",
          destructive:
            "bg-[#cc3b3b] text-white hover:bg-red-700 focus:ring-red-300",
          transparent:
            "bg-transparent hover:bg-(--bg4-color) text-(--text4-color) focus:ring-(--text-color)",
        }[variant],

        // Full width
        fullWidth && "w-full",

        className
      )}
    >
      {iconLeft && <span className="mr-2">{iconLeft}</span>}
      {children}
      {iconRight && <span className="ml-2">{iconRight}</span>}
    </button>
  );
}
