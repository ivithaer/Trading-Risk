import { initRebaseState, checkRebase, isRebaseActive } from './rebaseEngine';
import type { RebaseSettings } from '@/types';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function makeRebase(overrides: Partial<RebaseSettings> = {}): RebaseSettings {
  return {
    enabled: false,
    upwardEnabled: false,
    downwardEnabled: false,
    upwardMilestones: [],
    downwardMilestones: [],
    ...overrides,
  };
}

const tests: { name: string; fn: () => void }[] = [];

tests.push({
  name: 'isRebaseActive returns false when disabled',
  fn: () => {
    const settings = makeRebase({ enabled: false, upwardEnabled: true, upwardMilestones: [1500] });
    assert(!isRebaseActive(settings), 'Should be inactive when enabled=false');
  },
});

tests.push({
  name: 'isRebaseActive returns false when no milestones configured',
  fn: () => {
    const settings = makeRebase({ enabled: true, upwardEnabled: true, upwardMilestones: [] });
    assert(!isRebaseActive(settings), 'Should be inactive with no milestones');
  },
});

tests.push({
  name: 'isRebaseActive returns true when enabled with upward milestones',
  fn: () => {
    const settings = makeRebase({ enabled: true, upwardEnabled: true, upwardMilestones: [1500] });
    assert(isRebaseActive(settings), 'Should be active');
  },
});

tests.push({
  name: 'Upward rebase: balance crosses milestone triggers rebase',
  fn: () => {
    const settings = makeRebase({ enabled: true, upwardEnabled: true, upwardMilestones: [1500] });
    let state = initRebaseState(1000);
    const result = checkRebase(1550, state, settings);
    assert(result.rebased === true, 'Should rebase when crossing 1500');
    assert(result.state.baseCapital === 1500, 'Base capital should be 1500');
    assert(result.state.upwardIndex === 1, 'Upward index should advance to 1');
  },
});

tests.push({
  name: 'Upward rebase: balance below milestone does not trigger',
  fn: () => {
    const settings = makeRebase({ enabled: true, upwardEnabled: true, upwardMilestones: [1500] });
    let state = initRebaseState(1000);
    const result = checkRebase(1400, state, settings);
    assert(result.rebased === false, 'Should not rebase below 1500');
    assert(result.state.baseCapital === 1000, 'Base capital should stay 1000');
  },
});

tests.push({
  name: 'Upward rebase: multiple milestones in sequence',
  fn: () => {
    const settings = makeRebase({ enabled: true, upwardEnabled: true, upwardMilestones: [1500, 2000, 2500] });
    let state = initRebaseState(1000);

    const r1 = checkRebase(1550, state, settings);
    assert(r1.rebased === true, 'Should rebase at 1500');
    assert(r1.state.baseCapital === 1500, 'Base should be 1500');
    state = r1.state;

    const r2 = checkRebase(2100, state, settings);
    assert(r2.rebased === true, 'Should rebase at 2000');
    assert(r2.state.baseCapital === 2000, 'Base should be 2000');
    state = r2.state;

    const r3 = checkRebase(2600, state, settings);
    assert(r3.rebased === true, 'Should rebase at 2500');
    assert(r3.state.baseCapital === 2500, 'Base should be 2500');
    state = r3.state;

    const r4 = checkRebase(3000, state, settings);
    assert(r4.rebased === false, 'Should not rebase past last milestone');
    assert(r4.state.baseCapital === 2500, 'Base should stay 2500');
  },
});

tests.push({
  name: 'Downward rebase: balance drops below milestone triggers rebase',
  fn: () => {
    const settings = makeRebase({ enabled: true, downwardEnabled: true, downwardMilestones: [750] });
    let state = initRebaseState(1000);
    const result = checkRebase(700, state, settings);
    assert(result.rebased === true, 'Should rebase when dropping below 750');
    assert(result.state.baseCapital === 750, 'Base capital should be 750');
    assert(result.state.downwardIndex === 1, 'Downward index should advance to 1');
  },
});

tests.push({
  name: 'Downward rebase: balance above milestone does not trigger',
  fn: () => {
    const settings = makeRebase({ enabled: true, downwardEnabled: true, downwardMilestones: [750] });
    let state = initRebaseState(1000);
    const result = checkRebase(800, state, settings);
    assert(result.rebased === false, 'Should not rebase above 750');
    assert(result.state.baseCapital === 1000, 'Base capital should stay 1000');
  },
});

