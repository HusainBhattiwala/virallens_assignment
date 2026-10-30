import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router"
import { SWRConfig } from "swr"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  endSessionIfUnauthorized,
  useAuthStore,
} from "@/features/auth/auth-store"
import { App } from "./App"
import "./index.css"

const rootElement = document.getElementById("root")

if (!rootElement) {
  throw new Error("Root element #root is missing from index.html")
}

void useAuthStore.getState().restoreSession()

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider>
      <SWRConfig
        value={{ onError: endSessionIfUnauthorized, revalidateOnFocus: false }}
      >
        <BrowserRouter>
          <TooltipProvider>
            <App />
            <Toaster position="top-center" />
          </TooltipProvider>
        </BrowserRouter>
      </SWRConfig>
    </ThemeProvider>
  </StrictMode>
)
