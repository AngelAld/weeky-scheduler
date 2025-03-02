"use client";

import { ActivityDialog } from "@/components/activity-dialog";
import { ExportOptions } from "@/components/export-options";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { WeeklySchedule } from "@/components/weekly-schedule";
import type { Activity } from "@/lib/types";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";

export function SchedulePlanner() {
  const [activities, setActivities] = useState<Activity[]>(() => {
    if (typeof window !== "undefined") {
      const savedActivities = localStorage.getItem("activities");
      return savedActivities ? JSON.parse(savedActivities) : [];
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("activities", JSON.stringify(activities));
  }, [activities]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const addActivities = (newActivities: Activity[]) => {
    setActivities((prev) => [...prev, ...newActivities]);
  };

  const removeActivity = (id: string) => {
    setActivities((prev) => prev.filter((activity) => activity.id !== id));
  };

  return (
    <div className="container mx-auto max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-3xl font-semibold sm:font-bold">
          Planificador de Horarios
        </h1>
        <div className="flex items-center gap-2">
          <ExportOptions activities={activities} />
          <ThemeToggle />
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Mi Horario Semanal</CardTitle>
            <CardDescription className="hidden sm:block">
              Visualiza y gestiona tus actividades semanales.
            </CardDescription>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Actividad
          </Button>
        </CardHeader>
        <CardContent>
          <WeeklySchedule activities={activities} onRemove={removeActivity} />
        </CardContent>
      </Card>

      <ActivityDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onAddActivities={addActivities}
        existingActivities={activities}
      />
    </div>
  );
}
