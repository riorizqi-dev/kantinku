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
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-200 border-t-[#FFB300]" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
