import { useParams } from "react-router-dom";
import { useProject } from "./api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading } = useProject(id);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando obra...</p>;
  }

  if (!project) {
    return <p className="text-sm text-destructive">Obra no encontrada.</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{project.name}</h1>
        <p className="text-sm text-muted-foreground">{project.address}</p>
      </div>

      <Tabs defaultValue="schedule">
        <TabsList>
          <TabsTrigger value="schedule">Cronograma</TabsTrigger>
          <TabsTrigger value="budget">Presupuesto</TabsTrigger>
          <TabsTrigger value="sitelog">Bitácora</TabsTrigger>
          <TabsTrigger value="payments">Pagos</TabsTrigger>
        </TabsList>
        <TabsContent value="schedule">
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              El cronograma de esta obra se implementa en la Fase 3.
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="budget">
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              El presupuesto vs. gasto real de esta obra se implementa en la Fase 2.
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="sitelog">
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              La bitácora de obra se implementa en la Fase 4.
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="payments">
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              Los pagos a proveedores se implementan en la Fase 5.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
