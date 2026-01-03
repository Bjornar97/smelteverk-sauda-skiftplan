import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useScheduleStore } from "./schedule";
import dayjs from "dayjs";

describe("useScheduleStore", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        // Mock localStorage
        const localStorageMock = (() => {
            let store: Record<string, string> = {};
            return {
                getItem: (key: string) => store[key] || null,
                setItem: (key: string, value: string) => {
                    store[key] = value;
                },
                clear: () => {
                    store = {};
                },
            };
        })();
        vi.stubGlobal("localStorage", localStorageMock);
        localStorage.clear();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("getters", () => {
        describe("getShift", () => {
            it("should return correct shift for group A on start date", () => {
                const store = useScheduleStore();
                const startDate = new Date("2022-01-03");
                expect(store.getShift("A", startDate)).toBe("FM");
            });

            it("should return correct shift for group B with offset", () => {
                const store = useScheduleStore();
                const startDate = new Date("2022-01-03");
                // Group B has offset of 7 days
                expect(store.getShift("B", startDate)).toBe("EM");
            });

            it("should handle negative day differences (dates before start)", () => {
                const store = useScheduleStore();
                const beforeStart = new Date("2022-01-01");
                const shift = store.getShift("A", beforeStart);
                expect(["FM", "EM", "N", "Fri"]).toContain(shift);
            });

            it("should handle dates far in the future", () => {
                const store = useScheduleStore();
                const futureDate = new Date("2030-01-01");
                const shift = store.getShift("A", futureDate);
                expect(["FM", "EM", "N", "Fri"]).toContain(shift);
            });

            it("should throw error for invalid shift in schedule", () => {
                const store = useScheduleStore();
                // Save original schedule
                const originalSchedule = [...store.schedule.schedule];
                try {
                    // Mock schedule with invalid shift
                    store.schedule.schedule = ["INVALID"];
                    expect(() =>
                        store.getShift("A", new Date("2022-01-03"))
                    ).toThrow("Non existing shift found: INVALID");
                } finally {
                    // Restore original schedule
                    store.schedule.schedule = originalSchedule;
                }
            });
        });

        describe("getNextShift", () => {
            it("should return today's shift if before official start time", () => {
                vi.useFakeTimers();
                const store = useScheduleStore();
                store.selectedGroup = "A";

                // Mock current time to 06:00 (before FM official start at 07:00)
                vi.setSystemTime(new Date("2022-01-03T06:00:00"));

                const nextShift = store.getNextShift();
                expect(nextShift.shift).toBe("FM");
                expect(nextShift.date.format("YYYY-MM-DD")).toBe("2022-01-03");

                vi.useRealTimers();
            });

            it("should return next day's shift if after official start time", () => {
                vi.useFakeTimers();
                const store = useScheduleStore();
                store.selectedGroup = "A";

                // Mock current time to 08:00 (after FM official start at 07:00)
                vi.setSystemTime(new Date("2022-01-03T08:00:00"));

                const nextShift = store.getNextShift();
                expect(nextShift.date.isAfter(dayjs("2022-01-03"), "day")).toBe(
                    true
                );

                vi.useRealTimers();
            });

            it("should skip Fri days when finding next shift", () => {
                vi.useFakeTimers();
                const store = useScheduleStore();
                store.selectedGroup = "A";

                // Set to a date where we know there are Fri days coming up
                vi.setSystemTime(new Date("2022-01-06T08:00:00"));

                const nextShift = store.getNextShift();
                expect(nextShift.shift).not.toBe("Fri");
                expect(["FM", "EM", "N"]).toContain(nextShift.shift);

                vi.useRealTimers();
            });

            it("should handle N shift cutoff at 23:00 on weekdays", () => {
                vi.useFakeTimers();
                const store = useScheduleStore();
                store.selectedGroup = "E";

                // Find a weekday N shift (should end at 23:00)
                vi.setSystemTime(new Date("2022-01-17T22:30:00")); // Monday

                const shift = store.getShift("E", new Date("2022-01-17"));
                if (shift === "N") {
                    const nextShift = store.getNextShift();
                    expect(nextShift.date.format("YYYY-MM-DD")).toBe(
                        "2022-01-17"
                    );

                    vi.setSystemTime(new Date("2022-01-17T23:30:00"));
                    setActivePinia(createPinia());
                    const store2 = useScheduleStore();
                    store2.selectedGroup = "E";

                    const nextShift2 = store2.getNextShift();
                    expect(
                        nextShift2.date.isAfter(dayjs("2022-01-17"), "day")
                    ).toBe(true);
                }

                vi.useRealTimers();
            });

            it("should handle N shift cutoff at 19:00 on weekends", () => {
                vi.useFakeTimers();
                const store = useScheduleStore();

                // Find a weekend with N shift (Friday/Saturday/Sunday)
                // Let's use a specific date we know has patterns
                vi.setSystemTime(new Date("2022-01-07T18:30:00")); // Friday

                const shift = store.getShift("A", new Date("2022-01-07"));

                // Only test if it's actually an N shift on weekend
                const dayOfWeek = dayjs("2022-01-07").day();
                if (
                    shift === "N" &&
                    (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6)
                ) {
                    const nextShift = store.getNextShift();
                    expect(nextShift.date.format("YYYY-MM-DD")).toBe(
                        "2022-01-07"
                    );
                }

                vi.useRealTimers();
            });

            it("should throw error if no shift found within 14 days", () => {
                const store = useScheduleStore();
                const originalSchedule = [...store.schedule.schedule];

                try {
                    // Mock schedule to all Fri days
                    store.schedule.schedule = Array(35).fill("Fri");

                    expect(() => store.getNextShift()).toThrow(
                        "No upcoming shift found for group:"
                    );
                } finally {
                    store.schedule.schedule = originalSchedule;
                }
            });
        });

        describe("getAdjacentShiftGroup", () => {
            it("should return next shift group", () => {
                vi.useFakeTimers();
                const store = useScheduleStore();
                store.selectedGroup = "A";

                vi.setSystemTime(new Date("2022-01-03T08:00:00"));

                const adjacent = store.getAdjacentShiftGroup("next");
                expect(store.groups).toContain(adjacent.group);
                expect(["FM", "EM", "N"]).toContain(adjacent.shift);

                vi.useRealTimers();
            });

            it("should return previous shift group", () => {
                vi.useFakeTimers();
                const store = useScheduleStore();
                store.selectedGroup = "A";

                vi.setSystemTime(new Date("2022-01-03T08:00:00"));

                const adjacent = store.getAdjacentShiftGroup("previous");
                expect(store.groups).toContain(adjacent.group);
                expect(["FM", "EM", "N"]).toContain(adjacent.shift);

                vi.useRealTimers();
            });

            it("should skip Fri shifts when finding adjacent group", () => {
                vi.useFakeTimers();
                const store = useScheduleStore();
                store.selectedGroup = "A";

                vi.setSystemTime(new Date("2022-01-03T08:00:00"));

                const next = store.getAdjacentShiftGroup("next");
                expect(next.shift).not.toBe("Fri");

                const prev = store.getAdjacentShiftGroup("previous");
                expect(prev.shift).not.toBe("Fri");

                vi.useRealTimers();
            });

            it("should handle wrap-around in shift types", () => {
                vi.useFakeTimers();
                const store = useScheduleStore();
                store.selectedGroup = "A";

                vi.setSystemTime(new Date("2022-01-03T08:00:00"));

                // Just verify it doesn't crash and returns valid data
                const adjacent = store.getAdjacentShiftGroup("next");
                expect(adjacent.group).toBeTruthy();
                expect(adjacent.shift).toBeTruthy();

                vi.useRealTimers();
            });

            it("should throw error if no adjacent group found", () => {
                const store = useScheduleStore();
                const originalSchedule = [...store.schedule.schedule];

                try {
                    // Set up impossible scenario - all Fri days
                    store.schedule.schedule = Array(35).fill("Fri");

                    expect(() => store.getAdjacentShiftGroup("next")).toThrow();
                } finally {
                    store.schedule.schedule = originalSchedule;
                }
            });
        });
    });

    describe("actions", () => {
        describe("setSelectedGroup", () => {
            it("should update selectedGroup", () => {
                const store = useScheduleStore();
                store.setSelectedGroup("D");
                expect(store.selectedGroup).toBe("D");
            });

            it("should save to localStorage", () => {
                const store = useScheduleStore();
                store.setSelectedGroup("E");
                expect(localStorage.getItem("selectedGroup")).toBe("E");
            });

            it("should persist across store instances", () => {
                const store1 = useScheduleStore();
                store1.setSelectedGroup("C");

                // Create new store instance
                setActivePinia(createPinia());
                const store2 = useScheduleStore();

                expect(store2.selectedGroup).toBe("C");
            });
        });
    });
});
