<p align="center">
  <h1 align="center">
    Circomkit
  </h1>
  <p align="center">An opinionated Circom circuit development & testing environment.</p>
</p>

<p align="center">
    <a href="https://opensource.org/licenses/MIT" target="_blank">
        <img src="https://img.shields.io/badge/license-MIT-yellow.svg">
    </a>
    <a href="./.github/workflows/styling.yml" target="_blank">
        <img alt="Style Workflow" src="https://github.com/erhant/circomkit/actions/workflows/styling.yml/badge.svg?branch=main">
    </a>
    <a href="https://mochajs.org/" target="_blank">
        <img alt="Test Suite: Mocha" src="https://img.shields.io/badge/tester-mocha-8D6748?logo=Mocha">
    </a>
    <a href="https://eslint.org/" target="_blank">
        <img alt="Linter: ESLint" src="https://img.shields.io/badge/linter-eslint-8080f2?logo=eslint">
    </a>
    <a href="https://prettier.io/" target="_blank">
        <img alt="Formatter: Prettier" src="https://img.shields.io/badge/formatter-prettier-f8bc45?logo=prettier">
    </a>
</p>

## Usage

Clone the repository or create a new one with this as the template! You need [Circom](https://docs.circom.io/getting-started/installation/) to compile circuits. Other than that, just `yarn` or `npm install` to get started. It will also install [Circomlib](https://github.com/iden3/circomlib/tree/master/circuits) which has many utility circuits.

The repository follows an _opinionated file structure_ shown below, abstracting away the pathing and orientation behind the scenes. Shell scripts handle most of the work, and they are exposed through a CLI.

Write your circuits under the `circuits` folder; the circuit code itself should be templates only. The main component itself is created automatically via a [script](./utils/instantiate.ts) which uses a simple EJS [template](./circuits/ejs/template.circom) to create the main component. The target circuits are defined under the [circuit configs](./circuit.config.ts) file, such as:

```js
// circuit name is the key
multiplier_3: {
  // template to instantiate the main component
  template: 'Multiplier',
  // file to include for the template
  file: 'multiplier',
  // array of public inputs
  publicInputs: [],
  // template parameters, order is important
  templateParams: [3],
}
```

Use the [CLI](./scripts/cli.sh), or its wrapper scripts in [package.json](./package.json) to do stuff with your circuits.

```bash
# Compile the circuit
yarn compile circuit-name [-d directory-name (default: main)]

# Phase-2 Circuit-specific setup
yarn ptau circuit-name -p phase1-ptau-path [-n num-contribs (default: 1)]

# Shorthand for `compile` and then `ptau`
yarn keygen circuit-name -p phase1-ptau-path [-n num-contribs (default: 1)]

# Generate a proof for a JSON input
yarn prove circuit-name -i input-name

# Verify a proof for some JSON input
yarn verify circuit-name -i input-name

# Clean circuit artifacts
yarn clean circuit-name

# Run the test for a circuit
yarn test circuit-name

# Run all tests
yarn test:all
```

There are some environment variables that the CLI can make use of, they are written under [.cli.env](./.cli.env) file.

### Examples

We have several example circuits to help guide you:

- **Multiplier**: A circuit to prove that you know the factors of a number.
- **Floating Point Addition**: A circuit to compute the sum of two floating-point numbers, adapted from [Berkeley ZKP MOOC 2023 - Lab 1](https://github.com/rdi-berkeley/zkp-mooc-lab).
- **Fibonacci**: A circuit to compute Fibonacci numbers.
- **Sudoku**: A circuit to prove that you know the solution to a Sudoku puzzle.

## Testing

To run tests do the following:

```bash
# test all circuits
yarn test:all
# test a specific circuit
yarn test "circuit name"
```

You can test both witness calculations and proof generation & verification. We describe both in their respective sections, going over an example of "Multiplication" circuit.

### Witness Calculation

Witness calculation tests check whether your circuit computes the correct result based on your inputs, and makes sure that assertions are correct. We provide very useful utility functions to help write these tests.

To run a circuit, you need to create a `main` component in Circom, where your main template is assigned to this component. You could do this manually, but in Circomkit we prefer to do this programmatically, using the `instantiate` function. Let us go over an example test for the multiplication circuit.

```ts
import {instantiate} from '../utils/instantiate';
import {createWasmTester} from '../utils/wasmTester';

describe('multiplier', () => {
  const N = 3;
  let circuit: Awaited<ReturnType<typeof createWasmTester>>;

  before(async () => {
    const circuitName = 'multiplier_' + N;
    // (1) creates the main component at ./circuits/test/<circuitName>.circom
    instantiate(circuitName, 'test', {
      file: 'multiplier', // our file is at ./circuits/multiplier.circom
      template: 'Multiplier', // our file has the template "Template"
      publicInputs: [], // list of public signal input names
      templateParams: [N], // list of template parameters in order
    });

    // (2) reads the main component at ./circuits/test/<circuitName>.circom
    circuit = await createWasmTester(circuitName, 'test');

    // (3) optionally checks if the constraint count meets your expectations
    await circuit.printConstraintCount(N - 1);
  });

  it('should compute correctly', async () => {
    // N random numbers
    const input = {
      in: Array<number>(N)
        .fill(0)
        .map(() => Math.floor(Math.random() * 100 * N)),
    };

    // make sure the output is correct
    await circuit.expectCorrectAssert(input, {
      out: input.in.reduce((prev, acc) => acc * prev),
    });
  });
});
```

Before tests begin, we must create a circuit tester object, which is what happens in the `before` hook.

1. A `main` component is created with the given configuration.
2. A circuit tester is created from that main component.
3. Constraint count is checked (optional).

With the circuit object, we can do the following:

- `circuit.expectCorrectAssert(input, output)` to test whether we get the expected output for some given input.
- `circuit.expectCorrectAssert(input)` to test whether the circuit assertions pass for some given input
- `circuit.expectFailedAssert(input)` to test whether the circuit assertions pass for some given input

#### Multiple templates

You will often have multiple templates in your circuit code, and you might want to test them in the same test file of your main circuit too. Well, you can!

```ts
describe('multiplier utilities', () => {
  describe('multiplication gate', () => {
    let circuit: Awaited<ReturnType<typeof createWasmTester>>;

    before(async () => {
      const circuitName = 'mulgate';
      // we can provide sub-folders as the target, such as test/multiplier in this case!
      instantiate(circuitName, 'test/multiplier', {
        file: 'multiplier',
        template: 'MultiplicationGate',
        publicInputs: [],
        templateParams: [],
      });
      circuit = await createWasmTester(circuitName, 'test/multiplier');
    });

    it('should pass for in range', async () => {
      await circuit.expectCorrectAssert(
        {
          in: [7, 5],
        },
        {out: 7 * 5}
      );
    });
  });
});
```

### Proof Verification

If you have created the prover key, verification key & the circuit WASM file, you can also test proving & verification keys.

```ts
describe('multiplier (proofs)', () => {
  const N = 3;

  let fullProof: FullProof;
  let circuit: ProofTester;
  before(async () => {
    const circuitName = 'multiplier_' + N;
    circuit = new ProofTester(circuitName);
    fullProof = await circuit.prove({
      in: Array<number>(N)
        .fill(0)
        .map(() => Math.floor(Math.random() * 100 * N)),
    });
  });

  it('should verify', async () => {
    await circuit.expectVerificationPass(fullProof.proof, fullProof.publicSignals);
  });

  it('should NOT verify a wrong multiplication', async () => {
    // just give a prime number as the public signal, assuming none of the inputs are 1
    await circuit.expectVerificationFail(fullProof.proof, ['13']);
  });
});
```

Notice the two utility functions provided here:

- `circuit.expectVerificationPass(proof, publicSignals)` makes sure that the given proof is **accepted** by the verifier for the given public signals.
- `circuit.expectVerificationFail(proof, publicSignals)` makes sure that the given proof is **rejected** by the verifier for the given public signals.

## File Structure

The underlying file structure is explained below.

```sh
circomkit
├── circuit.config.cjs # configs for circuit main components
├── .cli.env # environment variables for cli
├── circuits # where you write templates
│   ├── main # auto-generated main components
│   │   │── sudoku_9x9.circom # e.g. a 9x9 sudoku board
│   │   └── ...
│   │── sudoku.circom # a generic sudoku template
│   └── ...
├── inputs # where you write JSON inputs per circuit
│   ├── sudoku_9x9 # each main template has its own folder
│   │   ├── example-input.json # e.g. a solution & its puzzle
│   │   └── ...
│   └── ...
├── ptau # universal phase-1 setups
│   ├── powersOfTau28_hez_final_12.ptau
│   └── ...
└── build # build artifacts, these are .gitignore'd
    │── sudoku_9x9 # each main template has its own folder
    │   │── sudoku_9x9_js # artifacts of compilation
    │   │   │── generate_witness.js
    │   │   │── witness_calculator.js
    │   │   └── sudoku_9x9.wasm
    │   │── example-input # artifacts of witness & proof generation
    │   │   │── proof.json # proof object
    │   │   │── public.json # public signals
    │   │   └── witness.wtns
    │   │── ... # folders for other inputs
    │   │── sudoku_9x9.r1cs
    │   │── sudoku_9x9.sym
    │   │── prover_key.zkey
    │   └── verification_key.json
    └── ...
```
