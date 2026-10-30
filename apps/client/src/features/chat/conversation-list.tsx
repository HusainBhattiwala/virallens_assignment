import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar"
import { useIntersectionTrigger } from "@/hooks/use-intersection-trigger"
import { cn } from "@/lib/utils"
import type { Conversation } from "./chat-api"
import { useConversationList } from "./chat-data"
import {
  DeleteConversationDialog,
  RenameConversationDialog,
} from "./conversation-dialogs"

const INITIAL_SKELETON_ROWS = [0, 1, 2, 3, 4]
const LOADING_MORE_SKELETON_ROWS = [0, 1]

interface ConversationListProps {
  search: string
  activeId: string | undefined
  onNavigate: () => void
}

export function ConversationList({
  search,
  activeId,
  onNavigate,
}: ConversationListProps) {
  const navigate = useNavigate()
  const {
    conversations,
    error,
    isLoading,
    isLoadingMore,
    isRefreshing,
    hasMore,
    loadMore,
    refresh,
  } = useConversationList(search)
  const [renaming, setRenaming] = useState<Conversation | null>(null)
  const [deleting, setDeleting] = useState<Conversation | null>(null)
  const sentinelRef = useIntersectionTrigger({
    enabled: hasMore && !isRefreshing,
    onIntersect: loadMore,
  })

  const handleDeleted = (conversationId: string) => {
    if (conversationId === activeId) void navigate("/chat", { replace: true })
  }

  if (isLoading) return <SkeletonRows rows={INITIAL_SKELETON_ROWS} />

  if (error && conversations.length === 0) {
    return (
      <div className="flex flex-col items-start gap-1 px-2 text-sm text-muted-foreground">
        <p>Couldn't load your conversations.</p>
        <Button
          variant="link"
          size="sm"
          className="h-auto px-0"
          onClick={refresh}
        >
          Try again
        </Button>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <p className="px-2 text-sm text-muted-foreground">
        {search
          ? `No conversations match “${search}”.`
          : "Your conversations will appear here."}
      </p>
    )
  }

  return (
    <>
      <SidebarMenu
        aria-busy={isRefreshing}
        className={cn(
          "transition-opacity",
          search && isRefreshing && "opacity-60"
        )}
      >
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isActive={conversation.id === activeId}
            onNavigate={onNavigate}
            onRename={setRenaming}
            onDelete={setDeleting}
          />
        ))}
        {isLoadingMore ? (
          <SkeletonItems rows={LOADING_MORE_SKELETON_ROWS} />
        ) : null}
        {hasMore ? (
          <li ref={sentinelRef} aria-hidden="true" className="h-px" />
        ) : null}
      </SidebarMenu>
      <RenameConversationDialog
        conversation={renaming}
        onClose={() => {
          setRenaming(null)
        }}
      />
      <DeleteConversationDialog
        conversation={deleting}
        onClose={() => {
          setDeleting(null)
        }}
        onDeleted={handleDeleted}
      />
    </>
  )
}

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  onNavigate: () => void
  onRename: (conversation: Conversation) => void
  onDelete: (conversation: Conversation) => void
}

function ConversationItem({
  conversation,
  isActive,
  onNavigate,
  onRename,
  onDelete,
}: ConversationItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<Link to={`/chat/${conversation.id}`} />}
        isActive={isActive}
        onClick={onNavigate}
      >
        <span>{conversation.title}</span>
      </SidebarMenuButton>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <SidebarMenuAction
              showOnHover
              aria-label={`Options for ${conversation.title}`}
            />
          }
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start" className="w-40">
          <DropdownMenuItem
            onClick={() => {
              onRename(conversation)
            }}
          >
            <Pencil />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              onDelete(conversation)
            }}
          >
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

interface SkeletonRowsProps {
  rows: number[]
}

function SkeletonRows({ rows }: SkeletonRowsProps) {
  return (
    <SidebarMenu>
      <SkeletonItems rows={rows} />
    </SidebarMenu>
  )
}

function SkeletonItems({ rows }: SkeletonRowsProps) {
  return rows.map((row) => (
    <SidebarMenuItem key={row}>
      <SidebarMenuSkeleton />
    </SidebarMenuItem>
  ))
}
