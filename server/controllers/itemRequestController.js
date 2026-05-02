const { findItemById } = require('../models/itemModel');
const {
  createItemRequest,
  findDefaultRequesterId,
  findDefaultInventoryManagerId,
  listItemRequests,
  reviewItemRequest,
  findItemRequestById,
  issueApprovedItemRequest,
} = require('../models/itemRequestModel');

function parsePositiveInt(value) {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

async function submitItemRequest(req, res) {
  const { itemId, requestedBy, quantityRequested, department, purpose, recipientRoom } = req.body;

  if (!itemId || !quantityRequested || !department || !purpose || !recipientRoom) {
    return res.status(400).json({
      ok: false,
      message: 'itemId, quantityRequested, department, purpose and recipientRoom are required',
    });
  }

  const parsedItemId = parsePositiveInt(itemId);
  const parsedRequestedBy = requestedBy === undefined ? null : parsePositiveInt(requestedBy);
  const parsedQuantity = parsePositiveInt(quantityRequested);

  if (!parsedItemId) {
    return res.status(400).json({
      ok: false,
      message: 'itemId must be a positive integer',
    });
  }

  if (!parsedQuantity) {
    return res.status(400).json({
      ok: false,
      message: 'quantityRequested must be a positive integer',
    });
  }

  if (requestedBy !== undefined && !parsedRequestedBy) {
    return res.status(400).json({
      ok: false,
      message: 'requestedBy must be a positive integer when provided',
    });
  }

  try {
    const existingItem = await findItemById(parsedItemId);

    if (!existingItem) {
      return res.status(404).json({
        ok: false,
        message: 'Item not found',
      });
    }

    const requesterId = parsePositiveInt(req.user?.id || req.user?.userId);

    if (!requesterId) {
      return res.status(400).json({
        ok: false,
        message: 'Authenticated user id is required to submit a request',
      });
    }

    const createdRequest = await createItemRequest({
      itemId: parsedItemId,
      requestedBy: requesterId,
      quantityRequested: parsedQuantity,
      department: String(department).trim(),
      purpose: String(purpose).trim(),
      recipientRoom: String(recipientRoom).trim(),
    });

    res.status(201).json({
      ok: true,
      message: 'Item request submitted successfully',
      data: createdRequest,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Failed to submit item request',
      error: error.message,
    });
  }
}

async function getItemRequests(_req, res) {
  try {
    // If the caller is admin or manager, return all requests.
    // Otherwise return only requests created by the authenticated user.
    const callerRole = String(_req.user?.role || _req.user?.userRole || '').toLowerCase();
    const callerId = parsePositiveInt(_req.user?.id || _req.user?.userId);

    let requests;
    if (callerRole === 'admin' || callerRole === 'manager' || callerRole === 'inventory_manager') {
      requests = await listItemRequests();
    } else {
      requests = await listItemRequests(callerId);
    }

    res.status(200).json({ ok: true, data: requests });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Failed to load item requests',
      error: error.message,
    });
  }
}

async function updateItemRequestReview(req, res) {
  const requestId = parsePositiveInt(req.params.requestId);
  const { status, rejectionReason } = req.body;
  const normalizedStatus = String(status || '').toLowerCase();

  if (!requestId) {
    return res.status(400).json({
      ok: false,
      message: 'requestId must be a positive integer',
    });
  }

  if (!['approved', 'rejected'].includes(normalizedStatus)) {
    return res.status(400).json({
      ok: false,
      message: "status must be either 'approved' or 'rejected'",
    });
  }

  if (normalizedStatus === 'rejected' && !String(rejectionReason || '').trim()) {
    return res.status(400).json({
      ok: false,
      message: 'rejectionReason is required when rejecting a request',
    });
  }

  try {
    const request = await findItemRequestById(requestId);

    if (!request) {
      return res.status(404).json({
        ok: false,
        message: 'Item request not found',
      });
    }

    if (!['pending', 'approved'].includes(String(request.status))) {
      return res.status(409).json({
        ok: false,
        message: "Only pending or approved requests can be reviewed",
      });
    }

    const actorId = parsePositiveInt(req.user?.id || req.user?.userId) || (await findDefaultInventoryManagerId());

    if (!actorId) {
      return res.status(400).json({
        ok: false,
        message: 'No active inventory manager found to review the request',
      });
    }

    const updatedRequest = await reviewItemRequest({
      requestId,
      reviewedBy: actorId,
      status: normalizedStatus,
      rejectionReason: normalizedStatus === 'rejected' ? String(rejectionReason).trim() : null,
    });

    res.status(200).json({
      ok: true,
      message: `Item request ${normalizedStatus}`,
      data: updatedRequest,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Failed to review item request',
      error: error.message,
    });
  }
}

async function issueItemRequest(req, res) {
  const requestId = parsePositiveInt(req.params.requestId);

  if (!requestId) {
    return res.status(400).json({
      ok: false,
      message: 'requestId must be a positive integer',
    });
  }

  try {
    const actorId = parsePositiveInt(req.user?.id || req.user?.userId) || (await findDefaultInventoryManagerId());

    if (!actorId) {
      return res.status(400).json({
        ok: false,
        message: 'No active inventory manager found to issue the request',
      });
    }

    const result = await issueApprovedItemRequest({
      requestId,
      issuedBy: actorId,
    });

    res.status(200).json({
      ok: true,
      message: 'Item request issued successfully',
      data: result,
    });
  } catch (error) {
    const statusCode =
      error.message === 'Item request not found'
        ? 404
        : error.message === 'Only approved requests can be issued' || error.message === 'Insufficient stock to issue this request'
          ? 409
          : 500;

    res.status(statusCode).json({
      ok: false,
      message: statusCode === 500 ? 'Failed to issue item request' : error.message,
      error: error.message,
    });
  }
}

module.exports = {
  submitItemRequest,
  getItemRequests,
  updateItemRequestReview,
  issueItemRequest,
};
