"use client";

import { GoeyToaster } from "@/components/ui/goey-toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./theme-provider";
import { AuthProvider } from "@/components/auth/auth-provider";

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>{children}</TooltipProvider>

          <GoeyToaster position="bottom-right" />
        </ThemeProvider></AuthProvider>
    </>
  );
}
export default Providers;
