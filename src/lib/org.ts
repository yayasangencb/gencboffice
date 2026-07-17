import { supabase } from "@/integrations/supabase/client";

export type Organization = {
  id: string;
  name: string;
  short_name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo_url: string;
  ketua_name: string;
  sekretaris_name: string;
  ttd_ketua_url: string;
  ttd_sekretaris_url: string;
};

export async function fetchOrganization(): Promise<Organization> {
  const { data, error } = await supabase
    .from("organization" as never)
    .select("*")
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data ?? {
    id: "",
    name: "Yayasan Generasi Cerdas Beraksi",
    short_name: "GEN-CB",
    address: "",
    phone: "",
    email: "yayasangencb@gmail.com",
    website: "",
    logo_url: "",
    ketua_name: "",
    sekretaris_name: "",
    ttd_ketua_url: "",
    ttd_sekretaris_url: "",
  }) as unknown as Organization;
}

export async function saveOrganization(id: string, patch: Partial<Organization>) {
  const { error } = await supabase
    .from("organization" as never)
    .update(patch as never)
    .eq("id", id);
  if (error) throw error;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}