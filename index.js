let gl, stone, grass;
let env = [];
let loadedStone = false;
let loadedGrass = false;
let loadedEnv = 0;

function main() {
    // Retrieve <canvas> element
    const canvas = document.getElementById('webgl');
    // Get the rendering context for WebGL
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
    // Initialize shaders
    program = initShaders(gl, "vshader", "fshader");
    gl.useProgram(program);
    // Set up the viewport
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    // Load images
    stone = new Image();
    stone.crossOrigin = "";
    stone.src = "http://web.cs.wpi.edu/~jmcuneo/stones.bmp";
    stone.onload = function() {
        loadedStone = true;
    };
    grass = new Image();
    grass.crossOrigin = "";
    grass.src = "http://web.cs.wpi.edu/~jmcuneo/grass.bmp";
    grass.onload = function() {
        loadedGrass = true;
    };
    const links = ["http://web.cs.wpi.edu/~jmcuneo/env_map_sides/nvnegx.bmp", "http://web.cs.wpi.edu/~jmcuneo/env_map_sides/nvnegy.bmp",
        "http://web.cs.wpi.edu/~jmcuneo/env_map_sides/nvnegz.bmp", "http://web.cs.wpi.edu/~jmcuneo/env_map_sides/nvposx.bmp",
        "http://web.cs.wpi.edu/~jmcuneo/env_map_sides/nvposy.bmp", "http://web.cs.wpi.edu/~jmcuneo/env_map_sides/nvposz.bmp"];
    for (let i = 0; i < links.length; i++) {
        let newEnv = new Image();
        newEnv.crossOrigin = "";
        newEnv.src = links[i];
        newEnv.onload = function() {
            loadedEnv++;
            console.log(loadedEnv);
        };
        env[i] = newEnv;
    }

    preRender();
}

const SUB_DIVISIONS = 4;

// Colors
const white = vec4(1.0, 1.0, 1.0, 1.0);
const black = vec4(0.0, 0.0, 0.0, 1.0);
const red = vec4(1.0, 0.0, 0.0, 1.0);
const blue = vec4(0.0, 0.0, 1.0, 1.0);
const green = vec4(0.0, 1.0, 0.0, 1.0);
const babyBlue = vec4(0.25, 1.0, 0.75, 1.0);
const fuscia = vec4(1.0, 0.0, 1.0, 1.0);
const yellow = vec4(1.0, 1.0, 0.3, 1.0);
const gray = vec4(0.6, 0.6, 0.6, 1.0);

// Light and material values
const lightPosition = vec4(7.0, -2.0, 30.0, 0.0);
const lightAmbient = vec4(0.3, 0.3, 0.3, 1.0);
const lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
const lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);
const materialShininess = 20.0;

// Unit sphere
const va = vec4(0.0, 0.0, -1.0, 1.0);
const vb = vec4(0.0, 0.942809, 0.333333, 1.0);
const vc = vec4(-0.816497, -0.471405, 0.333333, 1.0);
const vd = vec4(0.816497, -0.471405, 0.333333, 1.0);

// Returns a list of points of a sphere
function sphere() {
    let points = [];
    // Sub-divide triangles
    points = points.concat(divideTriangle(va, vb, vc, SUB_DIVISIONS));
    points = points.concat(divideTriangle(vd, vc, vb, SUB_DIVISIONS));
    points = points.concat(divideTriangle(va, vd, vb, SUB_DIVISIONS));
    points = points.concat(divideTriangle(va, vc, vd, SUB_DIVISIONS));
    return points;
}

// Divides the triangle into sub-triangles
function divideTriangle(a, b, c, count) {
    // If over the sub-division count, keep dividing
    if (count > 0) {
        // Mix the vertexes
        let ab = mix(a, b, 0.5);
        let ac = mix(a, c, 0.5);
        let bc = mix(b, c, 0.5);

        // Normalize the new vertexes
        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);

        // Recurse
        let points = [];
        points = points.concat(divideTriangle(a, ab, ac, count - 1));
        points = points.concat(divideTriangle(ab, b, bc, count - 1));
        points = points.concat(divideTriangle(bc, c, ac, count - 1));
        points = points.concat(divideTriangle(ab, bc, ac, count - 1));
        return points;
    } else {
        // Return the points of a singular triangle
        return [a, c, b];
    }
}

