import type { Activity } from "./types";

// Convert time string (HH:MM) to minutes for easier comparison
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

// Check if two time ranges overlap
const doTimesOverlap = (
  startTime1: string,
  endTime1: string,
  startTime2: string,
  endTime2: string
): boolean => {
  const start1 = timeToMinutes(startTime1);
  const end1 = timeToMinutes(endTime1);
  const start2 = timeToMinutes(startTime2);
  const end2 = timeToMinutes(endTime2);

  return start1 < end2 && start2 < end1;
};

// Check if a new activity conflicts with existing activities
export const checkTimeConflict = (
  newActivity: Activity,
  existingActivities: Activity[]
): Activity | null => {
  // Only check conflicts for the same day
  const sameDay = existingActivities.filter(
    (activity) => activity.day === newActivity.day
  );

  for (const activity of sameDay) {
    if (
      doTimesOverlap(
        newActivity.startTime,
        newActivity.endTime,
        activity.startTime,
        activity.endTime
      )
    ) {
      return activity;
    }
  }

  return null;
};
