import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosPromise } from 'axios';

import { Message } from 'element-ui';

import { getCookieData as getCookieDataUtil, showErrMessage, clearPendingRequest } from './util';

import type { COOKIE_DATA, MessageInstance, ErrorDetail } from './util';

import requestInterceptor from './interceptor/request';
import responseInterceptor from './interceptor/response';

declare module 'axios' {
  export interface AxiosResponse {
    success: boolean;
    traceid: string;
    errorDetail: ErrorDetail;
    appid: string;
    hostip: string;
  }

  export interface AxiosError {
    stack?: unknown[];
    type: 'success' | 'warning' | 'info' | 'error';
  }

  export interface AxiosRequestConfig {
    successTxt?: string;
    failTxt?: string;
    warning?: boolean;
    cover?: boolean;
    repeat?: boolean;
    isAddHospitalSoid?: boolean;
    isAddSoid?: boolean;
    baseUrl?: string;
    message?: MessageInstance;
    global?: boolean;
    checkFn?: (data: unknown) => boolean;
    transformData?: (data: unknown) => unknown;
    errorHandler?: (error: AxiosError) => void;
    showDetail?: boolean;
  }
}

export default class Request {
  service: AxiosInstance;

  constructor(options: AxiosRequestConfig = { message: Message }) {
    const { baseURL, baseUrl, timeout, message, ...rest } = options;
    this.service = axios.create({
      baseURL: baseURL || baseUrl || '',
      timeout: timeout || 100000,
      message: message || Message,
      ...rest
    });
    this.temp = this.temp.bind(this);
    this.generate = this.generate.bind(this);
    requestInterceptor(this.service);
    responseInterceptor(this.service);
  }

  static getCookieData(): typeof COOKIE_DATA {
    console.log(
      '[win-request]  API static  getCookieData() has been deprecated and will be removed in next, please use js-cookie instead'
    );
    return getCookieDataUtil();
  }

  // 清除请求
  static clear(whiteList: string[] = []): void {
    console.warn(
      '[win-request] API static clear() has been deprecated and will be removed in next'
    );
    clearPendingRequest(whiteList);
  }

  generate(data: AxiosRequestConfig): AxiosPromise<unknown> {
    return this.service(data).catch((err) => {
      // if err.response则表示请求有返回，status超出 2xx 的范围
      // else if error.request 请求没有返回
      // else 接口请求中发生未知错误
      const { config } = err;
      const { errorDetail, warning } = config;
      if (warning && errorDetail && errorDetail.message) {
        try {
          console.log(`接口报错`);
        } catch (error) {
          console.log(`接口报错`, error);
        }

        showErrMessage(config.message, err);
      }
      return Promise.reject(err);
    });
  }

  temp(
    url: string,
    config: AxiosRequestConfig = {}
  ): (data: unknown, customer: AxiosRequestConfig) => AxiosPromise<unknown> {
    console.log(
      '[win-request]  API temp() will be deprecated and will be removed in next, please use API service() instead'
    );
    return (data: unknown, customer: AxiosRequestConfig): AxiosPromise<unknown> => {
      const options: AxiosRequestConfig = { ...config, ...customer };
      if (options.method === undefined) options.method = 'post'; // 处理默认的method，卫宁内部有效
      const { method } = options;
      return this.generate({
        url,
        method,
        [method === 'post' ? 'data' : 'params']: data,
        ...options
      });
    };
  }
}
