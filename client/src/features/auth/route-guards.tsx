import { Navigate, Outlet } from "react-router"
import { PageLoader, ServiceUnavailable } from "@/components/page-status"
import { useAuthStore } from "./auth-store"

interface SessionGateProps {
  allow: "authenticated" | "guest"
  redirectTo: string
}

function SessionGate({ allow, redirectTo }: SessionGateProps) {
  const status = useAuthStore((state) => state.status)
  const error = useAuthStore((state) => state.error)
  const restoreSession = useAuthStore((state) => state.restoreSession)

  if (status === "loading") return <PageLoader />

  if (status === "unavailable") {
    return (
      <ServiceUnavailable
        message={error ?? "The server didn't respond."}
        onRetry={() => void restoreSession()}
      />
    )
  }

  return status === allow ? <Outlet /> : <Navigate to={redirectTo} replace />
}

export function RequireAuth() {
  return <SessionGate allow="authenticated" redirectTo="/login" />
}

export function RequireGuest() {
  return <SessionGate allow="guest" redirectTo="/chat" />
}
