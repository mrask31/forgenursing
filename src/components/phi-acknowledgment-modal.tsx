'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

interface PHIAcknowledgmentModalProps {
  open: boolean;
  onAcknowledge: () => void;
}

export function PHIAcknowledgmentModal({ open, onAcknowledge }: PHIAcknowledgmentModalProps) {
  return (
    <DialogPrimitive.Root open={open} modal>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-full max-w-[500px] translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2",
            "data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
            "sm:rounded-lg"
          )}
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <div className="flex flex-col space-y-1.5 text-center sm:text-left">
            <DialogPrimitive.Title className="text-xl font-semibold leading-none tracking-tight">
              ForgeNursing is for Practice Materials Only
            </DialogPrimitive.Title>
          </div>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              ForgeNursing uses AI to help you study. To protect patient privacy,
              this platform is designed exclusively for de-identified practice
              materials — textbooks, NCLEX prep resources, professor case studies,
              and practice EKGs.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Never upload real patient records, live EKGs with patient names,
              or any materials from your clinical site.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              ForgeNursing has safeguards to detect potential real patient data,
              but you are responsible for ensuring your materials are de-identified.
            </p>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={onAcknowledge}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
            >
              I Understand — Start Studying
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
