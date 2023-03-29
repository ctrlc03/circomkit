import {WitnessType, CircuitSignals} from './circuit';

/**
 * Custom types added with respect to `circomlibjs.wasm`. Not all functions exist here, some are omitted.
 * @see https://github.com/iden3/circom_tester/blob/main/wasm/tester.js
 */
export type WasmTester = {
  /**
   * Assert that constraints are valid.
   * @param witness witness
   */
  checkConstraints: (witness: WitnessType) => Promise<void>;

  /**
   * Cleanup directory, should probably be called upon test completion
   * @deprecated this is buggy right now
   */
  release(): Promise<void>;

  /**
   * Assert the output of a given witness.
   * @param actualOut expected output signals
   * @param expectedOut computed output signals
   */
  assertOut: (actualOut: CircuitSignals, expectedOut: CircuitSignals) => Promise<void>;

  /**
   * Compute witness given the input signals.
   * @param input all signals, private and public.
   * @param sanityCheck ?
   */
  calculateWitness: (input: CircuitSignals, sanityCheck: boolean) => Promise<WitnessType>;

  /**
   * Loads the list of R1CS constraints to `this.constraints`
   */
  loadConstraints(): Promise<void>;

  /**
   * List of constraints, must call `loadConstraints` before
   * accessing this key
   */
  constraints: any[] | undefined;

  /**
   * Loads the symbols in a dictionary at `this.symbols`
   * Symbols are stored under the .sym file
   * Each line has 4 comma-separated values:
   * 0: label index
   * 1: variable index
   * 2: component index
   */
  loadSymbols(): Promise<void>;

  /**
   * A dictionary of symbols
   */
  symbols: object;

  /**
   * @deprecated this is buggy right now
   * @param witness witness
   */
  getDecoratedOutput(witness: WitnessType): Promise<string>;
};
