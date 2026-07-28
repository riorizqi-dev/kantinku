import { Suspense } from "react";

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-kantin-200 border-t-kantin-600" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
