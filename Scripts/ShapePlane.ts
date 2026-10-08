import * as Utils from "./Utils.js"
import * as Flowgorithm from "./ProgramRepresentation.js"
import * as Parser from "./ProgramParser.js"
import * as Renderer from "./ScriptRenderer.js"

let prevMousePos: Utils.Vec2 = Utils.Vec2.Zero();
let planeCameraPos: Utils.Vec2 = Utils.Vec2.Zero();
let shapePlane: HTMLDivElement = document.getElementById("ShapePlane") as HTMLDivElement;
let openFileInput: HTMLInputElement = document.getElementById("OpenFileInput") as HTMLInputElement;
let openedProgram: Flowgorithm.Program = new Flowgorithm.Program();

function OnStart() {
    prevMousePos = Utils.GetMousePos();
    openFileInput.addEventListener("change", OnFileSelected);
    document.addEventListener("wheel", OnWheelScrolled);
    Renderer.RenderScript(openedProgram);
    OnDraw();
}

let previousTimeSinceStarted: number = 0;
let deltaTime: number = 0;
const shapeOffsetMultiplier: Utils.Vec2 = new Utils.Vec2(0.46, 0.075);

function OnDraw() {
    let currentTimeSinceStarted: number = Utils.GetTimeSinceStarted();
    let mousePos: Utils.Vec2 = Utils.GetMousePos();
    let holdingMouse: boolean = Utils.IsMouseButtonHeld();
    let mouseDiff: Utils.Vec2 = mousePos.Minus(prevMousePos.x, prevMousePos.y);
    deltaTime = currentTimeSinceStarted - previousTimeSinceStarted;

    prevMousePos = mousePos.Copy();
    if (holdingMouse) MoveShapePlane(mouseDiff);
    previousTimeSinceStarted = currentTimeSinceStarted;

    let zoomLevel: number = GetZoomLevel();
    let viewportSize: Utils.Vec2 = new Utils.Vec2(shapePlane.clientWidth, shapePlane.clientHeight); 
    let shapeOffset: Utils.Vec2 = viewportSize.Times(shapeOffsetMultiplier.x, shapeOffsetMultiplier.y).Divide(zoomLevel);
    Utils.SetProperty(shapePlane, "--offset-x", shapeOffset.x.toString() + "px");
    Utils.SetProperty(shapePlane, "--offset-y", shapeOffset.y.toString() + "px");
    requestAnimationFrame(OnDraw);
}

function MoveShapePlane(mouseDiff: Utils.Vec2) {
    let zoomLevel: number = GetZoomLevel();
    mouseDiff = mouseDiff.Divide(zoomLevel);
    planeCameraPos = planeCameraPos.Plus(mouseDiff.x, mouseDiff.y);
    shapePlane.style.setProperty("--camera-x", `${planeCameraPos.x.toString()}px`);
    shapePlane.style.setProperty("--camera-y", `${planeCameraPos.y.toString()}px`);
}

function OnFileSelected() {
    if (openFileInput.files === null || openFileInput.files.length === 0) return;
    let selectedFile: File = openFileInput.files[0];
    selectedFile.text().then((fileContent: string) => {
        Parser.Setup(openedProgram, fileContent);
        Renderer.RenderScript(openedProgram);
    });
}

const scrollingMultiplier: number = 3;
const maximumZoomLevel: number = 5;

function GetZoomLevel(): number { return Number(Utils.GetProperty(shapePlane, "--zoom-level")); }

function OnWheelScrolled(event: WheelEvent) {
    let scrollDirection: number = Math.sign(event.deltaY);
    let currentZoomLevel: number = GetZoomLevel();
    let usedScrollMultiplier: number = 1 + (scrollingMultiplier - 1) * deltaTime;
    
    if (scrollDirection === -1) currentZoomLevel *= usedScrollMultiplier;
    if (scrollDirection === +1) currentZoomLevel /= usedScrollMultiplier;

    let minimumZoomLevel: number = 1.0 / maximumZoomLevel;
    currentZoomLevel = Utils.Clamp(currentZoomLevel, minimumZoomLevel, maximumZoomLevel);
    shapePlane.style.setProperty("--zoom-level", currentZoomLevel.toString());
}

OnStart();