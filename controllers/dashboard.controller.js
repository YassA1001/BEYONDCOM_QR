// Dashboard: summary stats + home charts.
const asyncHandler = require('../utils/asyncHandler');
const statsService = require('../services/statsService');

exports.index = asyncHandler(async (req, res) => {
  const [summary, topScanned, topLinks, clicksType, scanSeries] = await Promise.all([
    statsService.dashboardSummary(),
    statsService.topScannedEvents(5),
    statsService.topClickedLinks(5),
    statsService.clicksByType(),
    statsService.scansByDay(7),
  ]);

  res.render('admin/dashboard', {
    layout: 'layout/admin',
    title: 'Tableau de bord',
    activeMenu: 'dashboard',
    summary,
    topScanned,
    topLinks,
    clicksType,
    scanSeries,
  });
});
