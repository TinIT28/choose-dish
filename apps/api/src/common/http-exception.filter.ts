import { Catch, HttpException, HttpStatus, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { ApiErrorBody } from '@choose-dish/contract';
import type { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw = exception instanceof HttpException ? exception.getResponse() : null;
    const payload = typeof raw === 'object' && raw !== null ? (raw as { code?: string; message?: string | string[] }) : {};
    // class-validator reports an array of field messages; everything else is one string.
    const fieldErrors = Array.isArray(payload.message) ? payload.message : undefined;

    const body: ApiErrorBody = {
      code: payload.code ?? `HTTP_${status}`,
      message: Array.isArray(payload.message) ? 'Dữ liệu không hợp lệ' : payload.message ?? 'Đã có lỗi xảy ra',
      ...(fieldErrors ? { fieldErrors } : {}),
    };
    response.status(status).json(body);
  }
}
