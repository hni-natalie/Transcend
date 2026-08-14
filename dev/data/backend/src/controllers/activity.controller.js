const activityService = require('../services/activity.service');

const validateType = (type) => {
    const ALLOWED_TYPES = ['presence', 'space', 'task', 'meeting'];
    return type && ALLOWED_TYPES.includes(type.toLowerCase()) 
        ? type.toLowerCase() 
        : undefined;
};

const validateSort = (sortBy, sortOrder) => {
    const ALLOWED_SORT_FIELDS = ['createdAt', 'type', 'action'];
    const safeSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';
    return { safeSortBy, safeSortOrder };
};

const buildDateFilter = (startDate, endDate) => {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    // reject garbage input rather than letting an invalid date silently produce no filter
    if (startDate && isNaN(start?.getTime())) return null;
    if (endDate && isNaN(end?.getTime())) return null;

    if (!start && !end) return null;

    const filter = {};
    if (start) filter.gte = start;
    if (end) filter.lte = end;
    return filter;
};

const activityController = {
    async getAllActivities(req, res) {
        try {
            const {
                type,
                search,
				startDate,
                endDate,
                page = 1,
                limit = 50,
                sortBy = 'createdAt',
                sortOrder = 'desc'
            } = req.query;

            const workspaceId = req.user.workspaceId;
            const safeType = validateType(type);
            const { safeSortBy, safeSortOrder } = validateSort(sortBy, sortOrder);
			const dateFilter = buildDateFilter(startDate, endDate);

            const filters = {
                workspaceId,
                ...(safeType && { type: safeType }),
				...(dateFilter && { createdAt: dateFilter }),
                ...(search && {
                    OR: [
                        { user: { userName: { contains: search, mode: 'insensitive' } } },
                        { action: { contains: search, mode: 'insensitive' } },
                        { contextTitle: { contains: search, mode: 'insensitive' } },
                        { contextDetails: { contains: search, mode: 'insensitive' } }
                    ]
                })
            };

            const result = await activityService.getPaginatedActivities({
                filters,
                page: parseInt(page),
                limit: parseInt(limit),
                sortBy: safeSortBy,
                sortOrder: safeSortOrder
            });

            return res.status(200).json({
                success: true,
                data: result.activities,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: result.total,
                    totalPages: result.totalPages,
                    hasMore: result.hasMore
                }
            });
        } catch (error) {
            console.error('Get activities error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    async getRecentActivities(req, res) {
        try {
            const { type, limit = 3 } = req.query;
            const workspaceId = req.user.workspaceId;
			const safeType = validateType(type);

            const filters = {
                workspaceId,
                ...(safeType && { type: safeType })
            };

            const activities = await activityService.getRecentActivities({
                filters,
                limit: parseInt(limit)
            });

            return res.status(200).json({ success: true, data: activities });
        } catch (error) {
            console.error('Get recent activities error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    },

    async exportActivities(req, res) {
        try {
            const { type, search, format = 'csv' } = req.query;
            const workspaceId = req.user.workspaceId;
			const safeType = validateType(type);

            const filters = {
                workspaceId,
                ...(safeType && { type: safeType }),
                ...(search && {
                    OR: [
                        { user: { userName: { contains: search, mode: 'insensitive' } } },
                        { action: { contains: search, mode: 'insensitive' } }
                    ]
                })
            };

            const activities = await activityService.exportActivities({ filters, format });

            if (format === 'csv') {
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', 'attachment; filename=activities.csv');
                return res.send(activities);
            }

            return res.status(200).json({ success: true, data: activities });
        } catch (error) {
            console.error('Export activities error:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }
};

module.exports = activityController;