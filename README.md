# ShapeCode

<a href="https://trigware.github.io/FlowgorithmEditor/">
  <img src="Assets/ShapeCodeLogo.png" alt="ShapeCode logo">
</a>

[**ShapeCode**](https://trigware.github.io/FlowgorithmEditor/) is a browser-based flowchart editor and a modern alternative to [Flowgorithm](http://www.flowgorithm.org).
It's a learning tool designed to teach the basics of programming and algorithms. It improves on its predecessor with a focus on _user experience_, more dynamic camera controls, (planned) mobile support and
new concepts that weren't present in the original.

The project was made to extend my teacher's platform learning **FlowPortal**, a leetcode-like tool that supports Flowgorithm files as input.

[![](https://img.shields.io/badge/Development%20Status-Ongoing-orange.svg)]()
[![Licence: MIT](https://img.shields.io/badge/License-MIT-red.svg)](https://opensource.org/license/mit)

## Features

Here are some features that are already implemented on the latest version:
- Loading programs exported from classic Flowgorithm
- Camera panning and zooming
- Virtual Window system for editing shapes
- Rendering and selection of these shapes:
  - **IO**: Input, Output
  - **Variables**: Declare, Assign
  - **Control Flow**: If, Call, Function
  - **Loops**: For, While, Do While
  - **Annotation**: Comment, Breakpoint

## Running locally
**ShapeCode** is made only with HTML, CSS and TypeScript and it doesn't use any libraries. Since this repository already provides transpiled JavaScript (because the project is currently hosted with Github Pages)
you can immediatly run it in localhost without needing TypeScript.

### Instructions
1. Get into a directory in what you want to open the project in
2. ``git clone https://github.com/Trigware/FlowgorithmEditor.git`` (or download it here)
3. ``cd FlowgorithmEditor``
4. ``python -m http.server 8000`` (or use VSCode LiveServer extension / equivalent)

## Roadmap

### Editor Phase
- Shape drag and drop
- Edit dialogs for all shapes
- Undo/Redo, Copy/Paste, shape deletion
- Program export (to ShapeCode format or backwards-compatible Flowgorithm format)
- Interconnectivity with **FlowPortal**

### Interpreter Phase
- Execute the code inside of C#
- Expression parser, AST and evaluator
- Symbol table and intelisence
- Console (input and output handling)

### Extension Phase
- Addition of new shapes (break, continue, return, foreach)
- Addition of new data types (enums, multidimensional arrays and maps)
- Algorithm and data structure visualization
- Intelisence (symbol auto-complete)

## License

ShapeCode is distributed under the MIT License.
See [LICENSE](LICENSE) for details.
