import { SquarePen } from "lucide-react"
import { Link, useParams } from "react-router"
import { BrandLogo } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
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
  SidebarMenuSkeleton,
  useSidebar,
} from "@/components/ui/sidebar"
import { UserMenu } from "@/features/auth/user-menu"
import { useConversations } from "./chat-data"
import { SidebarToggle } from "./sidebar-toggle"

const SKELETON_ROWS = [0, 1, 2, 3, 4]

export function ChatSidebar() {
  const { conversationId } = useParams<"conversationId">()
  const { setOpenMobile } = useSidebar()

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
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Recent</SidebarGroupLabel>
          <SidebarGroupContent>
            <ConversationList
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

interface ConversationListProps {
  activeId: string | undefined
  onNavigate: () => void
}

function ConversationList({ activeId, onNavigate }: ConversationListProps) {
  const { data: conversations, error, isLoading, mutate } = useConversations()

  if (isLoading) {
    return (
      <SidebarMenu>
        {SKELETON_ROWS.map((row) => (
          <SidebarMenuItem key={row}>
            <SidebarMenuSkeleton />
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-start gap-1 px-2 text-sm text-muted-foreground">
        <p>Couldn't load your conversations.</p>
        <Button
          variant="link"
          size="sm"
          className="h-auto px-0"
          onClick={() => void mutate()}
        >
          Try again
        </Button>
      </div>
    )
  }

  if (!conversations?.length) {
    return (
      <p className="px-2 text-sm text-muted-foreground">
        Your conversations will appear here.
      </p>
    )
  }

  return (
    <SidebarMenu>
      {conversations.map((conversation) => (
        <SidebarMenuItem key={conversation.id}>
          <SidebarMenuButton
            render={<Link to={`/chat/${conversation.id}`} />}
            isActive={conversation.id === activeId}
            onClick={onNavigate}
          >
            <span>{conversation.title}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )
}
