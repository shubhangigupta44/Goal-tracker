const AuditLog = require('../models/AuditLog');

const logAudit = async (entityId, changedBy, action, changes) => {
  try {
    await AuditLog.create({
      entityId,
      changedBy,
      action,
      changes
    });
  } catch (error) {
    console.error('Audit Log Error:', error);
  }
};

module.exports = { logAudit };
