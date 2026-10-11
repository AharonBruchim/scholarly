import { Eye, EyeOff } from "lucide-react";
import type * as React from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PasswordInputProps = React.ComponentProps<typeof Input> & {
  revealLabel: string;
  hideLabel: string;
};

export function PasswordInput({ revealLabel, hideLabel, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className="pe-11" />
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="absolute inset-y-0 end-0 h-10 w-10 text-slate-300"
        aria-label={visible ? hideLabel : revealLabel}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>
    </div>
  );
}
