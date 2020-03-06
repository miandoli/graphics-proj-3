# CS4731: Computer Graphics
## Project 3
### Matt Iandoli
***
## How to run
Open in your browser

## Structure

### Part 1
Meshes are drawn, either a cube or sphere, and given a color. The shapes are rotated in a hierarchy to simulate a mobile or kinectic system. A spotlight with an option between smooth or flat lighting is used as well as an ambient light. Specular light is also used to add further detail into the lighting of the scene. Rotating in a hierarchy system by implementing a stack with the model view.

### Part 2
3 planes are now drawn similar to the lines (without lighting) but have textures applied to them. Textures are loaded in and are mapped to each plane using a repeating pattern. These textures can be turned on and off with keyboard commands. Shadows are somewhat implemented, the default shadow transformation to the z=0 plane was used, however does not work correctly with the model/view matrix and will move around with the camera. The shadows then aren't placed in flush with the planes due to this error making it not possible. Reflections and refractions are implemented similary to the textures for the plane but applied on top of the current color of the object using either the refract() or reflect() functions. Reflections and refractions can be turned on and off with keyboard commands and can be turned on at the same time. However, when turned on, gives a significant performance drop, to my knowledge it is optimized as best as possible and any unneeded parts to reflection and refraction for each animation frame are removed and only called once.

### Extra Credit
Sliders are implemented to change the camera eye coordinates, FOV, and speed of the different layers of the mobile.

## Files
- index.html
    - Contains the html with the canvas, controls, etc.
- index.js
    - Contains all the OpenGL code for displaying and manipulating the meshes and logic for parsing the files and event listeners for the users inputs
- stylesheet.css
    - Contains the few styles for classes used in the HTML
- lib/
    - All the important WebGL code given by the instructor
- README.md
    - see README.md
