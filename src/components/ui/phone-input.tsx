import { forwardRef } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface PhoneInputProps extends React.ComponentProps<typeof PhoneInput> {
  className?: string;
  onChange: (value: any) => void;
}

const SmartPhoneInput = forwardRef<any, PhoneInputProps>(({ className, onChange, ...props }, ref) => {
  return (
    <div className={cn("relative", className)}>
      <PhoneInput
        international
        defaultCountry="BD"
        numberInputProps={{
          className: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        }}
        {...props}
        onChange={onChange}
        ref={ref}
        inputComponent={CustomInput}
      />
      <style>{`
        .PhoneInput {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .PhoneInputCountry {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0 0.5rem;
          border: 1px solid hsl(var(--input));
          border-radius: calc(var(--radius) - 2px);
          background: hsl(var(--background));
          height: 2.5rem;
        }
        .PhoneInputCountryIcon {
          width: 1.5rem;
          height: 1rem;
          border-radius: 2px;
          overflow: hidden;
        }
        .PhoneInputCountryIconImg {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .PhoneInputCountrySelect {
          display: none;
        }
        .PhoneInputInput {
          flex: 1;
          height: 2.5rem;
          border-radius: calc(var(--radius) - 2px);
          border: 1px solid hsl(var(--input));
          background: hsl(var(--background));
          padding: 0 0.5rem;
          font-size: 0.875rem;
        }
        .PhoneInputInput:focus {
            outline: 2px solid hsl(var(--ring));
            outline-offset: 2px;
        }
      `}</style>
    </div>
  );
});

// Helper to style the inner input
const CustomInput = forwardRef<HTMLInputElement, any>((props, ref) => (
  <Input {...props} ref={ref} className="pl-3" />
));

SmartPhoneInput.displayName = "PhoneInput";

export { SmartPhoneInput };
