/**
 * TIỆN ÍCH PHẢN HỒI API CHUẨN HÓA
 */

export const success = (res, message = "Thành công", data = {}, status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

export const error = (res, message = "Lỗi máy chủ", status = 500, errorData = null) => {
  if (errorData) {
    console.error(`[API Error] ${message}:`, errorData);
  }
  return res.status(status).json({
    success: false,
    message,
  });
};
