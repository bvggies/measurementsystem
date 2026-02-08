/**
 * POST /api/validation/check - Run auto-validation rules on measurement data
 * Body: { measurement: { trouser_waist, trouser_thigh, ... } }
 * Returns: { valid: boolean, errors: [], warnings: [] }
 */

const { query } = require('../utils/db');
const { requireAuth } = require('../utils/auth');

function runRule(rule, data) {
  const a = data[rule.field_a];
  const b = data[rule.field_b];
  if (a == null || a === '' || b == null || b === '') return null;
  const numA = parseFloat(a);
  const numB = parseFloat(b);
  if (isNaN(numA) || isNaN(numB)) return null;

  let violated = false;
  switch (rule.operator) {
    case '>=':
      violated = numA < numB;
      break;
    case '<=':
      violated = numA > numB;
      break;
    case '>':
      violated = numA <= numB;
      break;
    case '<':
      violated = numA >= numB;
      break;
    default:
      return null;
  }
  if (!violated) return null;
  const message = (rule.message_template || 'Validation failed')
    .replace(/\{\{a\}\}/g, numA)
    .replace(/\{\{b\}\}/g, numB);
  return { rule_key: rule.rule_key, rule_type: rule.rule_type, message };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    requireAuth(req);
    const measurement = req.body?.measurement || req.body || {};
    let rules = [];
    try {
      rules = await query(
        'SELECT rule_key, rule_type, field_a, field_b, operator, message_template FROM validation_rules WHERE is_active = true',
        []
      );
    } catch (err) {
      if (err.message && err.message.includes('validation_rules')) {
        return res.status(200).json({ valid: true, errors: [], warnings: [] });
      }
      throw err;
    }

    const errors = [];
    const warnings = [];
    for (const rule of rules || []) {
      const result = runRule(rule, measurement);
      if (result) {
        if (rule.rule_type === 'impossible') errors.push(result);
        else warnings.push(result);
      }
    }

    return res.status(200).json({
      valid: errors.length === 0,
      errors,
      warnings,
    });
  } catch (error) {
    if (error.message === 'Authentication required' || error.message === 'Invalid or expired token') {
      return res.status(401).json({ error: error.message });
    }
    console.error('Validation check error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
};
