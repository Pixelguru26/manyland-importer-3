var [pixelCopyImage, pixelCopyImages] = await (async () => {
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
	function start() {
		ig.game.alertDialog.prompt = Deobfuscator.function(ig.game.alertDialog, "if(!this.isOpen)")
		ig.game.painter.rotatePixels = Deobfuscator.function(ig.game.painter, "(a);return a");
	}
	(async () => {
		if (typeof Deobfuscator === 'undefined') 
			await $.getScript("https://cdn.jsdelivr.net/gh/parseml/many-deobf@latest/deobf.js");
		start();
	})();

	// src: https://axonflux.com/handy-rgb-to-hsl-and-rgb-to-hsv-color-model-c
	function rgbToHsv(r, g, b){
	    r = r/255, g = g/255, b = b/255;
	    var max = Math.max(r, g, b), min = Math.min(r, g, b);
	    var h, s, v = max;

	    var d = max - min;
	    s = max == 0 ? 0 : d / max;

	    if(max == min){
	        h = 0; // achromatic
	    }else{
	        switch(max){
	            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
	            case g: h = (b - r) / d + 2; break;
	            case b: h = (r - g) / d + 4; break;
	        }
	        h /= 6;
	    }

	    return [h, s, v];
	}

class image {
	constructor(jImage) {
		this.jImage = jImage;
	}
	clear() {
		// invalidates all cached data
		this.flatImage = null;
		this.paletteImage = null;
		this.palette = null;
		return this;
	}

	get dims() { return [this.jImage.bitmap.width, this.jImage.bitmap.height]; }
	get w() { return this.jImage.bitmap.width; }
	get h() { return this.jImage.bitmap.height; }

	static paletteCompare(a, b) {
		a = Jimp.intToRGBA(a);
		b = Jimp.intToRGBA(b);
		let hsva = rgbToHsv(a.r,a.g,a.b);
		hsva[3] = a.a;
		let hsvb = rgbToHsv(b.r,b.g,b.b);
		hsvb[3] = b.a;
		// return b-a
		let v;
		for (let i = 0; i < hsva.length; i++) {
			v = hsvb[i] - hsva[i];
			if (v != 0) {
				return v;
			}
		}
		return 0;
	}

	getPixelColor(x, y) { return this.jImage.getPixelColor(x,y); }

	crop(x, y, w, h) { this.clear().jImage.crop(x, y, w, h); }
	resize(w, h) { this.clear().jImage.resize(w, h); }

	flatten() {
		let d = this.jImage.bitmap.data;
		let flat = this.flatImage = [];
		this.jImage.scan(0,0,this.w,this.h, (x, y, idx) => {
			flat.push([d[idx + 0], d[idx + 1], d[idx + 2], d[idx + 3]]);
		});
		return flat;
	}

	quantize(colors) {
		let d = this.jImage.bitmap.data;
		// may eventually be replaced with RgbQuant.js
		let m = MMCQ.quantize(this.flatImage??this.flatten(), colors);
		this.jImage.scan(0,0,this.w,this.h, (x, y, idx) => {
			// map rgb values
			var c = m.map([d[idx + 0],d[idx + 1],d[idx + 2]]);
			// assign mapped values
			d[idx + 0] = c[0];
			d[idx + 1] = c[1];
			d[idx + 2] = c[2];
			// MMCQ.js doesn't handle alpha, so that's unchanged.
		});
		return this.clear();
	}

	getPalette(threshold) {
		threshold = threshold??10;
		let ci = {}; // color indexer
		let ic = [];
		let palette = this.palette = [];
		// ensure image is flattened
		this.flatImage??this.flatten();

		let c;
		for (let i = 0; i < this.flatImage.length; i++) {
			c = Jimp.rgbaToInt(...this.flatImage[i]);

			// crush transparent pixels!
			if (this.flatImage[i][3] > threshold) {
				// register color to indexer and palette
				if (!(c in ci)) {
					ci[c] = ic.push(c)-1;
				}
			}
		}

		// sort palette (gotta be pretty)
		// may be moved to another method later
		ic.sort(image.paletteCompare);
		// add eraser
		ic.splice(11, 0, 0x00000000);
		// reregister palette to indexer
		ci = {};
		for (let i = 0; i < ic.length; i++) {
			if (i < 56) {
				ci[ic[i]] = i;
				c = Jimp.intToRGBA(ic[i]);
				c.alpha = c.a/255;
				palette.push(c);
			} else {
				// erase all beyond palette count
				ci[ic[i]] = 11;
			}
		}

		// return [palette, indexer]
		return [palette, ci];
	}

	palettize(threshold) {
		let [palette, indexer] = this.getPalette(threshold);
		let paletteImage = this.paletteImage = [];
		let flat = this.flatImage;
		let v;
		for (let i = 0; i < flat.length; i++) {
			v = Jimp.rgbaToInt(...flat[i]);
			paletteImage.push(indexer[v]??11);
		}
		return [paletteImage, palette];
	}

	getPixelIndex(x, y) {
		if (x >= 0 && x < this.w && y >= 0 && y < this.h) {
			return x + y*this.w;
		} else {
			return -1;
		}
	}

	getPixelPIndex(x, y) {
		let index = this.getPixelIndex(x, y);
		if (index > -1 && this.paletteImage) {
			return this.paletteImage[index];
		} else {
			return 11;
		}
	}
}

// Component of indexing
function frameOffset(fmode, index, imgw, imgh, framew, frameh) {
	let imgwf = Math.ceil(imgw/framew);
	let imghf = Math.ceil(imgh/frameh);
	switch (fmode) {
		case 0:
			return [index%3, Math.floor(index/3)];
		case 1:
			return [index%imgwf, Math.floor(index/imgwf)];
		default:
			throw "Invalid framing mode: " + fmode;
	}
}

function frame(fmode, img, framew, frameh, frames) {
	let ret = [];
	let off;
	let index;
	for (let frame = 0; frame < frames; frame++) {
		ret.push([]);
		off = frameOffset(fmode, frame, img.w, img.h, framew, frameh);
		for (let y = 0; y < frameh; y++) {
			ret[frame].push([]);
			for (let x = 0; x < framew; x++) {
				index = img.getPixelPIndex(x + off[0] * framew, y + off[1] * frameh);
				ret[frame][y].push(index);
			}
		}
	}
	debug = ret;
	return ret;
}

function write(canv, palette) {
	// convenience variables
	let p = ig.game.painter;
	let pd = p.data;

	// write in canvas and palette
	pd.pixels = canv;
	pd.colors = palette;
	for (let i = palette.length; i < 56; i++) {
		pd.colors[i] = {r: 255, g: 255, b: 255, alpha: 1};
	}
	pd.colors[11] = {r: 0, g: 0, b: 0, alpha: 0};

	// Why do we need to rotate and flip everything? I don't know! Blame Zoltar!
	p.flip = Deobfuscator.function(p, "this.tileWidth-c-1]"); // I have no idea what this does.
	for (let frame = 0; frame < ig.game.painter.data.pixels.length; frame++) {
		pd.pixels[frame] = p.rotatePixels(pd.pixels[frame]);
		pd.pixels[frame] = p.flip(pd.pixels[frame]);
	}
	ig.game.painter.update();
}

function validatefmode(fmode) {
	// default and variant arguments for fmode
	// sorry in advance
	var framingmodes = {
		mli: 0, // special (and default) case for mli image imports.
		row: 1 // all frames in a row
	};
	if (!(fmode in [0,1])) {
		if (fmode in framingmodes) {
			// fmode is enum
			fmode = framingmodes[fmode];
		} else {
			// fmode is null or invalid
			fmode = 0;
		}
	}; // fmode is now a valid number
	return fmode;
}

const dynamicCodes = [
	`0s: cells show, cells 1+2+3 up 58, cells 4+5+6 up 29, cells 1+4+7 left 29, cells 3+6+9 right 29`,
	`0s: cell 1 show\n+0.1s: cells hide, cell 2 show\n+0.1s: cells hide, cell 3 show\n+0.1s: cells hide, cell 4 show\n+0.1s: cells hide, cell 5 show\n+0.1s: cells hide, cell 6 show\n+0.1s: cells hide, cell 7 show\n+0.1s: cells hide, cell 8 show\n+0.1s: cells hide, cell 9 show\n+0.1s: restart`
];

// Main function
async function pixelCopyImage(url, pixelart, pixelcolor, fmode, srcrect) {
	fmode = validatefmode(fmode);
	let painterSize = ig.game.painter.tileWidth;

	// Load image
	let img = null;
	try {
		img = await Jimp.read(`https://api.allorigins.win/raw?url=${url}`);
	} catch (e) {
		return ["Error in Jimp.read();",e];
	}
	img = new image(img);

	// Resizing (in case of large images)
	if (srcrect) {
		img.crop(srcrect[0] * img.w, srcrect[1] * img.h, srcrect[2] * img.w, srcrect[3] * img.h);
	}
	if (!pixelart) {
		switch(fmode) {
			case 1:
				if (ig.game.painter.data.type === "dynamicThing") {
					await img.resize(painterSize * 9, painterSize);
				} else {
					await img.resize(painterSize, painterSize);
				}
				break;
			default:
				if (ig.game.painter.data.type === "dynamicThing") {
					await img.resize(painterSize * 3, painterSize * 3);
				} else {
					await img.resize(painterSize, painterSize);
				}
				break;
		}
	}

	if (!pixelcolor) {
		img.quantize(56);
	}
	img.palettize();
	write(frame(fmode, img, painterSize, painterSize, 9), img.palette);
	if (ig.game.painter.data.type === "dynamicThing") {
		ig.game.painter.data.prop.text = dynamicCodes[fmode]??``;
	}
}
async function pixelCopyImages(urlarray, pixelart, pixelcolor) {
	let painterSize = ig.game.painter.tileWidth;
	let imgs = [];
	try {
		for (let i = 0; i < urlarray.length; i++) {
			let img = await Jimp.read(`https://api.allorigins.win/raw?url=${urlarray[i]}`);
			img = new image(img);
			imgs.push(img);
		}
	} catch (e) {
		return ["Error in Jimp.read(); on image number "+i,e];
	}
	let img = new image(new Jimp(painterSize*imgs.length, painterSize, 0x00000000, (err, image) => {}));
	if (!pixelart) {
		for (let i = 0; i < imgs.length; i++) {
			await imgs[i].resize(painterSize, painterSize);
		}
	}
	for (let i = 0; i < imgs.length; i++) {
		await img.jImage.blit(imgs[i].jImage, i*painterSize, 0);
	}
	if (!pixelcolor) {
		img.quantize(56)
	}
	img.palettize();
	write(frame(1, img, painterSize, painterSize, 9), img.palette);
	if (ig.game.painter.data.type === "dynamicThing") {
		ig.game.painter.data.prop.text = dynamicCodes[1]??``;
	}
}
async function pixelCopyJimp(jImage, pixelcolor, fmode) {
	fmode = validatefmode(fmode);
	let painterSize = ig.game.painter.tileWidth;
	let img = new image(jImage);
	if (!pixelcolor) {
		img.quantize(56);
	}
	img.palettize();
	write(frame(fmode, img, painterSize, painterSize, 9), img.palette);
	if (ig.game.painter.data.type === "dynamicThing") {
		ig.game.painter.data.prop.text = dynamicCodes[fmode]??``;
	}
}

return [pixelCopyImage, pixelCopyImages];
})();
