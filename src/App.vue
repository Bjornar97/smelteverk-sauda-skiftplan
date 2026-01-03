<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import {
    CalendarMinus as CalendarMinusIcon,
    CalendarMonth as CalendarMonthIcon,
    Close as CloseIcon,
    Download,
    Share as ShareIcon,
} from "mdue";
import { useScheduleStore } from "./stores/schedule";
import { computed } from "@vue/reactivity";
import GroupSelect from "./components/GroupSelect.vue";
import { ref } from "vue";

const scheduleStore = useScheduleStore();

const selectedGroup = computed(() => scheduleStore.selectedGroup);
const groups = computed(() => {
    return scheduleStore.groups.map((item) => {
        return {
            id: item,
            label: item,
        };
    });
});

const isInstalled = () => {
    // Do not show on desktop
    if (window.matchMedia("(min-width: 768px)").matches) return true;

    // For iOS
    // @ts-ignore
    if (window.navigator?.standalone) return true;

    // For Android
    if (window.matchMedia("(display-mode: standalone)").matches) return true;

    // If neither is true, it's not installed
    return false;
};

const showInstallCard = ref(false);

let defferedPrompt: null | any;

window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    defferedPrompt = event;

    showInstallCard.value = !isInstalled();
});

const install = () => {
    defferedPrompt?.prompt();

    defferedPrompt?.userChoice.then(() => {
        defferedPrompt = null;
    });
};

const shareObject: ShareData = {
    url: `https://${location.host}`,
    text: "Skiftplan for smelteverk Sauda",
};

const canShare = ref(false);

if (typeof navigator.canShare !== "undefined") {
    canShare.value = navigator.canShare(shareObject);
}

const share = () => {
    navigator.share(shareObject).catch((e) => {
        console.log(e);
    });
};
</script>

<template>
    <header>
        <div class="install-card" v-if="showInstallCard">
            <p>Installer som app</p>
            <button type="button" class="button" @click="install">
                <Download />
                Installer
            </button>
            <button type="button" class="icon-button">
                <CloseIcon
                    width="2rem"
                    height="2rem"
                    @click="showInstallCard = false"
                ></CloseIcon>
            </button>
        </div>
        <div class="title-bar">
            <h2 class="title">Velg skift</h2>
            <button
                v-if="canShare"
                @click="share"
                type="button"
                class="icon-button"
                aria-label="Del nettsiden"
            >
                <div class="icon">
                    <ShareIcon width="2rem" height="2rem"></ShareIcon>
                </div>
                <span>Del</span>
            </button>
        </div>

        <nav aria-label="Velg skift" class="group-select-nav">
            <GroupSelect
                class="group-select"
                v-model="selectedGroup"
                :options="groups"
                @change="scheduleStore.setSelectedGroup($event.toString())"
            ></GroupSelect>
        </nav>
    </header>

    <main>
        <RouterView />
    </main>

    <footer>
        <nav>
            <RouterLink class="nav-link bold has-accent-icon" to="14-days">
                <span>14</span>
                <CalendarMinusIcon class="accent-icon"></CalendarMinusIcon>
            </RouterLink>

            <RouterLink class="nav-link bold" to="month">
                <CalendarMonthIcon class="nav-icon"></CalendarMonthIcon>
            </RouterLink>
        </nav>
    </footer>
</template>

<style lang="scss">
@import "@/assets/main.css";

#app {
    max-width: 1280px;
    margin: 0 auto;
    font-weight: normal;
    margin-bottom: 10rem;
}

header,
main {
    margin: 0 1rem;
}

header {
    margin-bottom: 2rem;
}

.install-card {
    display: grid;
    grid-template-columns: 1fr max-content max-content;
    align-items: center;
    margin-block-start: 1rem;
    padding: 1.5rem;
    border: var(--color-background-soft);
    background-color: var(--color-background-mute);
    border-radius: 0.5rem;

    p {
        font-size: 1.2rem;
    }

    .button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem 0.75rem 1.25rem;
        background-color: var(--color-primary);
        color: hsl(var(--color-primary-hue), var(--color-primary-sat), 85%);
        border: none;
        border-radius: 0.3rem;
        font-size: 1.2rem;
    }
}

.icon-button {
    cursor: pointer;
    background-color: transparent;
    border: none;
    width: 2rem;
    height: 2rem;
    color: var(--color-text);
}

.title-bar {
    display: grid;
    grid-template-columns: 1fr 4rem;
    align-items: flex-end;
    justify-content: space-between;
    margin-inline: 0.5rem;
    margin-inline-end: 1rem;
    padding-bottom: 0.5rem;

    .icon-button {
        display: grid;
        align-items: center;
        grid-template-columns: max-content 2rem;
        font-weight: bold;
        font-size: 1.1rem;
    }
}

.title {
    display: block;
    font-size: 1.2rem;
    margin-top: 1rem;
    flex-grow: 1;
}

.group-select {
    margin-bottom: 1rem;
    justify-self: center;
    padding: 0;
    align-items: center;

    * {
        flex-grow: 1;
    }
}

footer {
    position: fixed;
    display: grid;
    justify-content: center;
    height: max-content;
    bottom: 0;
    right: 0;
    left: 0;
    background-color: var(--color-background-mute);
    z-index: 99;
    max-height: 5rem;

    nav {
        display: flex;
        width: max-content;
        align-content: space-between;
        gap: 1.5rem;
        max-height: 4rem;

        .nav-icon {
            width: 2rem;
            height: 2rem;
            color: #777;
        }

        .nav-link {
            font-size: 1.5rem;
            text-decoration: none;
            color: var(--color-text);
            background-color: var(--color-background-soft);
            padding: 0.5rem 1rem;
            display: grid;
            place-content: center;
            position: relative;

            &.has-accent-icon {
                padding-right: 1.5rem;
                padding-top: 0.7rem;
            }

            .accent-icon {
                position: absolute;
                z-index: 0;
                right: 0.4em;
                top: 0.5rem;
                width: 1rem;
            }
        }

        .router-link-active {
            background-color: hsla(var(--color-primary-hue), 86%, 34%, 0.12);

            .nav-icon {
                color: hsl(var(--color-primary-hue), 86%, 34%);
            }

            &.nav-link {
                color: var(--color-primary);
            }
        }
    }
}
</style>
