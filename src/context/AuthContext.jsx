import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

function loadUser() {
  try { return JSON.parse(localStorage.getItem('bc_user')) } catch { return null }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser)

  function login(userData) {
    localStorage.setItem('bc_user', JSON.stringify(userData))
    setUser(userData)
  }

  function logout() {
    localStorage.removeItem('bc_user')
    setUser(null)
  }

  function refreshUser(updated) {
    const merged = { ...user, ...updated }
    localStorage.setItem('bc_user', JSON.stringify(merged))
    setUser(merged)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
