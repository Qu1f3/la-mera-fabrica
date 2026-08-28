import type { Metadata } from "next";
import { CotizacionClient } from "./CotizacionClient";

export const metadata: Metadata = {
  title: "Tu cotización",
  robots: { index: false, follow: false },
};

export default function CotizacionPage() {
  return <CotizacionClient />;
}
