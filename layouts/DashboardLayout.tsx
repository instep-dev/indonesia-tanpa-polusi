import AuthProvider from '@/providers/AuthProvider'
import DashboardTopbar from '@/components/dashboard/DashboardTopbar'

const DashboardLayout = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>
    <div className="workspace-canvas relative min-h-screen bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(17,17,17,0.05),transparent)]"
      />
      <DashboardTopbar />
      <main className="relative">{children}</main>
    </div>
  </AuthProvider>
)

export default DashboardLayout
