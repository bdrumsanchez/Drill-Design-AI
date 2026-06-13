import { writable } from "svelte/store";

export const dots = writable([]);
export const currentStep = writable(0);
export const totalSteps = writable(1);
