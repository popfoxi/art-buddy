
export const SUPPORT_CATEGORIES = [
  { id: 'system_error', label: '系統異常', description: '無法使用功能、報錯' },
  { id: 'credits_issue', label: '次數/點數問題', description: '點數未入帳、次數異常扣除' },
  { id: 'account_login', label: '帳號與登入', description: '無法登入、帳號設定' },
  { id: 'subscription_payment', label: '訂閱與付款', description: '升級問題、扣款疑問' },
  { id: 'feature_request', label: '功能建議', description: '希望新增的功能' },
  { id: 'report_violation', label: '違規檢舉', description: '檢舉不當內容' },
  { id: 'other', label: '其他協助', description: '其他問題' },
] as const;

export type SupportCategoryId = typeof SUPPORT_CATEGORIES[number]['id'];
