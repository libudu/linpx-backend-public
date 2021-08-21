import { Request, Response, NextFunction } from 'express';
import { query, param, validationResult } from 'express-validator';

export const refreshError = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req).array();
  if(errors.length > 0) {
    return res.send({ error: true, msg: errors[0].msg });
  }
  return next();
};

export const checkParamId = param('id').isNumeric().withMessage('param id must be number');

export const queryStringCheck = (name: string) => {
  return query(name).isString().withMessage(`${name} must be string`);
};

export const queryNumberCheck = (name: string) => {
  return query(name).isNumeric().withMessage(`${name} must be number`);
};