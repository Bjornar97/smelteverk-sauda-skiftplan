import { Dayjs } from "dayjs";

/**
 * Check if a date falls on a weekend (Friday, Saturday, or Sunday)
 */
export const isWeekend = (date: Dayjs): boolean => {
    const dayOfWeek = date.day(); // 0 = Sunday, 5 = Friday, 6 = Saturday
    return dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
};

/**
 * Get the hour when a shift officially starts
 * Note: Workers typically arrive 1 hour early to relieve the previous shift
 */
export const getShiftStartHour = (shift: string, date: Dayjs): number => {
    switch (shift) {
        case "FM":
            return 7; // 07:00 official start (workers arrive at 06:00)
        case "EM":
            return 15; // 15:00 official start (workers arrive at 14:00)
        case "N":
            return isWeekend(date) ? 19 : 23; // 19:00 weekends / 23:00 weekdays official start
        default:
            return 0;
    }
};
