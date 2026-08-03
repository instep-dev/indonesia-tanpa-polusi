import SuperAdminAuthProvider from '@/providers/SuperAdminAuthProvider'
import SuperAdminTopbar from '@/components/dashboard/SuperAdminTopbar'

const SuperAdminLayout = ({ children }: { children: React.ReactNode }) => (
  <SuperAdminAuthProvider>
    <div className="workspace-canvas relative min-h-screen bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(17,17,17,0.05),transparent)]"
      />
      <SuperAdminTopbar />
      <main className="relative">{children}</main>
    </div>
  </SuperAdminAuthProvider>
)

export default SuperAdminLayout
