
module.exports = function (req, res, next) {
  // Check if user is authenticated by Passport
  if (req.isAuthenticated()) {
    return next();
  }

  // If not authenticated, deny access
  return res.status(401).json({ message: 'Not authenticated, please log in' });
};