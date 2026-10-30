import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { useSidebar } from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const MODIFIER_KEY = /Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘" : "Ctrl"

const TOGGLE_ACTIONS = {
  open: { label: "Open sidebar", icon: PanelLeftOpen },
  close: { label: "Close sidebar", icon: PanelLeftClose },
} as const

interface SidebarToggleProps {
  action: keyof typeof TOGGLE_ACTIONS
}

export function SidebarToggle({ action }: SidebarToggleProps) {
  const { toggleSidebar } = useSidebar()
  const { label, icon: Icon } = TOGGLE_ACTIONS[action]

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            onClick={toggleSidebar}
          />
        }
      >
        <Icon />
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {label}
        <KbdGroup>
          <Kbd>{MODIFIER_KEY}</Kbd>
          <Kbd>B</Kbd>
        </KbdGroup>
      </TooltipContent>
    </Tooltip>
  )
}
