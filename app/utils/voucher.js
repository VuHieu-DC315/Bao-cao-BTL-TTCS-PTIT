function normalizeVoucherCode(code) {
  return String(code || "").trim().toUpperCase();
}

function isVoucherInTime(voucher) {
  const now = new Date();

  if (voucher.startDate && new Date(voucher.startDate) > now) return false;
  if (voucher.endDate && new Date(voucher.endDate) < now) return false;

  return true;
}

function calculateDiscount({ discountType, discountValue, maxDiscount, baseAmount }) {
  const type = String(discountType || "").trim().toLowerCase();
  const value = Number(discountValue || 0);
  const amount = Number(baseAmount || 0);
  const max = Number(maxDiscount || 0);

  let discount = 0;

  if (type === "percent" || type === "percentage") {
    discount = Math.floor((amount * value) / 100);

    if (max > 0) {
      discount = Math.min(discount, max);
    }
  } else {
    discount = value;
  }

  discount = Math.max(0, discount);
  discount = Math.min(discount, amount);

  return discount;
}

module.exports = {
  normalizeVoucherCode,
  isVoucherInTime,
  calculateDiscount,
};