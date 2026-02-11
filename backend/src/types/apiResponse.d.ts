export interface ValidationError {
  field: string;
  message: string;
}
export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: ValidationError[];
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
