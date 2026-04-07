import jwt from 'jsonwebtoken'

export function requireAuth(req, res, next) {
  const token = req.cookies?.bullmind_token
    ?? req.headers.authorization?.split(' ')[1]

  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// requireRole('admin') or requireRole('admin', 'editor')
// Always chain AFTER requireAuth
export function requireRole(...roles) {
  return (req, res, next) => {
    const userRole = req.user?.role ?? 'editor'
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${userRole}`,
      })
    }
    next()
  }
}
