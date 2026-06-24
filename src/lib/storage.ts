/**
 * LocalStorage 数据管理工具
 * 处理商品、购物车、订单的持久化存储
 */

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  createdAt: string;
}

const STORAGE_KEYS = {
  PRODUCTS: 'fried_chicken_products',
  CART: 'fried_chicken_cart',
  ORDERS: 'fried_chicken_orders',
};

// 默认商品数据
const DEFAULT_PRODUCTS: Product[] = [
  { id: '1', name: '鸡排', price: 12, category: '炸货' },
  { id: '2', name: '淀粉肠', price: 5, category: '炸货' },
  { id: '3', name: '面筋', price: 4, category: '炸货' },
  { id: '4', name: '鸡腿', price: 8, category: '炸货' },
  { id: '5', name: '鸡翅', price: 6, category: '炸货' },
  { id: '6', name: '薯条', price: 8, category: '小食' },
  { id: '7', name: '可乐', price: 5, category: '饮品' },
];

// 初始化默认数据
function initDefaultData() {
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.CART)) {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
  }
}

// 检查并清空上月数据
function checkAndClearMonthlyData() {
  const lastClearMonth = localStorage.getItem('last_clear_month');
  const currentMonth = new Date().getMonth();

  if (lastClearMonth && parseInt(lastClearMonth) !== currentMonth) {
    // 跨月了，清空订单数据
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
  }
  localStorage.setItem('last_clear_month', currentMonth.toString());
}

// 初始化
export function initStorage() {
  initDefaultData();
  checkAndClearMonthlyData();
}

// 商品操作
export function getProducts(): Product[] {
  const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
  return data ? JSON.parse(data) : [];
}

export function saveProducts(products: Product[]) {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
}

export function addProduct(product: Omit<Product, 'id'>): Product {
  const products = getProducts();
  const newProduct: Product = {
    ...product,
    id: Date.now().toString(),
  };
  products.push(newProduct);
  saveProducts(products);
  return newProduct;
}

export function deleteProduct(id: string) {
  const products = getProducts().filter(p => p.id !== id);
  saveProducts(products);
}

// 购物车操作
export function getCart(): CartItem[] {
  const data = localStorage.getItem(STORAGE_KEYS.CART);
  return data ? JSON.parse(data) : [];
}

export function saveCart(cart: CartItem[]) {
  localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
}

export function addToCart(product: Product, quantity: number = 1) {
  const cart = getCart();
  const existingItem = cart.find(item => item.id === product.id);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({ ...product, quantity });
  }

  saveCart(cart);
  return cart;
}

export function updateCartItemQuantity(productId: string, quantity: number) {
  const cart = getCart();
  const item = cart.find(item => item.id === productId);

  if (item) {
    if (quantity <= 0) {
      return removeFromCart(productId);
    }
    item.quantity = quantity;
  }

  saveCart(cart);
  return cart;
}

export function removeFromCart(productId: string) {
  const cart = getCart().filter(item => item.id !== productId);
  saveCart(cart);
  return cart;
}

export function clearCart() {
  saveCart([]);
}

// 订单操作
export function getOrders(): Order[] {
  const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
  return data ? JSON.parse(data) : [];
}

export function saveOrder(order: Omit<Order, 'id' | 'createdAt'>): Order {
  const orders = getOrders();
  const newOrder: Order = {
    ...order,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
  };
  orders.unshift(newOrder);
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  return newOrder;
}

export function deleteOrder(id: string) {
  const orders = getOrders().filter(o => o.id !== id);
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
}

// 统计功能
export function getDailyStats(date?: Date) {
  const targetDate = date || new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const orders = getOrders().filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= startOfDay && orderDate <= endOfDay;
  });

  const totalAmount = orders.reduce((sum, order) => sum + order.total, 0);
  const totalItems = orders.reduce((sum, order) =>
    sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );

  return {
    orders,
    totalAmount,
    totalItems,
    orderCount: orders.length,
  };
}

export function getMonthlyStats(year?: number, month?: number) {
  const now = new Date();
  const targetYear = year || now.getFullYear();
  const targetMonth = month !== undefined ? month : now.getMonth();

  const startOfMonth = new Date(targetYear, targetMonth, 1);
  const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

  const orders = getOrders().filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= startOfMonth && orderDate <= endOfMonth;
  });

  const totalAmount = orders.reduce((sum, order) => sum + order.total, 0);
  const totalItems = orders.reduce((sum, order) =>
    sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );

  // 按天统计
  const dailyStats: Record<string, { amount: number; count: number }> = {};
  orders.forEach(order => {
    const day = new Date(order.createdAt).getDate();
    const key = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (!dailyStats[key]) {
      dailyStats[key] = { amount: 0, count: 0 };
    }
    dailyStats[key].amount += order.total;
    dailyStats[key].count += 1;
  });

  return {
    orders,
    totalAmount,
    totalItems,
    orderCount: orders.length,
    dailyStats,
  };
}
