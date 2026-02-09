const asyncHandler = require('../../utils/asyncHandler');
const db = require('../../config/db');

exports.getDashboardStats = asyncHandler(async (req, res) => {
    // Mock data for demonstration as we might not have populated cross-service tables
    const stats = {
        recordings: {
            totalDuration: 12500, // minutes
            dailyTrend: [
                { date: '2025-03-01', duration: 120 },
                { date: '2025-03-02', duration: 150 },
                { date: '2025-03-03', duration: 180 },
                { date: '2025-03-04', duration: 90 },
                { date: '2025-03-05', duration: 210 },
                { date: '2025-03-06', duration: 240 },
                { date: '2025-03-07', duration: 300 }
            ]
        },
        aiUsage: {
            totalRequests: 450,
            byType: [
                { name: '教案生成', value: 150 },
                { name: '题目生成', value: 120 },
                { name: '课件优化', value: 80 },
                { name: '其他', value: 100 }
            ]
        }
    };

    res.json({
        code: 200,
        message: 'Dashboard stats retrieved',
        data: stats
    });
});
