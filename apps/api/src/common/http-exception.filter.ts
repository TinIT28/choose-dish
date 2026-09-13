import { Catch, HttpException, HttpStatus, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw = exception instanceof HttpException ? exception.getResponse() : null;
    const payload = typeof raw === 'object' && raw !== null ? raw as { code?: string; message?: string | string[]; fieldErrors?: unknown } : {};
    const messages = Array.isArray(payload.message) ? payload.message : undefined;

    response.status(status).json({
      code: payload.code ?? `HTTP_${status}`,
      message: messages ? 'Dữ liệu không hợp lệ' : payload.message ?? 'Đã có lỗi xảy ra',
      ...(messages ? { fieldErrors: messages } : {}),
    });
  }
}
