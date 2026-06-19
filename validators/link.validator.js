const Joi = require('joi');

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const LINK_TYPES = [
  'website', 'pdf', 'android', 'ios', 'maps',
  'whatsapp', 'instagram', 'feedback', 'quiz', 'stream', 'other',
];

const linkSchema = Joi.object({
  title: Joi.string().min(2).max(120).required().messages({
    'string.empty': 'Le titre est obligatoire.',
    'any.required': 'Le titre est obligatoire.',
  }),
  type: Joi.string().valid(...LINK_TYPES).required().messages({
    'any.only': 'Type de lien invalide.',
    'any.required': 'Le type est obligatoire.',
  }),
  url: Joi.string().uri({ scheme: ['http', 'https', 'mailto', 'tel', 'whatsapp'] }).required().messages({
    'string.empty': 'L\'URL est obligatoire.',
    'string.uri': 'URL invalide.',
    'any.required': 'L\'URL est obligatoire.',
  }),
  icon: Joi.string().allow('').max(120).optional(),
  color: Joi.string().pattern(HEX).allow('').optional().messages({
    'string.pattern.base': 'Couleur hex invalide.',
  }),
  sortOrder: Joi.number().integer().min(0).max(9999).default(0),
  isActive: Joi.any().optional(),
});

const reorderSchema = Joi.object({
  order: Joi.array().items(Joi.number().integer().min(1)).min(1).required(),
});

module.exports = { linkSchema, reorderSchema, LINK_TYPES };
