import * as Utils from "./Utils.js"
import * as Flowgorithm from "./ProgramRepresentation.js"
import * as Parser from "./ProgramParser.js"

let prevMousePos: Utils.Vec2 = Utils.Vec2.Zero();
let planeCameraPos: Utils.Vec2 = Utils.Vec2.Zero();
let shapePlane: HTMLDivElement = document.getElementById("ShapePlane") as HTMLDivElement;
let openFileInput: HTMLInputElement = document.getElementById("OpenFileInput") as HTMLInputElement;
let openedProgram: Flowgorithm.Program = new Flowgorithm.Program();

function OnStart() {
    prevMousePos = Utils.GetMousePos();
    openFileInput.addEventListener("change", OnFileSelected);
    OnDraw();
}

function OnDraw() {
    let mousePos: Utils.Vec2 = Utils.GetMousePos();
    let holdingMouse: boolean = Utils.IsMouseButtonHeld();
    let mouseDiff: Utils.Vec2 = mousePos.Minus(prevMousePos.x, prevMousePos.y);
    prevMousePos = mousePos.Copy();
    if (holdingMouse) MoveShapePlane(mouseDiff);
    requestAnimationFrame(OnDraw);
}

function MoveShapePlane(mouseDiff: Utils.Vec2) {
    planeCameraPos = planeCameraPos.Plus(mouseDiff.x, mouseDiff.y);
    shapePlane.style.setProperty("--camera-x", `${planeCameraPos.x.toString()}px`);
    shapePlane.style.setProperty("--camera-y", `${planeCameraPos.y.toString()}px`);
}

function OnFileSelected() {
    if (openFileInput.files === null || openFileInput.files.length === 0) return;
    let selectedFile: File = openFileInput.files[0];
    selectedFile.text().then((fileContent: string) => {
        Parser.Setup(openedProgram, fileContent);
    });
}

OnStart();