export function RenderScript(currentProgram) {
    for (let i = 0; i < currentProgram.subNodes.length; i++) {
        if (i > 0)
            break;
        let currentFunction = currentProgram.subNodes[i];
        RenderFunction(currentFunction);
    }
}
function RenderFunction(currentFunction) {
    console.log(currentFunction.name);
}
