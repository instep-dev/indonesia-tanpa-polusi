import AuthProvider from '@/providers/AuthProvider'

const DashboardLayout = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <div className="min-h-screen">{children}</div>
  </AuthProvider>
)

export default DashboardLayout
