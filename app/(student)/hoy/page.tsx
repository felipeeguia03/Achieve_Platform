import { notFound } from "next/navigation";
import { HoyAutogestion } from "@/components/screens/hoy-autogestion";
import { getEscenario, proyectarHoy } from "@/lib/fixtures";

// La ruta lee el escenario y lo proyecta. La pantalla nunca importa un fixture:
// esa frontera es lo que hace barato el Track B (architecture.md §2.4).
export default function HoyPage() {
  const props = proyectarHoy(getEscenario("FX-DAY-BASE"));
  if (!props) notFound();
  return <HoyAutogestion {...props} />;
}
