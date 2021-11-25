# Manyland Importer 3
MLI 3 is a browser console script for importing images into the Manyland editor.

This is a rewrite of Zoltar's original PixelCopyImage: https://pastebin.com/N4mQPx5m
If the original creator wishes me to take this down, give further credit, etc., I will, no questions asked.

Usage is simple:
  - Open creator in Manyland
  - Choose object type (primarily designed for `Very Big Thing`, `Dynamic`, or `Body`, your mileage may vary outside those.)
  - Open your browser console
  - Copy the script (contents of PixelCopyImage.js) into the console and run it

The script is now enabled, and ready to copy images via the following function:

`pixelCopyImage(string url[, bool pixelart[, bool pixelcolor[, bool local[, int[] srcrect]]]]);`

For those of you who don't speak syntax formatting, `url` is the only required parameter. Here's an example, showing the default parameters:

`pixelCopyImage('https://gpm.nasa.gov/education/sites/default/files/article_images/globe_west_2048.jpg', false, false, false, [0,0,1,1]);`

An explanation of each parameter is as follows:
  - `pixelart` (boolean): If true, prevents the image from being rescaled to fit the editor, instead using the raw image scale and aspect ratio to define animation frames.
  - `pixelcolor` (boolean): If true, prevents the image colors from being quantized (via `quantize.js`, https://pastebin.com/raw/KzvbVdd6 ) to fit the 56-color palette of the editor.
  - `local` (boolean): Experimental! Uses the *raw* url provided instead of prepending the All Origins ( https://allorigins.win/ ) CORS workaround.
  - `srcrect` (array of number): An array of four numbers defining `x`, `y`, `width`, and `height` of a rectangle as a fraction of the original image dimensions. This rectangle then defines the source area of the image to read from, effectively cropping it.

If you get strange errors, it's often a problem with the URL. Try a different hosting service for the image before posting an error report - but do please post an error report! This script is still wracked with bugs.
