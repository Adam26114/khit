import { StoreHeader } from "@/components/store/header";
import { StoreFooter } from "@/components/store/footer";
import { CartDrawer } from "@/components/store/cart-drawer";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <StoreHeader />
      <main className="flex-1">{children}</main>
      <StoreFooter />
      <CartDrawer />
    </div>
  );
}
