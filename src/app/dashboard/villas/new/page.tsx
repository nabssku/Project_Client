import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { VillaForm } from "@/components/dashboard/villas/villa-form";

export const instant = false;

export const metadata = {
  title: "Tambah Unit Villa Baru - Dashboard",
  description: "Formulir pendaftaran unit villa baru dengan galeri foto Cloudflare R2",
};

export default async function NewVillaPage() {
  await connection();
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Strict RBAC: Only ADMIN can access new villa form
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard/villas");
  }

  return <VillaForm />;
}
