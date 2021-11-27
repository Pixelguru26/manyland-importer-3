

// Libraries and requirements
	// Getting Quantization Algorithm
	if (typeof MMCQ === 'undefined') {
		fetch('https://api.allorigins.win/get?url=https://pastebin.com/raw/KzvbVdd6').then(resp => resp.text()).then(script => {
			let importer = JSON.parse(script);
	//     consoleref.log(importer.contents);
			 mm = document.createElement('script');
			mm.innerHTML = importer.contents;
			$('body')[0].appendChild(mm);
		})
	}
	// Getting Jimp
	if (typeof Jimp == 'undefined') {
		$.getScript('https://cdnjs.cloudflare.com/ajax/libs/jimp/0.12.0/jimp.min.js');
	}
	// Getting Deobf
	(async () => {
		if (typeof Deobfuscator === 'undefined') 
			await $.getScript("https://cdn.jsdelivr.net/gh/parseml/many-deobf@latest/deobf.js");
		start();
	})();

	function start() {
		ig.game.alertDialog.prompt = Deobfuscator.function(ig.game.alertDialog, "if(!this.isOpen)")
		ig.game.painter.rotatePixels = Deobfuscator.function(ig.game.painter, "(a);return a");
	}

// Indexing obfuscates readability when done inline
function indexPixel(f, x, y, w, h, imgw, imgh) {
	// Components broken up for further readability
	let indexX = (x);
	let indexY = (y)*imgw;
	let indexFX = (f*w)%imgw;
	let indexFY = Math.floor(f*w/imgw)*imgw*h;
	return indexX + indexY + indexFX + indexFY;
}

// Stage 1
function getPalette(image, src, pixelart, pixelcolor) {
	let flatImage = [];
	let alphaImage = [];

	// flatten image for processing
	let pixel = null;
	for (let i = 0; i < src[2]*src[3]; i++) {
		pixel = Jimp.intToRGBA(image.getPixelColor(src[0]+i%image.bitmap.width, src[1]+Math.floor(i/image.bitmap.width)));
		if (pixel.a < 10) {
			// fix nonstandard transparency colors
			flatImage[i] = [0,0,0];
		} else {
			flatImage[i] = [pixel.r, pixel.g, pixel.b];
		}
		alphaImage[i] = pixel.a;
	}
	let colorMap = pixelcolor?null:MMCQ.quantize(flatImage, 56);

	let palette = [];
	let colorIndex = {};
	let indexImage = [];

	// add eraser
	colorIndex[0] = palette.push(0) - 1;

	// index colors
	let color = 0;
	let index = 0;
	for (let i = 0; i < flatImage.length; i++) {
		pixel = pixelcolor?flatImage[i]:colorMap.map(flatImage[i]);
		color = Jimp.rgbaToInt(pixel[0],pixel[1],pixel[2],alphaImage[i]);
		if (alphaImage[i] < 10) color = 0;
		if (!(color in colorIndex)) {
			colorIndex[color] = palette.push(color) - 1;
		}
		if (colorIndex[color] < 56) {
			indexImage[i] = colorIndex[color];	
		} else {
			indexImage[i] = 11;
		}
		// index = findColor(palette, color.r, color.g, color.b, color.a);
		// if (index === -1) {
		// 	index = palette.push(color);
		// }
		// indexImage[i] = index;
	}
	if (palette.length < 12) {
		for (let i = palette.length; i < 12; i++) {
			palette.push(0);
		}
	}

	return [indexImage, palette];
}

// Stage 2
function convert(indexImage, w, h, palette) {
	let screen = ig.game.painter.data.pixels;
	let size = ig.game.painter.tileWidth;
	let canv = [];

	// here we go
	let index = 0;
	let id = 0;
	for (let frame = 0; frame < 9; frame++) {
		canv.push([]);
		for (let y = 0; y < size; y++) {
			canv[frame].push([]);
			for (let x = 0; x < size; x++) {
				index = indexPixel(frame, x, y, size, size, w, h);
				if (index < indexImage.length) {
					id = indexImage[index];
					// swap eraser to id 11
					if (id === 11) {
						id = 0;
					} else if (id === 0) {
						id = 11;
					}
					// write pixel into canvas
					canv[frame][y].push(id);
				} else {
					canv[frame][y].push(11);
				}
			}
		}
	}

	[palette[0], palette[11]] = [palette[11], palette[0]];
	let palette1 = [];
	let pixel = null;
	for (let i = 0; i < palette.length && i < 56; i++) {
		pixel = Jimp.intToRGBA(palette[i]);
		palette1[i] = {alpha: pixel.a/255, b: pixel.b, g: pixel.g, r: pixel.r};
	}
	return [canv, palette1];
}

// Stage 3
function write(canv, palette) {
	// convenience variables
	let p = ig.game.painter;
	let pd = p.data;

	// write in canvas and palette
	pd.pixels = canv;
	pd.colors = palette;
	for (let i = palette.length; i < 56; i++) {
		pd.colors[i] = {r: 255, g: 255, b: 255, a: 1};
	}

	// Why do we need to rotate and flip everything? I don't know! Blame Zoltar!
	p.flip = Deobfuscator.function(p, "this.tileWidth-c-1]"); // I have no idea what this does.
	for (let frame = 0; frame < ig.game.painter.data.pixels.length; frame++) {
		pd.pixels[frame] = p.rotatePixels(pd.pixels[frame]);
		pd.pixels[frame] = p.flip(pd.pixels[frame]);
	}
	ig.game.painter.update();
}

// Main function
async function pixelCopyImage(url, pixelart, pixelcolor, local, srcrect) {

	let painterSize = ig.game.painter.tileWidth;
	srcrect = srcrect??[0,0,1,1];
	// Load image
	let image = null;
	if (local) {
		// Note: I have no idea if this actually works.
		//image = await Jimp.read(`file:///${url}`);
		image = await Jimp.read(url);
	} else {
		image = await Jimp.read(`https://api.allorigins.win/raw?url=${url}`);
	}

	// Resizing (in case of large images)
	if (!pixelart) {
		if (ig.game.painter.data.type === "dynamicThing") {
			await image.resize(Math.round(painterSize*3/srcrect[2]), Math.round(painterSize*3/srcrect[3]));
		} else {
			await image.resize(Math.round(painterSize/srcrect[2]), Math.round(painterSize/srcrect[3]));
		}
	}

	// Srcrect alteration
	srcrect[0] = srcrect[0] * image.bitmap.width;
	srcrect[1] = srcrect[1] * image.bitmap.height;
	srcrect[2] = srcrect[2] * image.bitmap.width;
	srcrect[3] = srcrect[3] * image.bitmap.height;

	if (ig.game.painter.data.type === "dynamicThing") {
		ig.game.painter.data.prop.text = `0s: cells show, cells 1+2+3 up 58, cells 4+5+6 up 29, cells 1+4+7 left 29, cells 3+6+9 right 29`;
	}

	let [indexImage, palette1] = getPalette(image, srcrect, pixelart, pixelcolor);
	let [canv, palette2] = convert(indexImage, srcrect[2], srcrect[3], palette1);
	write(canv, palette2);
}