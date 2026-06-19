const Joi = require('joi');

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const eventSchema = Joi.object({
  name: Joi.string().min(2).max(120).required().messages({
    'string.empty': 'Le nom est obligatoire.',
    'string.min': 'Nom trop court.',
    'any.required': 'Le nom est obligatoire.',
  }),
  description: Joi.string().allow('').max(2000).optional(),
  location: Joi.string().allow('').max(200).optional(),
  city: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'La ville est obligatoire.',
    'any.required': 'La ville est obligatoire.',
  }),
  startDate: Joi.alternatives().try(
    Joi.date(),
    Joi.string().allow('').optional(),
  ).optional(),
  endDate: Joi.alternatives().try(
    Joi.date(),
    Joi.string().allow('').optional(),
  ).optional(),
  primaryColor: Joi.string().pattern(HEX).allow('').default('#0ea5e9').messages({
    'string.pattern.base': 'Couleur hex invalide (ex: #1a2b3c).',
  }),
  isActive: Joi.any().optional(),
}).custom((obj, helpers) => {
  if (obj.startDate && obj.endDate) {
    const s = new Date(obj.startDate);
    const e = new Date(obj.endDate);
    if (!Number.isNaN(s.getTime()) && !Number.isNaN(e.getTime()) && e < s) {
      return helpers.error('any.invalid', { message: 'La date de fin doit être après la date de début.' });
    }
  }
  return obj;
});

module.exports = { eventSchema, HEX };
