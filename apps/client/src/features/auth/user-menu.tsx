import { ChevronsUpDown, LogOut, Moon, Sun } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { useTheme } from "@/components/theme-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenuButton } from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import { getErrorMessage } from "@/lib/api"
import { useAuthStore } from "./auth-store"

export function UserMenu() {
  const email = useAuthStore((state) => state.user?.email ?? "")
  const logout = useAuthStore((state) => state.logout)
  const { toggleTheme } = useTheme()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
      toast.success("You've been logged out")
    } catch (error) {
      setIsLoggingOut(false)
      toast.error("Couldn't log out", { description: getErrorMessage(error) })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
        <Avatar size="sm" aria-hidden="true">
          <AvatarFallback className="bg-sidebar-accent text-xs font-medium uppercase">
            {email.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <span className="truncate">{email}</span>
        <ChevronsUpDown className="ml-auto text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        className="w-(--anchor-width) min-w-56"
      >
        <DropdownMenuItem closeOnClick={false} onClick={toggleTheme}>
          <Sun className="hidden dark:block" />
          <Moon className="dark:hidden" />
          <span className="hidden dark:inline">Light mode</span>
          <span className="dark:hidden">Dark mode</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          closeOnClick={false}
          disabled={isLoggingOut}
          onClick={() => void handleLogout()}
        >
          {isLoggingOut ? <Spinner /> : <LogOut />}
          {isLoggingOut ? "Logging out" : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
