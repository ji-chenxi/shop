import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Calendar,
  TrendingUp,
  Trash2,
  ChevronDown,
  ChevronUp,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  getOrders,
  deleteOrder,
  getDailyStats,
  getMonthlyStats,
  type Order,
} from "@/lib/storage";

export const Route = createFileRoute("/orders")({
  component: OrdersPage,
});

function OrdersPage() {
  const [activeTab, setActiveTab] = useState<"daily" | "monthly">("daily");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (activeTab === "daily") {
      const date = selectedDate ? new Date(selectedDate) : new Date();
      const dailyStats = getDailyStats(date);
      setStats(dailyStats);
      setOrders(dailyStats.orders);
    } else {
      const now = new Date();
      const monthlyStats = getMonthlyStats(now.getFullYear(), now.getMonth());
      setStats(monthlyStats);
      setOrders(monthlyStats.orders);
    }
  }, [activeTab, selectedDate]);

  const handleDeleteOrder = (orderId: string) => {
    if (confirm("确定要删除这条订单吗？")) {
      deleteOrder(orderId);
      // 刷新数据
      if (activeTab === "daily") {
        const date = selectedDate ? new Date(selectedDate) : new Date();
        const dailyStats = getDailyStats(date);
        setStats(dailyStats);
        setOrders(dailyStats.orders);
      } else {
        const now = new Date();
        const monthlyStats = getMonthlyStats(now.getFullYear(), now.getMonth());
        setStats(monthlyStats);
        setOrders(monthlyStats.orders);
      }
    }
  };

  const toggleExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${month}月${day}日 ${hours}:${minutes}`;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* 顶部标题 */}
      <header className="bg-primary text-primary-foreground px-4 py-3 shadow-lg sticky top-0 z-10">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          订单管理
        </h1>
      </header>

      {/* 统计卡片 */}
      {stats && (
        <div className="p-4 space-y-3">
          <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">订单数</p>
                  <p className="text-xl font-bold text-primary">
                    {stats.orderCount}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">总件数</p>
                  <p className="text-xl font-bold text-primary">
                    {stats.totalItems}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">总金额</p>
                  <p className="text-xl font-bold text-primary">
                    ¥{stats.totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tab切换 */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "daily" | "monthly")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="daily">日账单</TabsTrigger>
              <TabsTrigger value="monthly">月账单</TabsTrigger>
            </TabsList>

            {activeTab === "daily" && (
              <TabsContent value="daily" className="mt-4">
                <div className="mb-4">
                  <label className="text-sm text-muted-foreground mb-2 block">
                    选择日期
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </TabsContent>
            )}

            {activeTab === "monthly" && stats.dailyStats && (
              <TabsContent value="monthly" className="mt-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold">每日统计</h3>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {Object.entries(stats.dailyStats).map(
                        ([date, data]: [string, any]) => (
                          <div
                            key={date}
                            className="flex justify-between items-center p-3 bg-muted rounded-lg"
                          >
                            <span className="text-sm font-medium">{date}</span>
                            <div className="text-right">
                              <Badge variant="secondary" className="mr-2">
                                {data.count}单
                              </Badge>
                              <span className="text-sm font-bold text-primary">
                                ¥{data.amount.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      )}

      {/* 订单列表 */}
      <div className="px-4 space-y-3">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Package className="w-5 h-5" />
          订单详情
        </h2>
        {orders.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <Calendar className="w-16 h-16 mx-auto mb-3 opacity-30" />
            <p className="text-lg">暂无订单记录</p>
            <p className="text-sm mt-1">去点单页面下单吧~</p>
          </div>
        ) : (
          orders.map((order) => (
            <Card key={order.id} className="overflow-hidden animate-slide-up">
              <div
                className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleExpand(order.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground mb-1">
                      {formatDate(order.createdAt)}
                    </p>
                    <p className="font-medium text-sm leading-relaxed break-words">
                      {order.items
                        .map((item) => `${item.quantity}个${item.name}`)
                        .join(" + ")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-lg font-bold text-primary">
                      ¥{order.total.toFixed(2)}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteOrder(order.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                      {expandedOrderId === order.id ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {expandedOrderId === order.id && (
                <div className="px-4 pb-4 border-t border-border pt-3 animate-fade-in">
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between text-sm py-1"
                      >
                        <span className="text-muted-foreground">
                          {item.name} × {item.quantity}
                        </span>
                        <span className="font-medium">
                          ¥{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-border pt-2 mt-2 flex justify-between font-bold">
                      <span>合计</span>
                      <span className="text-primary text-lg">
                        ¥{order.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
