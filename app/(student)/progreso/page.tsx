import { notFound } from "next/navigation";
import { ProgresoBitacora } from "@/components/screens/progreso-bitacora";
import { getEscenario } from "@/lib/fixtures";

export default function ProgresoPage() {
  const props = getEscenario("FX-LOCAL-PROG-VALIDATED").progreso;
  if (!props) notFound();
  return <ProgresoBitacora {...props} />;
}
