import { useState, useCallback } from 'react';

/**
 * 自定义 Hook，用于管理对话框的状态和操作。
 */
export function useDialog<T = unknown>() {
  // 使用 useState 管理对话框的打开和关闭状态，初始值为关闭状态
  const [isOpen, setIsOpen] = useState(false);
  // 使用 useState 管理对话框的数据，初始值为 null
  const [dialogData, setDialogData] = useState<T | null>(null);

  const openDialog = useCallback((data?: T) => {
    // 如果传入了数据，则更新对话框数据
    if (data) setDialogData(data);
    setIsOpen(true);
  }, []);

  /**
   * 关闭对话框的函数，同时清空对话框数据。
   */
  const closeDialog = useCallback(() => {
    setIsOpen(false);
    // 清空对话框数据
    setDialogData(null);
  }, []);

  // 返回对话框的状态和操作函数
  return { isOpen, openDialog, closeDialog, dialogData };
} 