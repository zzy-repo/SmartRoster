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
        async login(username: string, password: string) {
            try {
                // TODO: 替换为实际的 API 调用
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                })

                if (!response.ok) {
                    throw new Error('登录失败')
                }

                const data = await response.json()
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

        async register(username: string, password: string) {
            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                })

                if (!response.ok) {
                    throw new Error('注册失败')
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