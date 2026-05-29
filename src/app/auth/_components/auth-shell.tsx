"use client";

import { SiteHeader } from "@/components/site-header";

type AuthShellProps = {
  children: React.ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-background font-sans text-text selection:bg-accent/20">
      <SiteHeader />

      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px] rounded-xl border border-lavender-tint bg-white p-8 shadow-default">
          {children}
        </div>
      </main>
    </div>
  );
}