tests.push({
  name: 'Downward rebase: multiple milestones in sequence',
  fn: () => {
    const settings = makeRebase({ enabled: true, downwardEnabled: true, downwardMilestones: [750, 500] });
    let state = initRebaseState(1000);

    const r1 = checkRebase(700, state, settings);
    assert(r1.rebased === true, 'Should rebase at 750');
    assert(r1.state.baseCapital === 750, 'Base should be 750');
    state = r1.state;

    const r2 = checkRebase(450, state, settings);
    assert(r2.rebased === true, 'Should rebase at 500');
    assert(r2.state.baseCapital === 500, 'Base should be 500');
    state = r2.state;

    const r3 = checkRebase(300, state, settings);
    assert(r3.rebased === false, 'Should not rebase past last milestone');
    assert(r3.state.baseCapital === 500, 'Base should stay 500');
  },
});

tests.push({
  name: 'Anti-bounce: milestone is not re-triggered after being adopted',
  fn: () => {
    const settings = makeRebase({ enabled: true, upwardEnabled: true, upwardMilestones: [1500, 2000] });
    let state = initRebaseState(1000);

    const r1 = checkRebase(1550, state, settings);
    assert(r1.rebased === true, 'Should rebase at 1500');
    assert(r1.state.baseCapital === 1500, 'Base should be 1500');
    state = r1.state;

    const r2 = checkRebase(1490, state, settings);
    assert(r2.rebased === false, 'Should NOT rebase when dropping back below 1500');
    assert(r2.state.baseCapital === 1500, 'Base should stay 1500');
    state = r2.state;

    const r3 = checkRebase(1502, state, settings);
    assert(r3.rebased === false, 'Should NOT rebase when touching 1500 again');
    assert(r3.state.baseCapital === 1500, 'Base should stay 1500');
    assert(r3.state.upwardIndex === 1, 'Upward index should still be 1');
    state = r3.state;

    const r4 = checkRebase(2050, state, settings);
    assert(r4.rebased === true, 'Should rebase at next milestone 2000');
    assert(r4.state.baseCapital === 2000, 'Base should be 2000');
  },
});

tests.push({
  name: 'Both directions can trigger in same check',
  fn: () => {
    const settings = makeRebase({
      enabled: true,
      upwardEnabled: true,
      downwardEnabled: true,
      upwardMilestones: [1500],
      downwardMilestones: [800],
    });
    let state = initRebaseState(1000);

    const r1 = checkRebase(1600, state, settings);
    assert(r1.rebased === true, 'Upward should trigger');
    assert(r1.state.baseCapital === 1500, 'Base should be 1500 (upward takes priority)');
    state = r1.state;

    const r2 = checkRebase(700, state, settings);
    assert(r2.rebased === true, 'Downward should trigger');
    assert(r2.state.baseCapital === 800, 'Base should be 800');
  },
});

tests.push({
  name: 'Unsorted milestones are handled correctly',
  fn: () => {
    const settings = makeRebase({
      enabled: true,
      upwardEnabled: true,
      upwardMilestones: [2500, 1500, 2000],
    });
    let state = initRebaseState(1000);

    const r1 = checkRebase(1550, state, settings);
    assert(r1.rebased === true, 'Should rebase at lowest milestone 1500');
    assert(r1.state.baseCapital === 1500, 'Base should be 1500');
    state = r1.state;

    const r2 = checkRebase(2050, state, settings);
    assert(r2.rebased === true, 'Should rebase at next milestone 2000');
    assert(r2.state.baseCapital === 2000, 'Base should be 2000');
    state = r2.state;

    const r3 = checkRebase(2550, state, settings);
    assert(r3.rebased === true, 'Should rebase at next milestone 2500');
    assert(r3.state.baseCapital === 2500, 'Base should be 2500');
  },
});

tests.push({
  name: 'Inactive rebase does not modify state',
  fn: () => {
    const settings = makeRebase({ enabled: false, upwardEnabled: true, upwardMilestones: [1500] });
    let state = initRebaseState(1000);
    const result = checkRebase(2000, state, settings);
    assert(result.rebased === false, 'Should not rebase when disabled');
    assert(result.state.baseCapital === 1000, 'Base should stay 1000');
    assert(result.state.upwardIndex === 0, 'Index should not advance');
  },
});

let passed = 0;
let failed = 0;
for (const test of tests) {
  try {
    test.fn();
    console.log(`  \u2713 ${test.name}`);
    passed++;
  } catch (e) {
    console.error(`  \u2717 ${test.name}`);
    console.error(`    ${(e as Error).message}`);
    failed++;
  }
}

console.log(`\n${passed}/${tests.length} rebase tests passed`);
if (failed > 0) process.exit(1);
