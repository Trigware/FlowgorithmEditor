import * as Utils from "./Utils.js";
import * as Flowgorithm from "./ProgramRepresentation.js";
import * as Parser from "./ProgramParser.js";
let prevMousePos = Utils.Vec2.Zero();
let planeCameraPos = Utils.Vec2.Zero();
let shapePlane = document.getElementById("ShapePlane");
let openFileInput = document.getElementById("OpenFileInput");
let openedProgram = new Flowgorithm.Program();
function OnStart() {
    prevMousePos = Utils.GetMousePos();
    openFileInput.addEventListener("change", OnFileSelected);
    OnDraw();
}
function OnDraw() {
    let mousePos = Utils.GetMousePos();
    let holdingMouse = Utils.IsMouseButtonHeld();
    let mouseDiff = mousePos.Minus(prevMousePos.x, prevMousePos.y);
    prevMousePos = mousePos.Copy();
    if (holdingMouse)
        MoveShapePlane(mouseDiff);
    requestAnimationFrame(OnDraw);
}
function MoveShapePlane(mouseDiff) {
    planeCameraPos = planeCameraPos.Plus(mouseDiff.x, mouseDiff.y);
    shapePlane.style.setProperty("--camera-x", `${planeCameraPos.x.toString()}px`);
    shapePlane.style.setProperty("--camera-y", `${planeCameraPos.y.toString()}px`);
}
function OnFileSelected() {
    if (openFileInput.files === null || openFileInput.files.length === 0)
        return;
    let selectedFile = openFileInput.files[0];
    selectedFile.text().then((fileContent) => {
        Parser.Setup(openedProgram, fileContent);
    });
}
OnStart();
