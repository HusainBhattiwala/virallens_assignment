import { Outlet } from "react-router"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ChatSidebar } from "./chat-sidebar"

export function ChatLayout() {
  return (
    <SidebarProvider>
      <ChatSidebar />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}