// Returns a list of points of a cube
function cube() {
    let verts = [];
    verts = verts.concat(quad( 1, 0, 3, 2 ));
    verts = verts.concat(quad( 2, 3, 7, 6 ));
    verts = verts.concat(quad( 3, 0, 4, 7 ));
    verts = verts.concat(quad( 6, 5, 1, 2 ));
    verts = verts.concat(quad( 4, 5, 6, 7 ));
    verts = verts.concat(quad( 5, 4, 0, 1 ));
    return verts;
}

// Gets the corresponding vertexes for the cube (removes repeats)
function quad(a, b, c, d) {
    let verts = [];
    const vertices = [
        vec4(-0.75, -0.75, 0.75, 0.75),
        vec4(-0.75, 0.75, 0.75, 0.75),
        vec4(0.75, 0.75, 0.75, 0.75),
        vec4(0.75, -0.75, 0.75, 0.75),
        vec4(-0.75, -0.75, -0.75, 0.75),
        vec4(-0.75, 0.75, -0.75, 0.75),
        vec4(0.75, 0.75, -0.75, 0.75),
        vec4(0.75, -0.75, -0.75, 0.75)
    ];
    const indices = [a, b, c, a, c, d];
    for (let i = 0; i < indices.length; i++) {
        verts.push(vertices[indices[i]]);
    }
    return verts;
}

let modelMatrix;
let coneAngle = 0.99;
const ANGLE_DELTA = 0.001;
// Runs all the graphics code that only needs to be ran once
function preRender() {
    // Set the point size
    const vPointSize = gl.getUniformLocation(program, "vPointSize");
    gl.uniform1f(vPointSize, 10.0);

    // Color
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

    // Get model matrix
    modelMatrix = gl.getUniformLocation(program, "modelMatrix");

    // Set cone angle
    gl.uniform1f(gl.getUniformLocation(program, "coneAngle"), coneAngle);

    // Set smooth shading
    gl.uniform1i(gl.getUniformLocation(program, "isFlat"), 0);

    render();
}

// Camera values
let fov = 45;
let eyeX = 18.0;
let eyeY = 1.0;
let eyeZ = 18.0;
let eye = vec3(eyeX, eyeY, eyeZ);
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

