import SuperAdminAuthProvider from '@/providers/SuperAdminAuthProvider'

const SuperAdminLayout = ({ children }: { children: React.ReactNode }) => (
  <SuperAdminAuthProvider>
    <section>{children}</section>
  </SuperAdminAuthProvider>
)

export default SuperAdminLayout
