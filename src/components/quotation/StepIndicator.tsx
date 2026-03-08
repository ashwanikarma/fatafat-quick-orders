import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = ["Sponsor", "Members", "Health Declaration", "Quotation", "KYC", "Payment"];

interface StepIndicatorProps {
  currentStep: number;
}

const StepIndicator = ({ currentStep }: StepIndicatorProps) => {
  return (
    <div className="mb-6 sm:mb-8">
      {/* Mobile: compact view with current step label */}
      <div className="flex items-center justify-center gap-1 sm:hidden px-2">
        {steps.map((label, i) => {
          const isCompleted = i < currentStep;
          const isCurrent = i === currentStep;
          return (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-colors",
                    isCompleted && "bg-primary text-primary-foreground",
                    isCurrent && "bg-primary text-primary-foreground ring-2 ring-primary/20",
                    !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="h-3 w-3" /> : i + 1}
                </div>
                {isCurrent && (
                  <span className="text-[10px] font-medium text-primary whitespace-nowrap">
                    {label}
                  </span>
                )}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-4 mx-0.5 mt-[-0.75rem]",
                    i < currentStep ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Desktop: full labels */}
      <div className="hidden sm:flex items-center justify-center gap-0 px-2">
        {steps.map((label, i) => {
          const isCompleted = i < currentStep;
          const isCurrent = i === currentStep;
          return (
            <div key={label} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors",
                    isCompleted && "bg-primary text-primary-foreground",
                    isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium whitespace-nowrap",
                    isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-16 md:w-24 mx-2 mt-[-1.25rem]",
                    i < currentStep ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;
