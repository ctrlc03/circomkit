## Calculates the witness for the given circuit and input
witness() {
  echo -e "\n${CIRCOMKIT_COLOR_TITLE}=== Computing witness ===${CIRCOMKIT_COLOR_RESET}"
  local CIRCUIT=$1
  local INPUT=$2
  local JS_DIR=./build/$CIRCUIT/${CIRCUIT}_js   # JS files for the circuit
  local OUTPUT_DIR=./build/$CIRCUIT/$INPUT      # directory for proof & public signals
  local INPUT_DIR=./inputs/$CIRCUIT             # directory for inputs
  local WITNESS=$OUTPUT_DIR/witness.wtns        # witness output

  mkdir -p $OUTPUT_DIR
 
  node $JS_DIR/generate_witness.js \
    $JS_DIR/$CIRCUIT.wasm \
    $INPUT_DIR/$INPUT.json \
    $WITNESS

  echo -e "${CIRCOMKIT_COLOR_LOG}Generated\n\tWitness: $WITNESS${CIRCOMKIT_COLOR_RESET}"
}
