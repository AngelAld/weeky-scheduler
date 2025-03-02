"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDeviceSizes } from "@/lib/media-queries";
import type { Activity } from "@/lib/types";
import { Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface WeeklyScheduleProps {
  activities: Activity[];
  onRemove: (id: string) => void;
}

// Helper to convert "08:00" to minutes (480)
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

// Helper to convert minutes to position percentage
const minutesToPosition = (
  minutes: number,
  startHour = 6,
  endHour = 22
): string => {
  const totalMinutes = (endHour - startHour) * 60;
  const relativeMinutes = minutes - startHour * 60;
  return `${(relativeMinutes / totalMinutes) * 100}%`;
};

// Helper to calculate height based on duration
const calculateHeight = (
  startTime: string,
  endTime: string,
  startHour = 6,
  endHour = 22
): string => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const duration = endMinutes - startMinutes;
  const totalMinutes = (endHour - startHour) * 60;
  return `${(duration / totalMinutes) * 100}%`;
};

const dayMap: Record<string, { full: string; short: string }> = {
  monday: { full: "Lunes", short: "L" },
  tuesday: { full: "Martes", short: "M" },
  wednesday: { full: "Miércoles", short: "M" },
  thursday: { full: "Jueves", short: "J" },
  friday: { full: "Viernes", short: "V" },
  saturday: { full: "Sábado", short: "S" },
  sunday: { full: "Domingo", short: "D" },
};

export function WeeklySchedule({ activities, onRemove }: WeeklyScheduleProps) {
  const { isMobile } = useDeviceSizes();
  const [isClient, setIsClient] = useState(false);
  // Group activities by day
  const activitiesByDay = useMemo(() => {
    const grouped: Record<string, Activity[]> = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    };

    activities.forEach((activity) => {
      if (grouped[activity.day]) {
        grouped[activity.day].push(activity);
      }
    });

    return grouped;
  }, [activities]);

  // Generate time labels (6:00 AM to 10:00 PM)
  const timeLabels = useMemo(() => {
    const labels = [];
    for (let hour = 6; hour <= 22; hour++) {
      labels.push(`${hour}:00`);
    }
    return labels;
  }, []);

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Function to handle activity click
  const handleActivityClick = (activity: Activity, isMobile: boolean) => {
    if (isMobile) {
      setSelectedActivity(activity);
      setIsDialogOpen(true);
    }
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="w-full overflow-x-auto weekly-schedule-container h-[70vh]">
      <div className="min-w-[50dvw]">
        {/* Day headers */}
        <div className="grid grid-cols-8 gap-1 mb-2 overflow-hidden">
          <div className="text-center font-medium p-2 bg-muted rounded-md truncate">
            Hora
          </div>
          {Object.entries(dayMap).map(([key, label]) => (
            <div
              key={key}
              className="text-center font-medium p-2 bg-muted rounded-md truncate"
            >
              <span className="hidden md:inline">{label.full}</span>
              <span className="md:hidden">{label.short}</span>
            </div>
          ))}
        </div>

        {/* Schedule grid */}
        <div className="grid grid-cols-8 gap-1 relative min-h-[60dvh]">
          {/* Time column */}
          <div className="relative">
            {timeLabels.map((time, index) => (
              <div
                key={index}
                className="absolute w-full text-xs text-right pr-2"
                style={{
                  top: `${(index / (timeLabels.length - 1)) * 100}%`,
                  transform: "translateY(-50%)",
                }}
              >
                {time}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {isClient && (
            <>
              {Object.keys(activitiesByDay).map((day) => (
                <div key={day} className="relative bg-muted/30 rounded-md">
                  {/* Horizontal time guide lines */}
                  {timeLabels.map((_, index) => (
                    <div
                      key={index}
                      className="absolute w-full border-t border-muted-foreground/20"
                      style={{
                        top: `${(index / (timeLabels.length - 1)) * 100}%`,
                      }}
                    />
                  ))}

                  {/* Activities */}
                  {activitiesByDay[day].map((activity) => {
                    return isMobile ? (
                      <Dialog
                        key={activity.id}
                        open={
                          isDialogOpen && selectedActivity?.id === activity.id
                        }
                        onOpenChange={setIsDialogOpen}
                      >
                        <DialogTrigger asChild>
                          <div
                            className="absolute w-[95%] left-[2.5%] rounded-md p-2 overflow-hidden text-xs font-medium text-white flex flex-col"
                            style={{
                              top: minutesToPosition(
                                timeToMinutes(activity.startTime)
                              ),
                              height: calculateHeight(
                                activity.startTime,
                                activity.endTime
                              ),
                              backgroundColor: activity.color,
                            }}
                            onClick={() => handleActivityClick(activity, true)}
                          >
                            <div className="font-bold truncate">
                              {activity.title}
                            </div>
                            <div className="mt-1 opacity-90">
                              {activity.startTime} - {activity.endTime}
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>{activity.title}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3 py-4">
                            {activity.description && (
                              <p>{activity.description}</p>
                            )}
                            <p>
                              Horario: {activity.startTime} - {activity.endTime}
                            </p>
                            <div className="pt-2">
                              <Button
                                variant="destructive"
                                onClick={() => {
                                  onRemove(activity.id);
                                  setIsDialogOpen(false);
                                }}
                                className="w-full"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar actividad
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <TooltipProvider key={activity.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className="absolute w-[95%] left-[2.5%] rounded-md p-2 overflow-hidden text-xs font-medium text-white flex flex-col"
                              style={{
                                top: minutesToPosition(
                                  timeToMinutes(activity.startTime)
                                ),
                                height: calculateHeight(
                                  activity.startTime,
                                  activity.endTime
                                ),
                                backgroundColor: activity.color,
                              }}
                            >
                              <div className="flex justify-between items-start">
                                <div className="font-bold truncate">
                                  {activity.title}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 text-white hover:bg-white/20 -mt-1 -mr-1"
                                  onClick={() => onRemove(activity.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="mt-1 opacity-90">
                                {activity.startTime} - {activity.endTime}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <p className="font-bold">{activity.title}</p>
                              {activity.description && (
                                <p>{activity.description}</p>
                              )}
                              <p>
                                Horario: {activity.startTime} -{" "}
                                {activity.endTime}
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
