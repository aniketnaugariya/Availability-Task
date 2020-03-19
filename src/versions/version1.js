
const AuthRoutes = require('../routes/auth.routes');
const AvailabilityRoutes = require('../routes/availability.routes');

module.exports = function (app) {
  app.use('/version1', [
    AuthRoutes,
    AvailabilityRoutes
  ]);
};