let stack = [];
let camMatrix;
// Angles of axes
let angles = [
    [0.0],
    [0.0, 0.0],
    [0.0, 0.0, 0.0, 0.0]
];
let ROTATE_SPEED = [0.25, 0.5, 1.0];
function render() {
    // Clear the buffer bits
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Points for spheres and cubes
    const sphere1 = sphere();
    const cube1 = cube();
    const line1 = [vec4(-4.0, -3.0, 0.0, 1.0),
        vec4(-4.0, -1.5, 0.0, 1.0),
        vec4(0.0, -1.5, 0.0, 1.0),
        vec4(0.0, 0.0, 0.0, 1.0),
        vec4(0.0, -1.5, 0.0, 1.0),
        vec4(4.0, -1.5, 0.0, 1.0),
        vec4(4.0, -3.0, 0.0, 1.0)];
    const line2 = [vec4(-2.0, -3.0, 0.0, 1.0),
        vec4(-2.0, -1.5, 0.0, 1.0),
        vec4(0.0, -1.5, 0.0, 1.0),
        vec4(0.0, 0.0, 0.0, 1.0),
        vec4(0.0, -1.5, 0.0, 1.0),
        vec4(2.0, -1.5, 0.0, 1.0),
        vec4(2.0, -3.0, 0.0, 1.0)];

    // Set-up perspective view
    const pers = perspective(fov, 1, 0.1, 10000);
    const projMatrix = gl.getUniformLocation(program, 'projMatrix');
    gl.uniformMatrix4fv(projMatrix, false, flatten(pers));

    // Set camera view
    eye = vec3(eyeX, eyeY, eyeZ);
    camMatrix = lookAt(eye, at, up);
    gl.uniformMatrix4fv(modelMatrix, false, flatten(camMatrix));

    // Background planes
    drawOther(getPlane(0), gray, false, "grass");
    drawOther(getPlane(1), blue, false, "stone");
    drawOther(getPlane(2), blue, false, "stone");

    // 0, 0
    stack.push(camMatrix);
        camMatrix = mult(translate(0.0, 3.0, 0.0), mult(camMatrix, rotateY(angles[0][0])));
        gl.uniformMatrix4fv(modelMatrix, false, flatten(camMatrix));
        draw(cube1, white);
        camMatrix = mult(camMatrix, rotateY(-2.0 * angles[0][0]));
        gl.uniformMatrix4fv(modelMatrix, false, flatten(camMatrix));
        drawOther(line1, black, true);

        // 1, 0
        stack.push(camMatrix);
            camMatrix = mult(mult(camMatrix, translate(-4.0, -3.0, 0.0)), rotateY(angles[0][0] + angles[1][0]));
            gl.uniformMatrix4fv(modelMatrix, false, flatten(camMatrix));
            draw(sphere1, blue);
            camMatrix = mult(camMatrix, rotateY(-2.0 * angles[1][0]));
            gl.uniformMatrix4fv(modelMatrix, false, flatten(camMatrix));
            drawOther(line2, black, true);

            // 2, 0
            stack.push(camMatrix);
                camMatrix = mult(mult(camMatrix, translate(-2.0, -3.0, 0.0)), rotateY(angles[1][0] + angles[2][0]));
                gl.uniformMatrix4fv(modelMatrix, false, flatten(camMatrix));
                draw(cube1, green);
            camMatrix = stack.pop();

            // 2, 1
            stack.push(camMatrix);
                camMatrix = mult(mult(camMatrix, translate(2.0, -3.0, 0.0)), rotateY(angles[1][0] + angles[2][1]));
                gl.uniformMatrix4fv(modelMatrix, false, flatten(camMatrix));
                draw(sphere1, red);
            camMatrix = stack.pop();
        camMatrix = stack.pop();

        // 1, 1
        stack.push(camMatrix);
            camMatrix = mult(mult(camMatrix, translate(4.0, -3.0, 0.0)), rotateY(angles[0][0] + angles[1][1]));
            gl.uniformMatrix4fv(modelMatrix, false, flatten(camMatrix));
            draw(cube1, fuscia);
            camMatrix = mult(camMatrix, rotateY(-2.0 * angles[1][1]));
            gl.uniformMatrix4fv(modelMatrix, false, flatten(camMatrix));
            drawOther(line2, black, true);

            // 2, 2
            stack.push(camMatrix);
                camMatrix = mult(mult(camMatrix, translate(-2.0, -3.0, 0.0)), rotateY(angles[1][1] + angles[2][2]));
                gl.uniformMatrix4fv(modelMatrix, false, flatten(camMatrix));
                draw(sphere1, babyBlue);
            camMatrix = stack.pop();

            // 2, 3
            stack.push(camMatrix);
                camMatrix = mult(mult(camMatrix, translate(2.0, -3.0, 0.0)), rotateY(angles[1][1] + angles[2][3]));
                gl.uniformMatrix4fv(modelMatrix, false, flatten(camMatrix));
                draw(cube1, yellow);
            camMatrix = stack.pop();
        camMatrix = stack.pop();
    camMatrix = stack.pop();

    // Update angles
    for (let i = 0; i < angles.length; i++) {
        let angleI = angles[i];
        for (let j = 0; j < angleI.length; j++) {
            angleI[j] += ROTATE_SPEED[i];
        }
    }

    requestAnimationFrame(render);
}

// Shadow matrix
const m = mat4();
m[3][3] = 0;
m[3][2] = -1 / lightPosition[2];

