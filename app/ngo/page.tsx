"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NgoIndexRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/ngo/dashboard");
  }, [router]);
  return null;
}
