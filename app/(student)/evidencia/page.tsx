import { notFound } from "next/navigation";
import { Evidencia } from "@/components/screens/evidencia";
import { getEscenario } from "@/lib/fixtures";

export default function EvidenciaPage() {
  const props = getEscenario("FX-EVD-BASE").evidencia;
  if (!props) notFound();
  return <Evidencia {...props} />;
}
