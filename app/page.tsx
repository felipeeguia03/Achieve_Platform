import { redirect } from "next/navigation";

// UX01 (Hoy) es la entrada del Golden Path. El grafo de transiciones entre
// superficies llega en la Etapa 0.3 (lib/navigation/).
export default function Home() {
  redirect("/hoy");
}
