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
  let discount = 0;

  if (discountType === "percent") {
    discount = Math.floor((baseAmount * discountValue) / 100);
    if (maxDiscount && maxDiscount > 0) {
      discount = Math.min(discount, maxDiscount);
    }
  } else {
    discount = discountValue;
  }

  discount = Math.max(0, discount);
  discount = Math.min(discount, baseAmount);

  return discount;
}

module.exports = {
  normalizeVoucherCode,
  isVoucherInTime,
  calculateDiscount,
};