export const OPEN_COOLPET_ADVISOR_EVENT = "coolpet:open-advisor";

export interface OpenCoolPetAdvisorDetail {
  opener: HTMLElement | null;
}

export function openCoolPetAdvisor(opener: HTMLElement | null = null): void {
  window.dispatchEvent(new CustomEvent<OpenCoolPetAdvisorDetail>(OPEN_COOLPET_ADVISOR_EVENT, {
    detail: { opener },
  }));
}
