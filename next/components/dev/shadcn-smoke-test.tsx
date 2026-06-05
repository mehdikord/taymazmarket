"use client";

import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ShadcnSmokeTest() {
  return (
    <Button
      type="button"
      onClick={() => toast.success("ShadCN و Sonner فعال هستند")}
    >
      تست اعلان
    </Button>
  );
}
