const SPAM_PATTERNS = [
  /(.)\1{4,}/,           // lặp ký tự: aaaaa
  /^[^a-zA-ZÀ-ỹ0-9]+$/, // toàn ký tự đặc biệt
];

/**
 * Kiểm tra spam căn bản trước khi gửi qua API AI
 * @param {string} text nội dung đánh giá
 * @returns {object} { isSpam: boolean, reason: string }
 */
export const quickSpamCheck = (text) => {
  if (!text || text.trim().length < 5) {
    return { isSpam: true, reason: "Nội dung quá ngắn (tối thiểu 5 ký tự)" };
  }
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) {
      return { isSpam: true, reason: "Nội dung chứa mẫu ký tự rác hoặc spam" };
    }
  }
  return { isSpam: false };
};