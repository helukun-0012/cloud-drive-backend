export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T | null;
}

const API_BASE_URL = '/api';

/**
 * 通用请求函数，返回标准 ApiResponse<T>
 * 自动添加 Authorization 头
 */
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    ...options.headers as Record<string, string>,
  };
  if (token) {
    headers['Authorization'] = token;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // 解析JSON，无论status
  let json: ApiResponse<T>;
  try {
    json = await response.json();
  } catch (err) {
    throw new Error(`无法解析服务器返回: ${response.status}`);
  }

  return json;
}

/**
 * GET 请求
 */
export function getApi<T>(path: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(path, { method: 'GET' });
}

/**
 * POST 请求 (默认 JSON body)
 */
export function postApi<T, B = any>(
  path: string,
  body: B,
  isJson: boolean = true
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {};
  const options: RequestInit = { method: 'POST' };

  if (isJson) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body as any);
  } else {
    // FormData
    options.body = body as any;
  }

  return apiRequest<T>(path, { ...options, headers });
}

/**
 * DELETE 请求
 */
export function deleteApi<T>(path: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(path, { method: 'DELETE' });
}

/**
 * PATCH 请求
 */
export function patchApi<T, B = any>(
  path: string,
  body: B
): Promise<ApiResponse<T>> {
  return apiRequest<T>(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body as any),
  });
}

/**
 * 处理API响应的通用函数
 * @param response API响应对象
 * @param setError 设置错误信息的函数
 * @param successCallback 成功时的回调函数
 * @returns 成功返回true，失败返回false
 */
export function handleApiResponse<T>(
  response: ApiResponse<T>,
  setError: (message: string | null) => void,
  successCallback?: (data: T) => void
): boolean {
  if (response.code === 200) {
    setError(null);
    if (successCallback && response.data !== null) {
      successCallback(response.data);
    }
    return true;
  } else if (
    response.code === 401 && response.message.includes('未登录') 
  ) {
    // 用户未登录或令牌无效，跳转登录
    window.location.href = '/login';
    return false;
  } else {
    console.log('API错误响应:', response);
    setError(response.message);
    return false;
  }
}

/**
 * 执行API调用并自动处理 loading 和错误的高阶函数
 * @param apiCall API调用函数
 * @param setLoading 设置加载状态的函数
 * @param setError 设置错误信息的函数
 * @param successCallback 成功时的回调函数
 * @returns 返回封装后的异步函数
 */
export function executeApiCall<T, P extends any[]>(
  apiCall: (...args: P) => Promise<ApiResponse<T>>,
  setLoading: (loading: boolean) => void,
  setError: (message: string | null) => void,
  successCallback?: (data: T) => void
): (...args: P) => Promise<boolean> {
  return async (...args: P) => {
    try {
      setLoading(true);
      const response = await apiCall(...args);
      return handleApiResponse(response, setError, successCallback);
    } catch (err: any) {
      setError(err.message || '网络连接错误');
      return false;
    } finally {
      setLoading(false);
    }
  };
} 