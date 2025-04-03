import { defineStore } from 'pinia'

interface UserState {
  token: string | null
  userInfo: {
    id?: string
    username?: string
    role?: string
  } | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: localStorage.getItem('token'),
    userInfo: null,
  }),

  getters: {
    isLoggedIn: state => !!state.token,
  },

  actions: {
    // 添加验证token并获取用户信息的方法
    async verifyToken() {
      const token = this.token
      if (!token) {
        return false
      }

      try {
        const response = await fetch('http://localhost:3000/api/auth/verify-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        // 尝试解析响应
        let data
        try {
          data = await response.json()
        } catch (e) {
          console.error('解析响应失败:', e)
          return false
        }

        if (!response.ok || !data.valid) {
          // token无效，清除登录状态
          this.logout()
          return false
        }

        // 设置用户信息
        this.userInfo = data.user
        return true
      } catch (error) {
        console.error('验证token失败:', error)
        this.logout()
        return false
      }
    },

    async login(username: string, password: string) {
      try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        })

        // 尝试解析响应
        let data
        try {
          data = await response.json()
        }
        catch (e) {
          console.error('解析响应失败:', e)
          return false
        }

        if (!response.ok) {
          throw new Error(data.message || '登录失败')
        }

        this.token = data.token
        this.userInfo = data.user
        localStorage.setItem('token', data.token)
        return true
      }
      catch (error) {
        console.error('登录错误:', error)
        return false
      }
    },

    async register(username: string, password: string, role: string = 'employee') {
      try {
        const response = await fetch('http://localhost:3000/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password, role }),
        })

        // 尝试解析响应
        let data
        try {
          data = await response.json()
        }
        catch (e) {
          console.error('解析响应失败:', e)
          return false
        }

        if (!response.ok) {
          throw new Error(data.message || '注册失败')
        }
        return true
      }
      catch (error) {
        console.error('注册错误:', error)
        return false
      }
    },

    logout() {
      this.token = null
      this.userInfo = null
      localStorage.removeItem('token')
    },
  },
})
