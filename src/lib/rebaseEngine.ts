import type { RebaseSettings } from '@/types';

export interface RebaseState {
  baseCapital: number;
  upwardIndex: number;
  downwardIndex: number;
}

export function initRebaseState(startingBalance: number): RebaseState {
  return {
    baseCapital: startingBalance,
    upwardIndex: 0,
    downwardIndex: 0,
  };
}

export function isRebaseActive(settings: RebaseSettings | undefined): boolean {
  if (!settings || !settings.enabled) return false;
  if (settings.upwardEnabled && settings.upwardMilestones.length > 0) return true;
  if (settings.downwardEnabled && settings.downwardMilestones.length > 0) return true;
  return false;
}

export function checkRebase(
  currentBalance: number,
  state: RebaseState,
  settings: RebaseSettings | undefined,
): { state: RebaseState; rebased: boolean } {
  if (!isRebaseActive(settings)) {
    return { state, rebased: false };
  }

  let { baseCapital, upwardIndex, downwardIndex } = state;
  let rebased = false;

  if (settings!.upwardEnabled && upwardIndex < settings!.upwardMilestones.length) {
    const sortedUp = [...settings!.upwardMilestones].sort((a, b) => a - b);
    if (currentBalance >= sortedUp[upwardIndex]) {
      baseCapital = sortedUp[upwardIndex];
      upwardIndex++;
      rebased = true;
    }
  }

  if (settings!.downwardEnabled && downwardIndex < settings!.downwardMilestones.length) {
    const sortedDown = [...settings!.downwardMilestones].sort((a, b) => b - a);
    if (currentBalance <= sortedDown[downwardIndex]) {
      baseCapital = sortedDown[downwardIndex];
      downwardIndex++;
      rebased = true;
    }
  }

  return { state: { baseCapital, upwardIndex, downwardIndex }, rebased };
}

export function getEffectiveBaseCapital(
  balance: number,
  startingBalance: number,
  settings: RebaseSettings | undefined,
  state: RebaseState,
): number {
  if (!isRebaseActive(settings)) return startingBalance;
  return state.baseCapital;
}
