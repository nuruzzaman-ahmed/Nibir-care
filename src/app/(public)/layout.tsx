import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { auth } from "@/lib/auth";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        user={session?.user ?? null}
      />
      <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      <div className="hidden lg:block">
        <Footer />
      </div>
      <BottomNav />
    </div>
  );
}
