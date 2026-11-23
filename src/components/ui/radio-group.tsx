import * as React from "react";
import { cn } from "@/lib/utils";

interface RadioGroupContextValue {
  value?: string;
  onValueChange?: (val: string) => void;
  name?: string;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue>({});

export function RadioGroup({
  className,
  value,
  onValueChange,
  name,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  value?: string;
  onValueChange?: (val: string) => void;
  name?: string;
}) {
  const generatedName = React.useId();
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange, name: name || generatedName }}>
      <div role="radiogroup" className={cn("grid gap-2", className)} {...props}>
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
}

export function RadioGroupItem({
  className,
  value,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { value: string }) {
  const context = React.useContext(RadioGroupContext);
  const checked = context.value === value;

  return (
    <input
      type="radio"
      name={context.name}
      value={value}
      checked={checked}
      onChange={() => context.onValueChange?.(value)}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary accent-[#991B1B] cursor-pointer",
        className
      )}
      {...props}
    />
  );
}
