import { notFound } from "next/navigation";
import { MateriaCursado } from "@/components/screens/materia-cursado";
import { getEscenario } from "@/lib/fixtures";

export default function MateriaPage() {
  const props = getEscenario("FX-DAY-BASE").materia;
  if (!props) notFound();
  return <MateriaCursado {...props} />;
}
