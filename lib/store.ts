import { create } from "zustand"
import { persist } from "zustand/middleware"

interface UserState {
  users: any[]
  roles: any[]
  permissions: any[]
  setUsers: (users: any[]) => void
  setRoles: (roles: any[]) => void
  setPermissions: (permissions: any[]) => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      users: [],
      roles: [],
      permissions: [],
      setUsers: (users) => set({ users }),
      setRoles: (roles) => set({ roles }),
      setPermissions: (permissions) => set({ permissions }),
    }),
    {
      name: "user-management-store",
    },
  ),
)
