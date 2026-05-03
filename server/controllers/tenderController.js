const fs = require('fs/promises');
const path = require('path');
const {
  createTenderNotice,
  deleteTenderNotice,
  findTenderNoticeById,
  listAdminTenderNotices,
  listPublishedTenderNotices,
  updateTenderNotice,
} = require('../models/tenderModel');
const { logAuditAction } = require('../models/auditModel');

const UPLOAD_DIRECTORY = path.join(__dirname, '..', 'uploads', 'tenders');
const ALLOWED_STATUSES = new Set(['draft', 'published', 'expired', 'archived']);
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

function normalizeText(value) {
  return String(value || '').trim();
}

function isValidDeadline(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

function getFileExtension(originalName, mimeType) {
  const explicitExtension = path.extname(String(originalName || '')).toLowerCase();

  if (explicitExtension) {
    return explicitExtension;
  }

  const byMimeType = {
    'application/pdf': '.pdf',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
  };

  return byMimeType[mimeType] || '';
}

function slugify(value) {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'tender-notice';
}

async function ensureUploadDirectory() {
  await fs.mkdir(UPLOAD_DIRECTORY, { recursive: true });
}

async function removeStoredFile(filePath) {
  if (!filePath || !String(filePath).startsWith('/uploads/tenders/')) {
    return;
  }

  const resolvedPath = path.join(__dirname, '..', filePath.replace(/^\//, ''));

  try {
    await fs.unlink(resolvedPath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

async function saveUploadedFile({ title, fileName, mimeType, dataUrl }) {
  if (!dataUrl || typeof dataUrl !== 'string') {
    throw new Error('Tender notice file data is required');
  }

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new Error('Only PDF, JPG, PNG, and WEBP files are allowed');
  }

  const match = dataUrl.match(/^data:([\w/+.-]+);base64,(.+)$/);

  if (!match) {
    throw new Error('Invalid file format received');
  }

  const [, detectedMimeType, base64Payload] = match;

  if (detectedMimeType !== mimeType) {
    throw new Error('Uploaded file type does not match the provided mime type');
  }

  await ensureUploadDirectory();

  const extension = getFileExtension(fileName, mimeType);
  const safeName = `${Date.now()}-${slugify(title)}${extension}`;
  const absolutePath = path.join(UPLOAD_DIRECTORY, safeName);

  await fs.writeFile(absolutePath, Buffer.from(base64Payload, 'base64'));

  return {
    filePath: `/uploads/tenders/${safeName}`,
    fileType: mimeType,
  };
}

async function getPublishedTenderNotices(_req, res) {
  try {
    const notices = await listPublishedTenderNotices();

    res.status(200).json({
      ok: true,
      data: notices,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Failed to load tender notices',
      error: error.message,
    });
  }
}

async function getAdminTenderNotices(_req, res) {
  try {
    const notices = await listAdminTenderNotices();

    res.status(200).json({
      ok: true,
      data: notices,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Failed to load tender notices',
      error: error.message,
    });
  }
}

async function createAdminTenderNotice(req, res) {
  const title = normalizeText(req.body.title);
  const summary = normalizeText(req.body.summary);
  const deadline = normalizeText(req.body.deadline);
  const status = normalizeText(req.body.status).toLowerCase();
  const fileName = normalizeText(req.body.fileName);
  const mimeType = normalizeText(req.body.mimeType).toLowerCase();
  const dataUrl = req.body.fileData;

  if (!title || !deadline || !ALLOWED_STATUSES.has(status)) {
    return res.status(400).json({
      ok: false,
      message: 'title, deadline, and a valid status are required',
    });
  }

  if (!isValidDeadline(deadline)) {
    return res.status(400).json({
      ok: false,
      message: 'deadline must be in YYYY-MM-DD format',
    });
  }

  if (!fileName || !mimeType || !dataUrl) {
    return res.status(400).json({
      ok: false,
      message: 'A tender notice PDF or image file is required',
    });
  }

  let storedFile = null;

  try {
    storedFile = await saveUploadedFile({ title, fileName, mimeType, dataUrl });

    const created = await createTenderNotice({
      createdBy: req.user?.id || req.user?.userId || null,
      title,
      summary: summary || null,
      filePath: storedFile.filePath,
      fileType: storedFile.fileType,
      deadline,
      status,
    });

    await logAuditAction({
      userId: req.user?.id,
      action: 'CREATE',
      tableName: 'tender_notices',
      recordId: created.id,
      details: `Created tender notice: ${title}`,
    });

    res.status(201).json({
      ok: true,
      message: 'Tender notice created successfully',
      data: created,
    });
  } catch (error) {
    if (storedFile?.filePath) {
      await removeStoredFile(storedFile.filePath);
    }

    res.status(500).json({
      ok: false,
      message: 'Failed to create tender notice',
      error: error.message,
    });
  }
}

async function updateAdminTenderNotice(req, res) {
  const tenderId = Number.parseInt(String(req.params.id), 10);
  const title = normalizeText(req.body.title);
  const summary = normalizeText(req.body.summary);
  const deadline = normalizeText(req.body.deadline);
  const status = normalizeText(req.body.status).toLowerCase();
  const fileName = normalizeText(req.body.fileName);
  const mimeType = normalizeText(req.body.mimeType).toLowerCase();
  const dataUrl = req.body.fileData;

  if (!Number.isInteger(tenderId) || tenderId <= 0) {
    return res.status(400).json({
      ok: false,
      message: 'Tender id must be a positive integer',
    });
  }

  if (!title || !deadline || !ALLOWED_STATUSES.has(status)) {
    return res.status(400).json({
      ok: false,
      message: 'title, deadline, and a valid status are required',
    });
  }

  if (!isValidDeadline(deadline)) {
    return res.status(400).json({
      ok: false,
      message: 'deadline must be in YYYY-MM-DD format',
    });
  }

  try {
    const existing = await findTenderNoticeById(tenderId);

    if (!existing) {
      return res.status(404).json({
        ok: false,
        message: 'Tender notice not found',
      });
    }

    let storedFile = null;

    try {
      if (fileName && mimeType && dataUrl) {
        storedFile = await saveUploadedFile({ title, fileName, mimeType, dataUrl });
      }

      const updated = await updateTenderNotice(tenderId, {
        title,
        summary: summary || null,
        filePath: storedFile?.filePath || null,
        fileType: storedFile?.fileType || null,
        deadline,
        status,
      });

      if (storedFile?.filePath) {
        await removeStoredFile(existing.file_path);
      }

      await logAuditAction({
        userId: req.user?.id,
        action: 'UPDATE',
        tableName: 'tender_notices',
        recordId: tenderId,
        details: `Updated tender notice: ${title}`,
      });

      res.status(200).json({
        ok: true,
        message: 'Tender notice updated successfully',
        data: updated,
      });
    } catch (error) {
      if (storedFile?.filePath) {
        await removeStoredFile(storedFile.filePath);
      }

      throw error;
    }
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Failed to update tender notice',
      error: error.message,
    });
  }
}

async function deleteAdminTenderNotice(req, res) {
  const tenderId = Number.parseInt(String(req.params.id), 10);

  if (!Number.isInteger(tenderId) || tenderId <= 0) {
    return res.status(400).json({
      ok: false,
      message: 'Tender id must be a positive integer',
    });
  }

  try {
    const deleted = await deleteTenderNotice(tenderId);

    if (!deleted) {
      return res.status(404).json({
        ok: false,
        message: 'Tender notice not found',
      });
    }

    await removeStoredFile(deleted.file_path);

    await logAuditAction({
      userId: req.user?.id,
      action: 'DELETE',
      tableName: 'tender_notices',
      recordId: tenderId,
      details: 'Deleted tender notice',
    });

    res.status(200).json({
      ok: true,
      message: 'Tender notice deleted successfully',
      data: deleted,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Failed to delete tender notice',
      error: error.message,
    });
  }
}

module.exports = {
  getPublishedTenderNotices,
  getAdminTenderNotices,
  createAdminTenderNotice,
  updateAdminTenderNotice,
  deleteAdminTenderNotice,
};
