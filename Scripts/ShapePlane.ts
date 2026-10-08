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
const shapeOffsetMultiplier: Utils.Vec2 = new Utils.Vec2(0.5, 0.075);

function OnDraw() {
    let currentTimeSinceStarted: number = Utils.GetTimeSinceStarted();
    let mousePos: Utils.Vec2 = Utils.GetMousePos();
    let holdingMouse: boolean = Utils.IsMouseButtonHeld();
    let mouseDiff: Utils.Vec2 = mousePos.Minus(prevMousePos.x, prevMousePos.y);
    deltaTime = currentTimeSinceStarted - previousTimeSinceStarted;

    prevMousePos = mousePos.Copy();
    if (holdingMouse) MoveShapePlane(mouseDiff);
    previousTimeSinceStarted = currentTimeSinceStarted;

    UpdateShapeOffset();
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
        Renderer.RenderScript(openedProgram);
    });
}

const scrollingMultiplier: number = 3.5;
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

function UpdateShapeOffset() {
    let viewportSize: Utils.Vec2 = new Utils.Vec2(shapePlane.clientWidth, shapePlane.clientHeight);

    for (let i: number = 0; i < shapePlane.children.length; i++) {
        let currentShape: HTMLDivElement = shapePlane.children[i] as HTMLDivElement;
        let shapeWidth: number = currentShape.clientWidth;
        let shapeOffset: Utils.Vec2 = viewportSize.Times(shapeOffsetMultiplier.x, shapeOffsetMultiplier.y)
            .Minus(shapeWidth / 2, currentShape.clientHeight / 2);
        
        Utils.SetProperty(currentShape, "--offset-x", shapeOffset.x.toString() + "px");
        Utils.SetProperty(currentShape, "--offset-y", shapeOffset.y.toString() + "px");
        let defaultWidth: number = Utils.GetNumericPixels(Utils.GetProperty(currentShape, "--default-width"));
        let widthSizeIncrease: number = shapeWidth / defaultWidth;
        Utils.SetProperty(currentShape, "--width-size-increase", widthSizeIncrease.toString());
    }
}

OnStart();