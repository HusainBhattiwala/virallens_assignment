import { lazy, Suspense } from "react"
import { Navigate, Route, Routes } from "react-router"
import { PageLoader } from "@/components/page-status"
import { RequireAuth, RequireGuest } from "@/features/auth/route-guards"

const AuthPage = lazy(() => import("@/features/auth/auth-page").then((module) => ({ default: module.AuthPage })))
const ChatLayout = lazy(() => import("@/features/chat/chat-layout").then((module) => ({ default: module.ChatLayout })))
const ChatPage = lazy(() => import("@/features/chat/conversation-view").then((module) => ({ default: module.ChatPage })))

export function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<RequireGuest />}>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route path="/chat" element={<ChatLayout />}>
            <Route index element={<ChatPage />} />
            <Route path=":conversationId" element={<ChatPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
    </Suspense>
  )
}
