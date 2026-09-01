import { NuevoBannerForm } from "./NuevoBannerForm";

export const metadata = { title: "Nuevo banner — Panel administrativo" };

export default function NuevoBannerPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-neutral-900">Nuevo banner</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Después de crearlo puedes subirle una imagen.
      </p>

      <NuevoBannerForm />
    </div>
  );
}
