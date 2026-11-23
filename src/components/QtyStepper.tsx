import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

// Quantity stepper shared by product detail and cart lines.
export default function QtyStepper({
  value, onChange, testPrefix, max = 99,
}: {
  value: number;
  onChange: (qty: number) => void;
  testPrefix: string;
  max?: number;
}) {
  return (
    <div className="inline-flex items-center rounded-lg border border-[#E7E2DA] bg-white" data-testid={`${testPrefix}-stepper`}>
      <Button
        variant="ghost" size="icon-xs"
        aria-label="Decrease quantity"
        data-testid={`${testPrefix}-qty-minus`}
        onClick={() => onChange(Math.max(1, value - 1))}
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <span className="w-8 text-center font-mono text-sm" data-testid={`${testPrefix}-qty-value`}>{value}</span>
      <Button
        variant="ghost" size="icon-xs"
        aria-label="Increase quantity"
        data-testid={`${testPrefix}-qty-plus`}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
