import bcrypt from 'bcryptjs'
import pool from '../config/database.js'

export default {
  async findByUsername(username) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username],
    )
    return rows[0]
  },

  async create(username, password, role = 'employee') {
    const hashedPassword = await bcrypt.hash(password, 10)
    const [result] = await pool.execute(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, role],
    )
    return result.insertId
  },
}
