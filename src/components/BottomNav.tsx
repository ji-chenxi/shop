import { Link, useLocation } from "@tanstack/react-router";
import { Home, ShoppingCart } from "lucide-react";

export function BottomNav() {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
      <div className="flex items-center justify-around max-w-md mx-auto">
        <Link
          to="/"
          className={`flex flex-col items-center py-2 px-6 flex-1 transition-colors ${
            pathname === "/"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Home className="w-6 h-6" />
          <span className="text-xs mt-1">点单</span>
        </Link>
        <Link
          to="/orders"
          className={`flex flex-col items-center py-2 px-6 flex-1 transition-colors ${
            pathname === "/orders"
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="text-xs mt-1">订单</span>
        </Link>
      </div>
    </nav>
  );
}
