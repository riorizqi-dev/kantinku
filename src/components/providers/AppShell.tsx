"use client";

import { AppProvider } from "@/context/AppContext";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { StallColorProvider } from "@/context/StallColorContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ToastContainer } from "@/components/ui/Toast";
import { usePathname } from "next/navigation";

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const bare =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  return (
    <>
      <div className="flex min-h-[100dvh] flex-col">
        <div className={bare ? "hidden" : "contents"}>
          <Header />
        </div>
        <main className="flex-1">{children}</main>
        <div className={bare ? "hidden" : "contents"}>
          <Footer />
        </div>
      </div>
      <ToastContainer />
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AppProvider>
        <StallColorProvider>
          <ShellInner>{children}</ShellInner>
        </StallColorProvider>
      </AppProvider>
    </ThemeProvider>
  );
}
