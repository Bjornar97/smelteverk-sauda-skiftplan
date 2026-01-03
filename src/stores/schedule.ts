import { diffInDays } from "@/helpers/dates";
import { getShiftStartHour } from "@/helpers/shifts";
import { defineStore } from "pinia";
import schedule from "./schedule.json";
import dayjs, { Dayjs } from "dayjs";

export const useScheduleStore = defineStore("schedule", {
    state: () => ({
        schedule,
        selectedGroup: localStorage.getItem("selectedGroup") ?? "B",
    }),
    getters: {
        groups: (state) => {
            return state.schedule.groups;
        },
        getShiftHue: (state) => {
            return (shiftType: string) =>
                state.schedule.shiftTypes.find(
                    (item) => item.name === shiftType
                )?.colorHue;
        },
        getShiftTextLightness: (state) => {
            return (shiftType: string, mode: string = "light") => {
                const shift = state.schedule.shiftTypes.find(
                    (item) => item.name === shiftType
                );

                if (mode === "light") {
                    return shift?.lightnessText;
                }

                return shift?.darkLightnessText;
            };
        },
        getShift: (state) => {
            return (group: string, date: Date): "FM" | "EM" | "N" | "Fri" => {
                const groupOffset =
                    state.schedule.groups.findIndex((item) => item === group) *
                    state.schedule.shiftOffsetPerGroup;

                const dayFromStart = diffInDays(
                    new Date(state.schedule.startDate),
                    date
                );

                const maxIndex = state.schedule.schedule.length;

                let indexInSchedule = (dayFromStart % maxIndex) + groupOffset;

                if (indexInSchedule < 0) {
                    indexInSchedule = maxIndex + indexInSchedule;
                }

                if (indexInSchedule >= maxIndex) {
                    indexInSchedule = indexInSchedule - maxIndex;
                }

                const shift = state.schedule.schedule[indexInSchedule];

                if (
                    typeof shift === "string" &&
                    !["FM", "EM", "N", "Fri"].includes(shift)
                ) {
                    throw new Error(`Non existing shift found: ${shift}`);
                }

                return shift as "FM" | "EM" | "N" | "Fri";
            };
        },
        getNextShift(state) {
            return (): { date: Dayjs; shift: "FM" | "EM" | "N" } => {
                const now = dayjs();
                const MAX_SHIFT_LOOKAHEAD_DAYS = 14;

                let startDay = 0;
                const todayShift = this.getShift(
                    state.selectedGroup,
                    now.toDate()
                );

                if (todayShift !== "Fri") {
                    const shiftStartHour = getShiftStartHour(todayShift, now);

                    if (now.hour() >= shiftStartHour) {
                        startDay = 1;
                    }
                }

                for (let i = startDay; i < MAX_SHIFT_LOOKAHEAD_DAYS; i++) {
                    const checkDate = now.add(i, "day").startOf("day");
                    const shift = this.getShift(
                        state.selectedGroup,
                        checkDate.toDate()
                    );

                    if (shift !== "Fri") {
                        return { date: checkDate, shift };
                    }
                }

                throw new Error(
                    `No upcoming shift found for group: ${state.selectedGroup} `
                );
            };
        },
        getAdjacentShiftGroup(state) {
            return (
                type: "previous" | "next"
            ): { group: string; shift: string } => {
                const adder = type === "next" ? 1 : -1;
                const shift = this.getNextShift();

                let currentShiftIndex = state.schedule.shiftTypes.findIndex(
                    (item) => item.name === shift.shift
                );

                let date = dayjs(shift.date);

                const maxIterations = state.schedule.shiftTypes.length;

                for (let i = 0; i < maxIterations; i++) {
                    currentShiftIndex += adder;

                    if (currentShiftIndex < 0) {
                        currentShiftIndex =
                            state.schedule.shiftTypes.length +
                            currentShiftIndex;
                        date = date.add(adder, "day");
                    }

                    if (currentShiftIndex >= state.schedule.shiftTypes.length) {
                        currentShiftIndex =
                            currentShiftIndex -
                            state.schedule.shiftTypes.length;
                        date = date.add(adder, "day");
                    }

                    const adjacentShiftName =
                        state.schedule.shiftTypes[currentShiftIndex].name;

                    if (adjacentShiftName === "Fri") {
                        continue;
                    }

                    const group = state.schedule.groups.find((group) => {
                        const shiftOnDate = this.getShift(group, date.toDate());
                        return shiftOnDate === adjacentShiftName;
                    });

                    if (group) {
                        return { group, shift: adjacentShiftName };
                    }
                }

                throw new Error(
                    `No adjacent group found for group: ${state.selectedGroup}`
                );
            };
        },
    },
    actions: {
        setSelectedGroup(group: string) {
            this.selectedGroup = group;
            localStorage.setItem("selectedGroup", group);
        },
    },
});
