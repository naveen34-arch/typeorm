import Joi from 'joi';

export const signupSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  age: Joi.number().integer().min(1).max(120).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  phoneNum: Joi.string().pattern(/^[0-9+\-\s()]+$/).min(10).max(15).required(),
  course: Joi.string().min(2).max(100).required(),
  city: Joi.string().min(2).max(100).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  age: Joi.number().integer().min(1).max(120).optional(),
  phoneNum: Joi.string().pattern(/^[0-9+\-\s()]+$/).min(10).max(15).optional(),
  course: Joi.string().min(2).max(100).optional(),
  city: Joi.string().min(2).max(100).optional(),
}).min(1); // At least one field must be provided