import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function uploadProductLogo(
  file: File,
  productId: string
): Promise<string | null> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${productId}-${Date.now()}.${fileExt}`;
  const filePath = `product-logos/${fileName}`;

  const { error } = await supabaseAdmin.storage
    .from("uploads")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Upload error:", error);
    return null;
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from("uploads").getPublicUrl(filePath);

  return publicUrl;
}