// Draws the shape along with its color
function draw(points, color) {
    // Gets the normals for the vertexes
    let vNormals = [];
    for (let i = 0; i < points.length; i++) {
        const point = points[i];
        vNormals.push(point[0], point[1], point[2], 0.0);
    }

    // Gets the surface normals and centers
    let fNormals = [];
    let centerPoints = [];
    for (let i = 0; i < points.length; i += 3) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2];
        const norm = calcNorm(p2, p1, p3);
        const center = getCenter(p1, p2, p3);
        for (let j = 0; j < 3; j++) {
            fNormals.push(norm[0], norm[1], norm[2], 0.0);
            centerPoints.push(center);
        }
    }

    // Flatten the shapes' points
    const flattenPoints = flatten(points);

    // Create the buffer for the vertexes
    const vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flattenPoints, gl.STATIC_DRAW);

    // Set up the memory for the vertexes
    const vPosition = gl.getAttribLocation(program, "vPosition");
    gl.enableVertexAttribArray(vPosition);
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);

    // Create the buffer for the vertexes (for flat shading)
    const fBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, fBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(centerPoints), gl.STATIC_DRAW);

    // Set up the memory for the vertexes (for flat shading)
    const fPosition = gl.getAttribLocation(program, "fPosition");
    gl.enableVertexAttribArray(fPosition);
    gl.vertexAttribPointer(fPosition, 4, gl.FLOAT, false, 0, 0);

    // Create the buffer for the normals
    const nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vNormals), gl.STATIC_DRAW);

    // Set up the memory for the vertex normals
    const vNormal = gl.getAttribLocation( program, "vNormal");
    gl.enableVertexAttribArray(vNormal);
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);

    // Create the buffer for the face normals
    const fnBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, fnBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(fNormals), gl.STATIC_DRAW);

    // Set up the memory for the normals
    const fNormal = gl.getAttribLocation( program, "fNormal");
    gl.enableVertexAttribArray(fNormal);
    gl.vertexAttribPointer(fNormal, 4, gl.FLOAT, false, 0, 0);

    // Color of the material
    const matColor = vec4(color[0], color[1], color[2], 1.0);
    const diffuseProduct = mult(lightDiffuse, matColor);
    const ambientProduct = mult(lightAmbient, matColor);

    // Sets the uniform values with the colors
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
    const specularProduct = mult(lightSpecular, white);
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
    gl.uniform1i(gl.getUniformLocation(program, "isTexture"), 0);
    gl.uniform1i(gl.getUniformLocation(program, "isReflection"), isReflection);
    gl.uniform1i(gl.getUniformLocation(program, "isRefraction"), isRefraction);

    // Check if the textures have loaded
    if (isReflection === 1 || isRefraction) {
        if (loadedEnv !== 6) {
            configureCubeMap();
        } else {
            configureCubeMapImage();
        }
    }

    // Draw triangles
    gl.drawArrays(gl.TRIANGLES, 0, flattenPoints.length);

    // Shadows
    if (isShadows) {
        stack.push(camMatrix);
            // const shadow = mult(translate(lightPosition[0], lightPosition[1], lightPosition[2]), mult(m, translate(-lightPosition[0], -lightPosition[1], -lightPosition[2])));
            const shadow1 = translate(-lightPosition[0], -lightPosition[1], -lightPosition[2]);
            const shadow2 = mult(m, shadow1);
            const shadow3 = mult(shadow2, translate(lightPosition[0] - 1, lightPosition[1] + 1, lightPosition[2] - 1));
            camMatrix = mult(shadow3, camMatrix);
            gl.uniformMatrix4fv(modelMatrix, false, flatten(camMatrix));
            gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(black));
            gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(black));
            gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(mult(lightSpecular, black)));
            gl.drawArrays(gl.TRIANGLES, 0, flattenPoints.length);
        camMatrix = stack.pop();
    }
}

// Draws points or background elements
function drawOther(points, color, isLine, type="none") {
    const fPoints = flatten(points);

    // Create the buffer for the vertexes
    const vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, fPoints, gl.STATIC_DRAW);

    // Set up the memory for the vertexes
    const vPosition = gl.getAttribLocation(program, "vPosition");
    gl.enableVertexAttribArray(vPosition);
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);

    // Color of the material
    const matColor = color;
    const diffuseProduct = black;
    const ambientProduct = matColor;

    // Sets the uniform values with the colors
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
    const specularProduct = mult(lightSpecular, black);
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
    gl.uniform1i(gl.getUniformLocation(program, "isReflection"), 0);
    gl.uniform1i(gl.getUniformLocation(program, "isRefraction"), 0);
    if (isLine) { // Lines don't get textured
        gl.uniform1i(gl.getUniformLocation(program, "isTexture"), 0);
    } else {
        gl.uniform1i(gl.getUniformLocation(program, "isTexture"), isTextured);

        // Set texture mapping
        const minT = 0.0;
        const maxT = 5.0;
        const texCoord = [
            vec2(minT, minT),
            vec2(minT, maxT),
            vec2(maxT, maxT),
            vec2(maxT, minT)
        ];
        let texCoordsArray; // Grass and stone have slightly different texture mapping
        if (type === "stone") {
            texCoordsArray = [texCoord[1], texCoord[2], texCoord[3], texCoord[1], texCoord[3], texCoord[0]];
            if (!loadedStone) { // Load default texture until image is loaded
                configure2DMap();
            } else {
                configure2DMapImage(stone);
            }
        } else {
            texCoordsArray = [texCoord[1], texCoord[3], texCoord[0], texCoord[1], texCoord[2], texCoord[3]];
            if (!loadedGrass) { // Load default texture until image is loaded
                configure2DMap();
            } else {
                configure2DMapImage(grass);
            }
        }

        // Texture buffer
        const tBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer );
        gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );

        const tPosition = gl.getAttribLocation(program, "vTexCoord");
        gl.vertexAttribPointer(tPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(tPosition);
    }

    // Draw lines or triangles
    if (isLine) {
        gl.drawArrays(gl.LINE_STRIP, 0, fPoints.length);
    } else {
        gl.drawArrays(gl.TRIANGLES, 0, fPoints.length);
    }
}

