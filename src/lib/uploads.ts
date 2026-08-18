"use server";

import { v2 as cloudinary } from "cloudinary";
import { requireToken } from "@/lib/auth/session";

// Uploads straight from this Next.js server to Cloudinary (via
// CLOUDINARY_URL) — the Go backend's own /admin/uploads is tenant-scoped
// (needs a tenant's X-API-Key, which this app never has), so this bypasses
// it entirely, same as digitalbrochure/admin does. The browser only ever
// sees the resulting secure_url; credentials stay server-side.
cloudinary.config({ secure: true });

const MAX_BYTES = 10 * 1024 * 1024;

export interface UploadResult {
  url?: string;
  error?: string;
}

export async function uploadImageAction(formData: FormData): Promise<UploadResult> {
  await requireToken();

  if (!process.env.CLOUDINARY_URL) {
    return { error: "CLOUDINARY_URL is not configured on the server." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "No file provided." };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "Only image files are supported." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "Images must be under 10MB." };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;
    const result = await cloudinary.uploader.upload(dataUri, { folder: "digitalservice-platform-admin" });
    return { url: result.secure_url };
  } catch {
    return { error: "Upload failed. Please try again." };
  }
}
