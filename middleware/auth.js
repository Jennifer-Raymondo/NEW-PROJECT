module.exports.ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
};

module.exports.ensureManager = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'manager') return next();
  res.redirect('/login');
};

module.exports.ensureAttendant = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'attendant') return next();
  res.redirect('/login');
};
