export type SuperAdminDto = {
  id: string
  email: string
  name: string | null
  createdAt: string
}

export type SuperAdminLoginBody = {
  email: string
  password: string
}

export type SuperAdminAuthResponse = {
  accessToken: string
  superAdmin: SuperAdminDto
}
