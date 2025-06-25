import { postApi } from '../utils/apiClient';

export interface RegisterParams {
  username: string;
  password: string;
  email: string;
  code: string;
}

export interface LoginParams {
  username: string;
  password: string;
}

export const register = async (params: RegisterParams) => {
  const response = await postApi('/user/register', params);
  if (response.code !== 200) {
    throw new Error(response.message);
  }
  return response.data;
};

export const login = async (params: LoginParams) => {
  const response = await postApi('/user/login', params);
  if (response.code !== 200) {
    throw new Error(response.message);
  }
  return response.data;
};

export const logout = async () => {
  const response = await postApi('/user/logout', {});
  if (response.code !== 200) {
    throw new Error(response.message);
  }
  return response.data;
};

export const sendVerificationCode = async (email: string) => {
  const response = await postApi('/user/verification-code', { email });
  if (response.code !== 200) {
    throw new Error(response.message);
  }
  return response.data;
}; 