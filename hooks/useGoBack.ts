"use client"

import { useRouter } from "next/navigation";

export const useGoBack = () => {
  const router = useRouter()

  const goBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push("/")
    }
  }

  return goBack
}
