<script lang="ts" setup>
import { useScheduleStore } from "@/stores/schedule";
import { ArrowRight } from "mdue";
import { computed } from "vue";

const scheduleStore = useScheduleStore();

const prevShiftGroup = computed(() =>
    scheduleStore.getAdjacentShiftGroup("previous")
);
const nextShiftGroup = computed(() =>
    scheduleStore.getAdjacentShiftGroup("next")
);

const nextShift = computed(() => scheduleStore.getNextShift());

const capitalizedDate = computed(() => {
    const date = nextShift.value.date.calendar();
    return date.charAt(0).toUpperCase() + date.slice(1);
});

const getShiftCssVars = (shift: string) => {
    return {
        "--shift-color-hue": scheduleStore.getShiftHue(shift),
        "--shift-color-text-lightness": scheduleStore.getShiftTextLightness(
            shift,
            "light"
        ),
        "--shift-color-text-lightness-dark":
            scheduleStore.getShiftTextLightness(shift, "dark"),
    } as Record<string, string>;
};
</script>

<template>
    <div class="next-shift">
        <p class="your-shift-date">{{ capitalizedDate }}</p>

        <div class="groups">
            <div
                class="adjacent"
                :style="getShiftCssVars(prevShiftGroup.shift)"
            >
                <p class="group">{{ prevShiftGroup.group }}</p>
                <p class="shift-type">{{ prevShiftGroup.shift }}</p>
            </div>

            <ArrowRight class="arrow" />

            <div class="your-shift" :style="getShiftCssVars(nextShift.shift)">
                <p class="group">{{ scheduleStore.selectedGroup }}</p>
                <p class="shift-type">{{ nextShift.shift }}</p>
            </div>

            <ArrowRight class="arrow" />

            <div
                class="adjacent"
                :style="getShiftCssVars(nextShiftGroup.shift)"
            >
                <p class="group">{{ nextShiftGroup.group }}</p>
                <p class="shift-type">{{ nextShiftGroup.shift }}</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.next-shift {
    border-bottom: 1px solid var(--color-background-mute);
    padding-bottom: 2rem;
    margin-block: 0.5rem 1rem;
}

.groups {
    display: grid;
    grid-template-columns: auto 1fr auto 1fr auto;
    justify-items: center;
    align-items: end;
    gap: 1rem;
    text-align: center;
}

.your-shift-date {
    font-size: 1.25rem;
    text-align: center;
}

.group {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
}

.your-shift .group {
    font-weight: bold;
    font-size: 1.5rem;
}

.arrow {
    width: 2rem;
    height: 2rem;
    align-self: center;
}

.shift-type {
    min-width: 3rem;
    padding: 0.5rem 1rem;
    background-color: hsl(var(--shift-color-hue), 90%, 45%);
    color: hsl(var(--shift-color-hue), 30%, var(--shift-color-text-lightness));
    border-radius: 0.5rem;
    transition: background-color 250ms ease-in;

    @media (prefers-color-scheme: dark) {
        background-color: hsl(var(--shift-color-hue), 90%, 30%);
        color: hsl(
            var(--shift-color-hue),
            30%,
            var(--shift-color-text-lightness-dark)
        );
    }
}
</style>
