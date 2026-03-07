'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';

type ProgramLevel = 'LPN' | 'ADN' | 'BSN' | 'MSN';

interface ProgramSelectionModalProps {
  open: boolean;
  onComplete: (programLevel: ProgramLevel) => void;
}

export function ProgramSelectionModal({ open, onComplete }: ProgramSelectionModalProps) {
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
          <div className="flex flex-col space-y-2 text-center sm:text-left">
            <DialogPrimitive.Title className="text-xl font-semibold leading-none tracking-tight">
              What is your nursing program?
            </DialogPrimitive.Title>
            <p className="text-sm text-muted-foreground">
              This helps ForgeNursing teach at the right level for your scope of practice.
            </p>
          </div>
          
          <div className="flex flex-col gap-3 py-4">
            <button
              onClick={() => onComplete('LPN')}
              className="w-full px-6 py-3 bg-background border-2 border-primary/20 hover:border-primary hover:bg-primary/5 rounded-md transition-colors font-medium text-left"
            >
              LPN / LVN — Licensed Practical Nurse
            </button>
            
            <button
              onClick={() => onComplete('ADN')}
              className="w-full px-6 py-3 bg-background border-2 border-primary/20 hover:border-primary hover:bg-primary/5 rounded-md transition-colors font-medium text-left"
            >
              ADN / RN — Associate Degree Nursing
            </button>
            
            <button
              onClick={() => onComplete('BSN')}
              className="w-full px-6 py-3 bg-background border-2 border-primary/20 hover:border-primary hover:bg-primary/5 rounded-md transition-colors font-medium text-left"
            >
              BSN — Bachelor of Science in Nursing
            </button>
            
            <button
              onClick={() => onComplete('MSN')}
              className="w-full px-6 py-3 bg-background border-2 border-primary/20 hover:border-primary hover:bg-primary/5 rounded-md transition-colors font-medium text-left"
            >
              MSN / NP — Graduate / Nurse Practitioner
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
