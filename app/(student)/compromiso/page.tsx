import { notFound } from "next/navigation";
import { Compromiso } from "@/components/screens/compromiso";
import { getEscenario } from "@/lib/fixtures";

export default function CompromisoPage() {
  const props = getEscenario("FX-DAY-BASE").compromiso;
  if (!props) notFound();
  return <Compromiso {...props} />;
}
