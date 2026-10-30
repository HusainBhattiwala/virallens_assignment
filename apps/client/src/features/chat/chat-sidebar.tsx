import { SquarePen } from "lucide-react"
import { useState } from "react"
import { Link, useParams } from "react-router"
import { BrandLogo } from "@/components/brand-mark"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { UserMenu } from "@/features/auth/user-menu"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { ConversationList } from "./conversation-list"
import { ConversationSearch } from "./conversation-search"
import { SidebarToggle } from "./sidebar-toggle"

const SEARCH_DEBOUNCE_MS = 300

export function ChatSidebar() {
  const { conversationId } = useParams<"conversationId">()
  const { setOpenMobile } = useSidebar()
  const [search, setSearch] = useState("")
  const trimmedSearch = search.trim()
  const debouncedSearch = useDebouncedValue(trimmedSearch, SEARCH_DEBOUNCE_MS)

  const closeOnMobile = () => {
    setOpenMobile(false)
  }

  return (
    <Sidebar>
      <SidebarHeader className="gap-3 pt-3">
        <div className="flex items-center justify-between gap-2 pl-2">
          <BrandLogo />
          <SidebarToggle action="close" />
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link to="/chat" />}
              isActive={!conversationId}
              onClick={closeOnMobile}
            >
              <SquarePen />
              <span>New conversation</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <ConversationSearch
          value={search}
          isPending={trimmedSearch !== debouncedSearch}
          onChange={setSearch}
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {debouncedSearch ? "Results" : "Recent"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <ConversationList
              search={debouncedSearch}
              activeId={conversationId}
              onNavigate={closeOnMobile}
            />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserMenu />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
