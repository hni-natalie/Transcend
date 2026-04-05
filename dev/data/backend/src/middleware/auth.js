const jwt = require('jsonwebtoken')
const fs = require('fs')
const JWT_SECRET = fs.readFileSync('/run/secrets/jwt_secret', 'utf8').trim()

module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization']
    if (!authHeader) return res.status(401).json({ error: 'No token provided' })

    const token = authHeader.split(' ')[1]
    try {
        req.user = jwt.verify(token, JWT_SECRET)
        next()
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' })
    }
}