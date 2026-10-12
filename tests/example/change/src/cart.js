const COUPONS = {
  PERC10: (sum) => sum * 0.99,
  FIX5: (sum) => sum - 5,
};

export function total(items, coupon) {
  const sum = items.reduce((acc, item) => acc + item.price * item.qty, 0);
  const apply = COUPONS[coupon];
  return apply ? apply(sum) : sum;
}
