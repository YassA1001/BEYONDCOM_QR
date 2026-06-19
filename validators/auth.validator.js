const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.empty': 'L\'email est obligatoire.',
    'string.email': 'Email invalide.',
    'any.required': 'L\'email est obligatoire.',
  }),
  password: Joi.string().min(6).required().messages({
    'string.empty': 'Le mot de passe est obligatoire.',
    'string.min': 'Mot de passe trop court.',
    'any.required': 'Le mot de passe est obligatoire.',
  }),
});

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(80).required().messages({
    'string.empty': 'Le nom est obligatoire.',
    'string.min': 'Nom trop court.',
    'any.required': 'Le nom est obligatoire.',
  }),
  email: Joi.string().email().required().messages({
    'string.empty': 'L\'email est obligatoire.',
    'string.email': 'Email invalide.',
    'any.required': 'L\'email est obligatoire.',
  }),
  password: Joi.string().min(6).max(100).required().messages({
    'string.empty': 'Le mot de passe est obligatoire.',
    'string.min': 'Min 6 caractères.',
    'any.required': 'Le mot de passe est obligatoire.',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Les mots de passe ne correspondent pas.',
    'any.required': 'Confirmez le mot de passe.',
  }),
});

const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  role: Joi.string().valid('ADMIN', 'SUPER_ADMIN').default('ADMIN'),
});

module.exports = { loginSchema, registerSchema, createUserSchema };
