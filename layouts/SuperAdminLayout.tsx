import React from 'react'

const SuperAdminLayout = ({
  children
} : {
  children: React.ReactNode
}) => {
  return (
    <section>
      {children}
    </section>
  )
}

export default SuperAdminLayout