import axios from "axios"
import { getBaseApiUrl } from "./getBaseApi"

export const http = axios.create({
  baseURL: getBaseApiUrl(),
  withCredentials: true,
  timeout: 30_00,
  headers: {
    "Content-Type" : "application/json",
  }
})