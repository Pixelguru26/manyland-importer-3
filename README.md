# Manyland Importer 3
MLI 3 is a browser console script for importing images into the Manyland editor.

Based on Zoltar's original PixelCopyImage: https://pastebin.com/N4mQPx5m
(Permission granted by the original creator as of 02/06/2022)

---

Instructions:
  - Open the object creator in Manyland.
  - Choose object type (primarily designed for `Very Big Thing`, `Dynamic`, or `Body`, your mileage may vary outside those types.)
  - Open your browser console.
  - Copy the contents of ImportMLI3.js into the console and run it.
    + Optionally, you can still copy the contents of PixelCopyImage.js instead if the import function does not properly work.
  - You should see a message saying the script is enabled in the log.

The script is now enabled, and ready to copy images.

---

This is the most important function provided by the script:

`pixelCopyImage(string url[, bool pixelart[, bool pixelcolor[, enum framingmode[, int[] srcrect]]]]);`

For those of you who don't speak syntax formatting, `url` is the only required parameter. Here's an example, showing the default parameters:

`pixelCopyImage('https://gpm.nasa.gov/education/sites/default/files/article_images/globe_west_2048.jpg', false, false, 'mli', [0,0,1,1]);`

An explanation of each parameter:
  - `pixelart` (boolean): If true, prevents the image from being rescaled to fit the editor, instead using the raw image scale and aspect ratio to define animation frames.
  - `pixelcolor` (boolean): If true, prevents the image colors from being quantized (via `quantize.js`, https://pastebin.com/raw/KzvbVdd6 ) to fit the 56-color palette of the editor.
  - `framingmode` (enum): An enum defining the framing mode to use for animations or multi-frame images. Valid inputs are: ['mli', 'row']. The `mli` framing mode is the default built for importing large images. The `row` framing mode imports frames in reading order, a row at a time. (wip)
  - `srcrect` (array of number): An array of four numbers defining `x`, `y`, `width`, and `height` of a rectangle as a fraction of the original image dimensions. Crops the image to these dimensions. Note that this may cause issues with color quantization in some images. This is a known issue being addressed.

---

Recently, a new function has been added for importing multiple images into a dynamic (or other multi-framed object) simultaneously. You can use the following function to do this:

`pixelCopyImages(string[] urlarray[, bool pixelart[, bool pixelcolor]]);`

Example:

`pixelCopyImages(['url1', 'url2', 'url3'], false, false);`

Do note that this function imports each image as a separate frame and resizes them appropriately. Parameters are similar to the corresponding parameters of the base function.

---

If you get strange errors, it's often a problem with the URL. Try a different hosting service for the image before posting an error report - but do please post an error report! This script is still wracked with bugs.
