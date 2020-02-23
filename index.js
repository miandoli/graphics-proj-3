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
    gl.enable(gl.DEPTH_TEST);
}

// Handle the key press events
document.onkeypress = function(e) {
    // Key press events
    const key = e.key;
    switch(key) {

    }
};
