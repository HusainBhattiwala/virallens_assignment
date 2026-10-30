import { type SubmitEvent, useState } from "react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { endSessionIfUnauthorized } from "@/features/auth/auth-store"
import { getErrorMessage } from "@/lib/api"
import type { Conversation } from "./chat-api"
import {
  removeConversation,
  renameConversationTitle,
} from "./conversation-actions"

const TITLE_MAX_LENGTH = 100

interface RenameConversationDialogProps {
  conversation: Conversation | null
  onClose: () => void
}

export function RenameConversationDialog({
  conversation,
  onClose,
}: RenameConversationDialogProps) {
  return (
    <Dialog
      open={conversation !== null}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md">
        {conversation ? (
          <RenameConversationForm
            key={conversation.id}
            conversation={conversation}
            onClose={onClose}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

interface RenameConversationFormProps {
  conversation: Conversation
  onClose: () => void
}

function RenameConversationForm({
  conversation,
  onClose,
}: RenameConversationFormProps) {
  const [title, setTitle] = useState(conversation.title)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const trimmedTitle = title.trim()

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (trimmedTitle === conversation.title) {
      onClose()
      return
    }

    setIsSaving(true)
    try {
      await renameConversationTitle(conversation.id, trimmedTitle)
      onClose()
    } catch (caught) {
      setIsSaving(false)
      if (!endSessionIfUnauthorized(caught)) setError(getErrorMessage(caught))
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="flex flex-col gap-5"
    >
      <DialogHeader>
        <DialogTitle>Rename conversation</DialogTitle>
      </DialogHeader>
      <Field data-invalid={error ? true : undefined}>
        <FieldLabel htmlFor="conversation-title" className="sr-only">
          Title
        </FieldLabel>
        <Input
          id="conversation-title"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value)
            setError(null)
          }}
          maxLength={TITLE_MAX_LENGTH}
          aria-invalid={error ? true : undefined}
          autoFocus
          className="h-10"
        />
        <FieldError errors={error ? [{ message: error }] : undefined} />
      </Field>
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancel
        </DialogClose>
        <Button type="submit" disabled={!trimmedTitle || isSaving}>
          {isSaving ? <Spinner data-icon="inline-start" /> : null}
          Save
        </Button>
      </DialogFooter>
    </form>
  )
}

interface DeleteConversationDialogProps {
  conversation: Conversation | null
  onClose: () => void
  onDeleted: (conversationId: string) => void
}

export function DeleteConversationDialog({
  conversation,
  onClose,
  onDeleted,
}: DeleteConversationDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!conversation) return
    setIsDeleting(true)
    try {
      await removeConversation(conversation.id)
      onDeleted(conversation.id)
      onClose()
    } catch (caught) {
      if (!endSessionIfUnauthorized(caught)) {
        toast.error("Couldn't delete the conversation", {
          description: getErrorMessage(caught),
        })
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog
      open={conversation !== null}
      onOpenChange={(open) => {
        if (!open && !isDeleting) onClose()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
          <AlertDialogDescription>
            “{conversation?.title}” and all of its messages will be permanently
            deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isDeleting}
            onClick={() => void handleDelete()}
          >
            {isDeleting ? <Spinner data-icon="inline-start" /> : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
