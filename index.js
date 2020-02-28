let gl;
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

    preRender();
}

// let points = [];
// let colors = [];
// let normals = [];

const SUB_DIVISIONS = 5;
const lightPosition = vec4(10.0, 10.0, 10.0, 0.0);
const lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
const lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
const lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

const materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
const materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
const materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
const materialShininess = 20.0;

// Unit sphere
const va = vec4(0.0, 0.0, -1.0, 1.0);
const vb = vec4(0.0, 0.942809, 0.333333, 1.0);
const vc = vec4(-0.816497, -0.471405, 0.333333, 1.0);
const vd = vec4(0.816497, -0.471405, 0.333333, 1.0);

function sphere() {
    let points = [];
    // Sub-divide triangles
    points = points.concat(divideTriangle(va, vb, vc, SUB_DIVISIONS));
    points = points.concat(divideTriangle(vd, vc, vb, SUB_DIVISIONS));
    points = points.concat(divideTriangle(va, vd, vb, SUB_DIVISIONS));
    points = points.concat(divideTriangle(va, vc, vd, SUB_DIVISIONS));
    return points;
}

function divideTriangle(a, b, c, count) {
    if (count > 0) {
        let ab = mix(a, b, 0.5);
        let ac = mix(a, c, 0.5);
        let bc = mix(b, c, 0.5);

        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);

        let points = [];
        points = points.concat(divideTriangle(a, ab, ac, count - 1));
        points = points.concat(divideTriangle(ab, b, bc, count - 1));
        points = points.concat(divideTriangle(bc, c, ac, count - 1));
        points = points.concat(divideTriangle(ab, bc, ac, count - 1));
        return points;
    } else {
        return triangle(a, b, c);
    }
}

function triangle(a, b, c, color) {
    // Push points
    let points = [];
    points.push(a);
    points.push(b);
    points.push(c);
    return points;
}

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
        verts.push( vertices[indices[i]] );
    }
    return verts;
}

let modelMatrix;
function preRender() {
    // Set the point size
    const vPointSize = gl.getUniformLocation(program, "vPointSize");
    gl.uniform1f(vPointSize, 10.0);

    // Set-up perspective view
    const pers = perspective(35.0, 1, 0.1, 10000);
    const projMatrix = gl.getUniformLocation(program, 'projMatrix');
    gl.uniformMatrix4fv(projMatrix, false, flatten(pers));

    const diffuseProduct = mult(lightDiffuse, materialDiffuse);
    const specularProduct = mult(lightSpecular, materialSpecular);
    const ambientProduct = mult(lightAmbient, materialAmbient);

    // Shininess
    gl.uniform4fv(gl.getUniformLocation(program, "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "specularProduct"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

    // Get model matrix
    modelMatrix = gl.getUniformLocation(program, "modelMatrix");

    render();
}

const eye = vec3(0.0, 0.0, 25.0);
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

let stack = [];
let camMatrix;
let angles = [
    [30.0],
    [60.0, 45.0],
    [10.0, 70.0, 45.0, 25.0]
];
const ROTATE_SPEED = [0.25, 0.5, 0.75];
function render() {
    // Clear the buffer bits
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const sphere1 = sphere();
    const cube1 = cube();

    // Set camera view
    camMatrix = lookAt(eye, at, up);

    // 0, 0
    stack.push(camMatrix);
        camMatrix = mult(translate(0.0, 3.0, 0.0), mult(camMatrix, rotateY(angles[0][0])));
        gl.uniformMatrix4fv(modelMatrix, false, flatten(camMatrix));
        draw(cube1, vec3(1.0, 1.0, 1.0));

        // 1, 0
        stack.push(camMatrix);
            camMatrix = mult(mult(camMatrix, translate(-4.0, -3.0, 0.0)), rotateY(angles[1][0]));
            gl.uniformMatrix4fv(modelMatrix, false, flatten(camMatrix));
            draw(sphere1, vec3(1.0, 1.0, 1.0));

            // 2, 0
            stack.push(camMatrix);
                camMatrix = mult(mult(camMatrix, translate(-2.0, -3.0, 0.0)), rotateY(angles[2][0]));
                gl.uniformMatrix4fv(modelMatrix, false, flatten(camMatrix));
                draw(cube1, vec3(1.0, 1.0, 1.0));
            camMatrix = stack.pop();

            // 2, 1
            stack.push(camMatrix);
                camMatrix = mult(mult(camMatrix, translate(2.0, -3.0, 0.0)), rotateY(angles[2][1]));
                gl.uniformMatrix4fv(modelMatrix, false, flatten(camMatrix));
                draw(sphere1, vec3(1.0, 1.0, 1.0));
            camMatrix = stack.pop();
        camMatrix = stack.pop();

        // 1, 1
        stack.push(camMatrix);
            camMatrix = mult(mult(camMatrix, translate(4.0, -3.0, 0.0)), rotateY(angles[1][1]));
            gl.uniformMatrix4fv(modelMatrix, false, flatten(camMatrix));
            draw(cube1, vec3(1.0, 1.0, 1.0));

            // 2, 2
            stack.push(camMatrix);
                camMatrix = mult(mult(camMatrix, translate(-2.0, -3.0, 0.0)), rotateY(angles[2][2]));
                gl.uniformMatrix4fv(modelMatrix, false, flatten(camMatrix));
                draw(sphere1, vec3(1.0, 1.0, 1.0));
            camMatrix = stack.pop();

            // 2, 3
            stack.push(camMatrix);
                camMatrix = mult(mult(camMatrix, translate(2.0, -3.0, 0.0)), rotateY(angles[2][3]));
                gl.uniformMatrix4fv(modelMatrix, false, flatten(camMatrix));
                draw(cube1, vec3(1.0, 1.0, 1.0));
            camMatrix = stack.pop();
        camMatrix = stack.pop();
    camMatrix = stack.pop();

    for (let i = 0; i < angles.length; i++) {
        let angleI = angles[i];
        for (let j = 0; j < angleI.length; j++) {
            angleI[j] += ROTATE_SPEED[i];
        }
    }

    requestAnimationFrame(render);
}

function draw(points, color) {
    let normals = [];
    let colors = [];
    for (let i = 0; i < points.length; i++) {
        const point = points[i];
        normals.push(point[0], point[1], point[2], 0.0);
        colors.push(color);
    }

    const fPoints = flatten(points);

    // Create the buffer for the vertexes
    const vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, fPoints, gl.STATIC_DRAW);

    // Set up the memory for the vertexes
    const vPosition = gl.getAttribLocation(program, "vPosition");
    gl.enableVertexAttribArray(vPosition);
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);

    // Create the buffer for the normals
    const nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    // Set up the memory for the normals
    const vNormal = gl.getAttribLocation( program, "vNormal");
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormal);

    // Create the buffer for the shaders
    const cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    // Set up the memory for the shaders
    const vColor = gl.getAttribLocation(program, "vColor");
    gl.enableVertexAttribArray(vColor);
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);

    // Draw triangles
    gl.drawArrays(gl.TRIANGLES, 0, fPoints.length);
}

// Handle the key press events
document.onkeypress = function(e) {
    // Key press events
    const key = e.key;
    switch(key) {
        case 'p':
            console.log("Fuck");
            break;
        case 'P':
            console.log("FUCK");
            break;
        case 'm':
            console.log("Fuck");
            break;
        case 'M':
            console.log("FUCK");
            break;
    }
};
