export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export const generateRandomPassword = (): string => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  
  // 确保至少包含一个字母和一个数字
  let password = letters.charAt(Math.floor(Math.random() * letters.length)); // 随机字母
  password += numbers.charAt(Math.floor(Math.random() * numbers.length)); // 随机数字
  
  // 生成剩余4位字符
  const chars = letters + numbers;
  for (let i = 0; i < 4; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // 打乱密码字符顺序
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

export const isValidPassword = (password: string): boolean => {
  // 验证密码是否为6位且包含至少一个字母和一个数字
  return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6}$/.test(password);
}; 