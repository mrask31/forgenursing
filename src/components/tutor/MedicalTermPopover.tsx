'use client'

import * as Popover from '@radix-ui/react-popover'
import { Info } from 'lucide-react'
import { useState } from 'react'

interface MedicalTermPopoverProps {
  term: string
  definition: string
  children: React.ReactNode
}

export default function MedicalTermPopover({ term, definition, children }: MedicalTermPopoverProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-baseline gap-0.5 text-indigo-600 hover:text-indigo-700 hover:underline cursor-help focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 rounded px-0.5 -mx-0.5 transition-colors"
          aria-label={`Medical term: ${term}`}
        >
          {children}
          <Info className="inline-block w-3 h-3 mb-0.5 opacity-60" aria-hidden="true" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-50 max-w-sm rounded-lg border border-slate-200 bg-white p-4 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          sideOffset={8}
          align="start"
        >
          <div className="space-y-2">
            <div>
              <h4 className="font-semibold text-slate-900 text-sm mb-1">{term}</h4>
              <p className="text-sm text-slate-700 leading-relaxed">{definition}</p>
            </div>
            <Popover.Close asChild>
              <button
                type="button"
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 rounded px-2 py-1"
              >
                Close
              </button>
            </Popover.Close>
          </div>
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

