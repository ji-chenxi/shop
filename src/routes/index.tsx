import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Plus,
  Minus,
  ShoppingCart,
  Trash2,
  Flame,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  getProducts,
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  saveOrder,
  addProduct,
  type Product,
  type CartItem,
} from "@/lib/storage";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("炸货");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("炸货");
  const [activeTab, setActiveTab] = useState<"products" | "cart">("products");

  // 加载数据
  useEffect(() => {
    setProducts(getProducts());
    setCart(getCart());
  }, []);

  // 获取所有分类
  const categories = Array.from(new Set(products.map((p) => p.category)));

  // 当前分类的商品
  const currentProducts = products.filter(
    (p) => p.category === selectedCategory,
  );

  // 计算总价和总数量
  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // 添加到购物车
  const handleAddToCart = (product: Product) => {
    const newCart = addToCart(product);
    setCart([...newCart]);
  };

  // 更新数量
  const handleUpdateQuantity = (productId: string, quantity: number) => {
    const newCart = updateCartItemQuantity(productId, quantity);
    setCart([...newCart]);
  };

  // 从购物车移除
  const handleRemoveFromCart = (productId: string) => {
    const newCart = removeFromCart(productId);
    setCart([...newCart]);
  };

  // 结算
  const handleCheckout = () => {
    if (cart.length === 0) return;

    saveOrder({
      items: [...cart],
      total: totalAmount,
    });

    clearCart();
    setCart([]);
    setActiveTab("products");
    alert(`订单已提交！总金额：¥${totalAmount.toFixed(2)}`);
  };

  // 添加新商品
  const handleAddProduct = () => {
    if (!newProductName || !newProductPrice) return;

    const price = parseFloat(newProductPrice);
    if (isNaN(price) || price <= 0) return;

    addProduct({
      name: newProductName,
      price,
      category: newProductCategory,
    });

    setProducts(getProducts());
    setNewProductName("");
    setNewProductPrice("");
    setIsAddDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16">
      {/* 顶部导航 */}
      <header className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between shadow-lg sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Flame className="w-6 h-6" />
          <h1 className="text-xl font-bold">炸鸡排店</h1>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" size="sm" className="gap-1">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">新增</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>添加新商品</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="name">商品名称</Label>
                <Input
                  id="name"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="例如：鸡柳"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">单价（元）</Label>
                <Input
                  id="price"
                  type="number"
                  value={newProductPrice}
                  onChange={(e) => setNewProductPrice(e.target.value)}
                  placeholder="例如：8"
                  min="0"
                  step="0.1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">分类</Label>
                <Input
                  id="category"
                  value={newProductCategory}
                  onChange={(e) => setNewProductCategory(e.target.value)}
                  placeholder="例如：炸货"
                />
              </div>
              <Button onClick={handleAddProduct} className="w-full">
                确认添加
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {/* Tab切换 */}
      <div className="px-4 pt-3">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "products" | "cart")}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products" className="gap-2">
              <Package className="w-4 h-4" />
              商品
            </TabsTrigger>
            <TabsTrigger value="cart" className="gap-2 relative">
              <ShoppingCart className="w-4 h-4" />
              购物车
              {totalItems > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {totalItems}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* 商品列表 */}
          <TabsContent value="products" className="mt-4">
            {/* 分类标签 */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:bg-accent border border-border"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* 商品网格 */}
            <div className="grid grid-cols-2 gap-3">
              {currentProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-card rounded-xl p-3 shadow-sm border border-border animate-slide-up"
                >
                  <div className="aspect-square bg-muted rounded-lg mb-2 flex items-center justify-center">
                    <Flame className="w-8 h-8 text-primary opacity-50" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1 truncate">
                    {product.name}
                  </h3>
                  <p className="text-primary font-bold text-lg mb-2">
                    ¥{product.price}
                  </p>
                  <Button
                    onClick={() => handleAddToCart(product)}
                    size="sm"
                    className="w-full gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    加入
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* 购物车 */}
          <TabsContent value="cart" className="mt-4">
            {cart.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <ShoppingCart className="w-16 h-16 mx-auto mb-3 opacity-30" />
                <p className="text-lg">购物车为空</p>
                <p className="text-sm mt-1">快去挑选喜欢的炸货吧~</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="bg-card rounded-xl p-3 border border-border animate-fade-in"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-primary font-bold">
                          ¥{item.price}/个
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleRemoveFromCart(item.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-9 w-9"
                        onClick={() =>
                          handleUpdateQuantity(item.id, item.quantity - 1)
                        }
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="flex-1 text-center text-lg font-bold">
                        {item.quantity}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-9 w-9"
                        onClick={() =>
                          handleUpdateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <div className="ml-auto text-right">
                        <p className="text-sm text-muted-foreground">小计</p>
                        <p className="text-primary font-bold">
                          ¥{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* 结算区域 */}
                <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-4 border border-primary/20 mt-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-muted-foreground">
                      共 {totalItems} 件商品
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      ¥{totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <Button onClick={handleCheckout} className="w-full" size="lg">
                    立即结算
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
