import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

/**
 * `noAutofill` — brauzer/parol menejeri bu maydonni to'ldirmasin.
 *
 * Modal formalarda Chrome maydonni yorlig'iga emas, tartibiga qarab taxmin
 * qiladi: "Fanlar" katagiga saqlangan telefon raqami, "Parol" katagiga esa
 * boshqa saytning paroli yozilib qolardi. `autocomplete="off"` yolg'iz o'zi
 * yetarli emas — parol maydonida u e'tiborsiz qoldiriladi, shuning uchun
 * "new-password" + menejerlarning o'z bayroqlari birga qo'yiladi.
 */
function Input({
  className, type, noAutofill, ...props
}: React.ComponentProps<"input"> & { noAutofill?: boolean }) {
  const guard = noAutofill
    ? {
        autoComplete: (props.autoComplete ?? (type === "password" ? "new-password" : "off")) as string,
        autoCorrect: "off" as const,
        spellCheck: false,
        "data-1p-ignore": "true",
        "data-lpignore": "true",
        "data-bwignore": "true",
        "data-form-type": "other",
      }
    : {};
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      {...guard}
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
