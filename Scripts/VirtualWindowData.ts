import { ShapeType } from "./ShapeRenderer.js";
import * as Utils from "./Utils.js"

class EditDialog {
    public constructor(shapeType: ShapeType = ShapeType.Unknown) {
        if (shapeType === ShapeType.Unknown) return;
    }
}

let windowsRoot: EditDialog[] = [];

export function LoadEditDialogData(fileContents: string) {
    console.log(fileContents);
}