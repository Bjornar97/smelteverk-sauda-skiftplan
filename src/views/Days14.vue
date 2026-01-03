<script setup lang="ts">
import { useScheduleStore } from "@/stores/schedule";
import { computed } from "@vue/reactivity";
import dayjs from "dayjs";
import { ref } from "vue";
import DateShift from "../components/DateShift.vue";
import calendar from "dayjs/plugin/calendar";
import NextShift from "@/components/NextShift.vue";

dayjs.extend(calendar);

const fromDate = ref(dayjs());
const scheduleStore = useScheduleStore();

const isEdited = ref(false);

const fromDateString = computed({
    get: (): string => {
        return fromDate.value.format("YYYY-MM-DD");
    },
    set: (v: string) => {
        isEdited.value = true;
        fromDate.value = dayjs(v);
    },
});

setInterval(() => {
    const now = dayjs();

    if (!isEdited.value && !fromDate.value.isSame(now, "date")) {
        fromDate.value = dayjs();
    }
}, 5000);

const selectedGroup = computed(() => scheduleStore.selectedGroup);

const shifts = computed(() => {
    const shiftsArray: {
        shift: string;
        date: dayjs.Dayjs;
    }[] = [];

    for (let i = 0; i < 14; i++) {
        const date = fromDate.value.add(i, "day").startOf("day");

        shiftsArray.push({
            shift: scheduleStore.getShift(selectedGroup.value, date.toDate()),
            date: date.clone(),
        });
    }

    return shiftsArray;
});
</script>

<template>
    <div>
        <h1 class="title">Neste skift</h1>
        <NextShift />

        <h2 class="title">Neste 14 dager</h2>
        <form @submit.prevent class="from-date-form">
            <label class="from-date-form__label" for="from-date"
                >Fra dato</label
            >
            <input
                class="from-date-form__input"
                type="date"
                name="from-date"
                v-model="fromDateString"
            />
            <button
                class="from-date-form__button"
                v-if="!fromDate.isSame(dayjs(), 'date')"
                @click="fromDateString = dayjs().format('YYYY-MM-DD')"
            >
                I dag
            </button>
        </form>

        <ul class="shifts-list">
            <li v-for="shift in shifts" :key="shift.date.format('YYYY-MM-DD')">
                <DateShift :date="shift.date" :shift="shift.shift"></DateShift>
            </li>
        </ul>
    </div>
</template>

<style lang="scss" scoped>
main {
    display: grid;
    margin-inline: 2rem;
}

.title {
    margin-bottom: -0.3rem;
    font-size: 1.6rem;
}

.shifts-list {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.group-select {
    padding: 0;
}

.from-date-form {
    display: grid;
    grid-template-columns: 1fr max-content;
    max-width: 15rem;
    margin-block-start: 0.5rem;
    margin-block-end: 1.5rem;
    column-gap: 0.5rem;

    &__input {
        grid-column: 1/2;
    }

    &__button {
        padding-inline: 1rem;
        background-color: var(--color-primary);
        color: var(--color-text-invert);
        border: none;
        border-radius: 0.3rem;
        cursor: pointer;
    }
}
</style>
