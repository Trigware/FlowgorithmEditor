import * as Flowgorithm from "./ProgramRepresentation.js"

export function RenderScript(currentProgram: Flowgorithm.Program) {
    for (let i = 0; i < currentProgram.subNodes.length; i++) {
        if (i > 0) break;
        let currentFunction: Flowgorithm.FunctionSignature = currentProgram.subNodes[i] as Flowgorithm.FunctionSignature;
        RenderFunction(currentFunction);
    }
}

function RenderFunction(currentFunction: Flowgorithm.FunctionSignature) {
    console.log(currentFunction.name);
}