import Link from "next/link";

export function StoreFooter() {
  return (
    <footer className="border-t bg-muted">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Khit</h3>
            <p className="text-sm text-muted-foreground">
              Premium menswear from Myanmar. Quality shirts, pants, and accessories.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/clothing" className="text-muted-foreground hover:text-foreground">Clothing</Link></li>
              <li><Link href="/shoes" className="text-muted-foreground hover:text-foreground">Shoes</Link></li>
              <li><Link href="/accessories" className="text-muted-foreground hover:text-foreground">Accessories</Link></li>
              <li><Link href="/new-arrivals" className="text-muted-foreground hover:text-foreground">New Arrivals</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Help</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact Us</Link></li>
              <li><Link href="/shipping" className="text-muted-foreground hover:text-foreground">Shipping Info</Link></li>
              <li><Link href="/returns" className="text-muted-foreground hover:text-foreground">Returns</Link></li>
              <li><Link href="/size-guide" className="text-muted-foreground hover:text-foreground">Size Guide</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Store Pickup</h4>
            <p className="text-sm text-muted-foreground mb-2">Yangon</p>
            <p className="text-sm text-muted-foreground">Weekdays 9am - 4pm</p>
          </div>
        </div>
        <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground">
          © 2026 Khit. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
