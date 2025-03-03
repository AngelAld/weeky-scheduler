"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { checkTimeConflict } from "@/lib/schedule-utils";
import type { Activity } from "@/lib/types";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusIcon, Trash2 } from "lucide-react";

const weekdays = [
  { id: "monday", label: "Lunes", abbr: "Lun" },
  { id: "tuesday", label: "Martes", abbr: "Mar" },
  { id: "wednesday", label: "Miércoles", abbr: "Mié" },
  { id: "thursday", label: "Jueves", abbr: "Jue" },
  { id: "friday", label: "Viernes", abbr: "Vie" },
  { id: "saturday", label: "Sábado", abbr: "Sáb" },
  { id: "sunday", label: "Domingo", abbr: "Dom" },
] as const;

const formSchema = z.object({
  title: z.string().min(2, {
    message: "El título debe tener al menos 2 caracteres.",
  }),
  description: z.string().optional(),
  days: z
    .array(
      z.enum([
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ])
    )
    .min(1, {
      message: "Selecciona al menos un día.",
    }),
  startTimes: z.array(z.string()).min(1, {
    message: "Por favor selecciona una hora de inicio.",
  }),
  endTimes: z.array(z.string()).min(1, {
    message: "Por favor selecciona una hora de finalización.",
  }),
  color: z.string().default("#4f46e5"),
});

interface ActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddActivities: (activities: Activity[]) => void;
  existingActivities: Activity[];
}

export function ActivityDialog({
  open,
  onOpenChange,
  onAddActivities,
  existingActivities,
}: ActivityDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      days: [],
      endTimes: [],
      startTimes: [],
      color: "#4f46e5",
    },
  });

  // Asegurarse de que haya al menos un día para mostrar los campos
  React.useEffect(() => {
    if (form.getValues("days").length === 0) {
      form.setValue("days", ["monday"]);
      form.setValue("startTimes", [""]);
      form.setValue("endTimes", [""]);
    }
  }, [form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    const { startTimes, endTimes, days } = values;

    // Validate that end time is after start time
    for (let i = 0; i < startTimes.length; i++) {
      if (startTimes[i] >= endTimes[i]) {
        toast.error(
          "La hora de finalización debe ser posterior a la hora de inicio"
        );
        return;
      }
    }

    // Create an activity for each selected day
    const newActivities: Activity[] = days.map((day, i) => ({
      id: uuidv4(),
      ...values,
      day,
      startTime: startTimes[i],
      endTime: endTimes[i],
    }));

    // Check for time conflicts on each day
    const conflicts = newActivities
      .map((activity) => {
        const conflict = checkTimeConflict(activity, existingActivities);
        if (conflict) {
          return `${weekdays.find((d) => d.id === activity.day)?.label}: "${
            conflict.title
          }" (${conflict.startTime} - ${conflict.endTime})`;
        }
        return null;
      })
      .filter(Boolean);

    if (conflicts.length > 0) {
      toast.error(
        <div className="space-y-2">
          <p>Conflictos de horario detectados:</p>
          <ul className="list-disc pl-4">
            {conflicts.map((conflict, index) => (
              <li key={index}>{conflict}</li>
            ))}
          </ul>
        </div>
      );
      return;
    }

    onAddActivities(newActivities);
    toast.success("Actividades agregadas correctamente");
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-y-auto max-h-[90vh]">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <DialogHeader>
              <DialogTitle>Agregar Nueva Actividad</DialogTitle>
              <DialogDescription>
                Completa el formulario para agregar una nueva actividad a tu
                horario.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Clase de matemáticas"
                        {...field}
                      />
                    </FormControl>
                    <div className="h-6">
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Sala 201" {...field} />
                    </FormControl>
                    <div className="h-6">
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </div>
            <FormLabel>Días y Horarios</FormLabel>
            {form.watch("days").map((_, index) => (
              <div
                key={index}
                className="grid md:grid-cols-10 gap-3 p-3 rounded-lg bg-muted/40 border items-end"
              >
                <FormField
                  control={form.control}
                  name={`days.${index}`}
                  render={({ field }) => (
                    <FormItem className="col-span-3">
                      <FormLabel>Día de la semana</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un día" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {weekdays.map((day) => (
                            <SelectItem key={day.id} value={day.id}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`startTimes.${index}`}
                  render={({ field }) => (
                    <FormItem className="col-span-3">
                      <FormLabel>Hora de inicio</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} className="" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`endTimes.${index}`}
                  render={({ field }) => (
                    <FormItem className="col-span-3">
                      <FormLabel>Hora de finalización</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} className="" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="button"
                  className="cursor-pointer w-full sm:w-auto col-span-3 md:col-span-1"
                  variant="destructive"
                  size="icon"
                  onClick={() => {
                    const days = form.getValues("days");
                    const startTimes = form.getValues("startTimes");
                    const endTimes = form.getValues("endTimes");
                    days.splice(index, 1);
                    startTimes.splice(index, 1);
                    endTimes.splice(index, 1);
                    form.setValue("days", days);
                    form.setValue("startTimes", startTimes);
                    form.setValue("endTimes", endTimes);
                  }}
                >
                  <Trash2 size={24} />{" "}
                  <span className="inline-block md:hidden">Eliminar Día</span>
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                form.setValue("days", [...form.getValues("days"), "monday"]);
                form.setValue("startTimes", [
                  ...form.getValues("startTimes"),
                  "",
                ]);
                form.setValue("endTimes", [...form.getValues("endTimes"), ""]);
              }}
            >
              <PlusIcon />
              Agregar Día
            </Button>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          {...field}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          type="text"
                          value={field.value}
                          onChange={field.onChange}
                          className="flex-1"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Selecciona un color para identificar esta actividad
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Agregar Actividad</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
