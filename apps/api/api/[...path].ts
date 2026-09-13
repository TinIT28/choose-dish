import type { Request, Response } from 'express';
import { handler } from '../src/main';

export default function vercelHandler(request: Request, response: Response) {
  return handler(request, response);
}
