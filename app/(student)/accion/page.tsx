import { notFound } from "next/navigation";
import { ProximaAccion } from "@/components/screens/proxima-accion";
import { getEscenario } from "@/lib/fixtures";

export default function AccionPage() {
  const props = getEscenario("FX-DAY-BASE").accion;
  if (!props) notFound();
  return <ProximaAccion {...props} />;
}
