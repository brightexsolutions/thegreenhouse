"use client";

import { createContext, useContext, useState, useCallback, useRef } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmOptions {
  title?:        string;
  message:       string;
  confirmLabel?: string;
  cancelLabel?:  string;
  destructive?:  boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open,    setOpen]    = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ message: "" });
  const resolveRef = useRef<((val: boolean) => void) | null>(null);

  const confirm: ConfirmFn = useCallback((opts) => {
    return new Promise<boolean>((resolve) => {
      setOptions(opts);
      resolveRef.current = resolve;
      setOpen(true);
    });
  }, []);

  function respond(val: boolean) {
    setOpen(false);
    resolveRef.current?.(val);
    resolveRef.current = null;
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => respond(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 z-10 animate-in fade-in zoom-in-95 duration-150">
            {/* Icon */}
            <div className={cn(
              "w-11 h-11 rounded-2xl flex items-center justify-center mb-4",
              options.destructive ? "bg-red-50" : "bg-amber-50"
            )}>
              {options.destructive
                ? <Trash2   size={18} className="text-red-500"   />
                : <AlertTriangle size={18} className="text-amber-500" />
              }
            </div>

            {/* Text */}
            <h3 className="text-sm font-semibold text-charcoal mb-1.5">
              {options.title ?? (options.destructive ? "Are you sure?" : "Confirm")}
            </h3>
            <p className="text-sm text-charcoal/55 leading-relaxed mb-6">
              {options.message}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => respond(false)}
                className="flex-1 py-2.5 rounded-full border border-mist text-sm text-charcoal/60 font-medium hover:border-charcoal/20 transition-colors"
              >
                {options.cancelLabel ?? "Cancel"}
              </button>
              <button
                onClick={() => respond(true)}
                className={cn(
                  "flex-1 py-2.5 rounded-full text-sm font-semibold transition-colors",
                  options.destructive
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-forest text-cream hover:bg-moss"
                )}
              >
                {options.confirmLabel ?? (options.destructive ? "Delete" : "Confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const fn = useContext(ConfirmContext);
  if (!fn) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return fn;
}
