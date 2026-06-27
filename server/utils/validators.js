// server/utils/validators.js
// Các hàm validate dùng chung — khắc phục các lỗi "sai logic" trong báo cáo review.

// Họ tên: chỉ gồm chữ (có dấu) và khoảng trắng, không số/ký tự đặc biệt, tối thiểu 2 từ
function isValidFullName(name) {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim().replace(/\s+/g, ' ');
  if (trimmed.length < 2) return false;
  const pattern = /^[A-Za-zÀ-ỹà-ỹ]+(\s[A-Za-zÀ-ỹà-ỹ]+)+$/;
  return pattern.test(trimmed);
}

// SĐT Việt Nam: bắt buộc đúng 10 số, bắt đầu bằng 0
function isValidPhone(phone) {
  if (!phone) return false;
  return /^0\d{9}$/.test(String(phone).trim());
}

// Mật khẩu: tối thiểu 8 ký tự, có chữ, có số, có ký tự đặc biệt
function isStrongPassword(password) {
  if (!password || password.length < 8) return false;
  const hasLetter = /[A-Za-zÀ-ỹà-ỹ]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-zÀ-ỹà-ỹ0-9]/.test(password);
  return hasLetter && hasNumber && hasSpecial;
}

// Tỉnh/Thành, Phường/Xã: phải chứa chữ cái, không được chỉ toàn số
function isValidPlaceName(value) {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length < 2) return false;
  if (/^\d+$/.test(trimmed)) return false; // toàn số -> sai
  return /[A-Za-zÀ-ỹà-ỹ]/.test(trimmed); // phải có ít nhất 1 chữ cái
}

// Địa chỉ cụ thể: không bắt buộc chỉ là số, nhưng phải có nội dung thật (không toàn ký tự đặc biệt)
function isValidAddressLine(value) {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.length >= 4 && /[A-Za-zÀ-ỹà-ỹ0-9]/.test(trimmed);
}

function isPositiveNumber(value) {
  const n = Number(value);
  return !Number.isNaN(n) && n > 0;
}

function isNonNegativeInteger(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0;
}

module.exports = {
  isValidFullName, isValidPhone, isStrongPassword, isValidPlaceName,
  isValidAddressLine, isPositiveNumber, isNonNegativeInteger,
};
