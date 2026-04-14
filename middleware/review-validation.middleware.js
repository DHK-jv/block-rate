import { getGroq } from "../config/grog.config.js";
import { quickSpamCheck } from "../utils/validation-review.util.js";

/**
 * MIDDLEWARE KIỂM DUYỆT ĐÁNH GIÁ BẰNG AI (Groq/Llama 3.1)
 * 
 * Mục đích: Đảm bảo các đánh giá trên sàn TMĐT là văn minh và chất lượng.
 * Quy trình:
 * 1. Kiểm tra nhanh (Quick Spam Check): Dùng Regex để loại bỏ các spam đơn giản (lặp từ, ký tự vô nghĩa).
 * 2. Kiểm duyệt bằng AI: Gửi nội dung sang Groq Cloud (Model Llama 3.1) để phân tích ngữ nghĩa sâu.
 *    - Phát hiện ngôn ngữ thù ghét, tục tĩu.
 *    - Phát hiện quảng cáo rác không liên quan.
 *    - Đảm bảo tính khách quan của đánh giá.
 */
export const moderateReview = async (req, res, next) => {
  const { content, rating } = req.body;
  
  // Nếu không có nội dung, bỏ qua kiểm duyệt (Dành cho trường hợp chỉ đánh giá sao)
  if (!content) return next();

  const textToCheck = [content].filter(Boolean).join(" ");
  
  // BƯỚC 1: KIỂM TRA NHANH (SPAM CƠ BẢN)
  const quickCheck = quickSpamCheck(textToCheck);
  if (quickCheck.isSpam) {
    return res.status(400).json({ 
      success: false, 
      message: `Hệ thống từ chối: ${quickCheck.reason}`, 
      category: "spam" 
    });
  }

  // BƯỚC 2: KIỂM DUYỆT SÂU BẰNG AI
  try {
    const chatCompletion = await getGroq().chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `Bạn là hệ thống kiểm duyệt nội dung review sản phẩm.
            Phân tích nội dung và trả về JSON với format:
            {
              "approved": true/false,
              "reason": "lý do nếu bị từ chối",
              "category": "spam|offensive|fake|clean"
            }
            Từ chối khi:
            - Nội dung tục tĩu, xúc phạm, kỳ thị
            - Spam (lặp ký tự, vô nghĩa, quảng cáo không liên quan)
            - Review giả mạo rõ ràng (toàn chữ hoa, ký tự lạ)
            - Ngôn ngữ thù ghét
            Chỉ trả về JSON, không giải thích thêm.`,
        },
        { role: "user", content: `Kiểm duyệt review sau: "${textToCheck}"` },
      ],
      temperature: 0.1, // Giữ độ chính xác cao, ít sáng tạo
      max_tokens: 150,
    });

    const responseText = chatCompletion.choices[0]?.message?.content?.trim();
    let modResult;
    try { 
      // Ép kiểu về JSON để xử lý kết quả từ AI
      modResult = JSON.parse(responseText); 
    } catch { 
      // Nếu AI trả về định dạng lỗi, tạm cho qua để không làm gián đoạn trải nghiệm người dùng
      return next(); 
    }

    if (!modResult.approved) {
      return res.status(400).json({
        success: false,
        message: `Review bị AI từ chối: ${modResult.reason}`,
        category: modResult.category,
      });
    }

    // Nếu hợp lệ, gắn nhãn (category) vào request để controller xử lý nếu cần
    req.reviewCategory = modResult.category;
    next();
  } catch (error) {
    console.error("⚠️ Lỗi kiểm duyệt Groq AI:", error.message);
    // Nếu API AI lỗi, vẫn cho phép tiếp tục để không chặn người dùng
    next();
  }
};