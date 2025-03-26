import pool from '../config/database.js'
import bcrypt from 'bcryptjs'

export default {
  async findByUsername(username) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    )
    return rows[0]
  },

  async create(username, password) {
    const hashedPassword = await bcrypt.hash(password, 10)
    const [result] = await pool.execute(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    )
    return result.insertId
  }
}