// Calculates the normal of the triangle using the Newell method
function calcNorm(p1, p2, p3) {
    // Calculates the two vectors from the points
    const u = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]]; //p2 - p1
    const v = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]]; // p3 - p1
    // Newell method
    let n = vec4(u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0], 1.0);
    return vec4(-n[0], -n[1], -n[2], 1.0);
}

// Gets the center of a triangle
function getCenter(p1, p2, p3) {
    return vec4((p1[0] + p2[0] + p3[0]) / 3.0, (p1[1] + p2[1] + p3[1]) / 3.0, (p1[2] + p2[2] + p3[2]) / 3.0, 1.0);
}

// Gets the coords for a given plane
function getPlane(num) {
    const size = 50.0;
    const xOffset = -10.0;
    const yOffset = -5.0;
    const zOffset = -10.0;
    const a = vec4(xOffset, yOffset, zOffset, 1.0);
    const b = vec4(size + xOffset, yOffset, zOffset, 1.0);
    const c = vec4(size + xOffset, yOffset, size + zOffset, 1.0);
    const d = vec4(xOffset, yOffset, size + zOffset, 1.0);
    const e = vec4(size + xOffset, size + yOffset, zOffset, 1.0);
    const f = vec4(xOffset, size + yOffset, zOffset, 1.0);
    const g = vec4(xOffset, size + yOffset, size + zOffset, 1.0);
    switch (num) {
        case 0:
            return [a, c, b, a, d, c];
        case 1:
            return [a, b, e, a, e, f];
        case 2:
            return [d, a, f, d, f, g];
    }
}

// Configures the 2D texture without image
function configure2DMap() {
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA, 2, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array([100, 100, 100, 255, 100, 100, 100, 255, 100, 100, 100, 255, 100, 100, 100, 255])
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
}

// Configures the 2D texture with image
function configure2DMapImage(image) {
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.uniform1i(gl.getUniformLocation(program, "texture"), 1);
}

// Configures the cube texture without image
function configureCubeMap() {
    const cubeMap = gl.createTexture();
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, gray);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, gray);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, gray);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, gray);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, gray);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, gray);

    gl.uniform1i(gl.getUniformLocation(program, "texMap"), 2);
}

// Configures the cube texture with image
function configureCubeMapImage() {
    const cubeMap = gl.createTexture();
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, env[0]);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, env[1]);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, env[2]);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, env[3]);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, env[4]);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, env[5]);

    gl.uniform1i(gl.getUniformLocation(program, "texMap"), 3);
}

// Control values
let isTextured = 1;
let isShadows = true;
let isReflection = 0;
let isRefraction = 0;
// Handle the key press events
document.onkeypress = function(e) {
    // Key press events
    const key = e.key;
    switch(key) {
        case 'p': // Decrease the cone angle
            if (coneAngle !== 0.0) {
                coneAngle -= ANGLE_DELTA;
            }
            gl.uniform1f(gl.getUniformLocation(program, "coneAngle"), coneAngle);
            break;
        case 'P': // Increase the cone angle
            if (coneAngle !== 1.0) {
                coneAngle += ANGLE_DELTA;
            }
            gl.uniform1f(gl.getUniformLocation(program, "coneAngle"), coneAngle);
            break;
        case 'm': // Smooth lighting
            gl.uniform1i(gl.getUniformLocation(program, "isFlat"), 0);
            break;
        case 'M': // Flat lighting
            gl.uniform1i(gl.getUniformLocation(program, "isFlat"), 1);
            break;
        case 'a': // Shadows
        case 'A':
            isShadows = !isShadows;
            break;
        case 'b': // Textures
        case 'B':
            isTextured = isTextured === 1 ? 0 : 1;
            break;
        case 'c': // Reflections
        case 'C':
            isReflection = isReflection === 1 ? 0 : 1;
            break;
        case 'd': // Refractions
        case 'D':
            isRefraction = isRefraction === 1 ? 0 : 1;
            break;
    }
};

// Coord slider
function slider(coord) {
    switch (coord) {
        case "x":
            eyeX = document.getElementById("cameraX").value;
            break;
        case "y":
            eyeY = document.getElementById("cameraY").value;
            break;
        case "z":
            eyeZ = document.getElementById("cameraZ").value;
            break;
    }
}

// Fov slider
function fovChange() {
    fov = document.getElementById("fov").value;
}

// Speed slider
function speed(layer) {
    ROTATE_SPEED[layer - 1] = document.getElementById("speed" + layer).value / 10.0;
}
