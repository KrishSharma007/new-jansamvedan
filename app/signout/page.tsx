"use client";

import { useEffect } from "react";

export default function SignoutPage() {
  useEffect(() => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch {}
    // Redirect to login for a clear flow
    window.location.href = "/login";
  }, []);

  return null;
}
