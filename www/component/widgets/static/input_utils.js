function inputAutoresize(input, min_size) {
	input._min_size = min_size;
	input.mirror = document.createElement("SPAN");
	var style = getComputedStyle(input);
	if (input.style) {
		if (input.style.fontSize)
			input.mirror.style.fontSize = input.style.fontSize;
		else if (style.fontSize) input.mirror.style.fontSize = style.fontSize;
		if (input.style.fontWeight)
			input.mirror.style.fontWeight = input.style.fontWeight;
		else if (style.fontWeight) input.mirror.style.fontWeight = style.fontWeight;
		if (input.style.fontFamily)
			input.mirror.style.fontFamily = input.style.fontFamily;
		else if (style.fontFamily) input.mirror.style.fontFamily = style.fontFamily;
	}
	input.mirror.style.position = 'absolute';
	input.mirror.style.whiteSpace = 'pre';
	input.mirror.style.left = '0px';
	input.mirror.style.top = '-10000px';
	input.mirror.style.padding = "2px";
	document.body.appendChild(input.mirror);
	var last = 0;
	input.onresize = null;
	var update = function() {
		input.mirror.removeAllChildren();
		var s = input.value;
		input.mirror.appendChild(document.createTextNode(s));
		var w = getWidth(input.mirror);
		if (input._min_size < 0) {
			// must fill the width of its container
			input.style.width = "100%";
			if (w < 15) w = 15;
			input.style.minWidth = w+"px";
			if (input.offsetWidth != last) {
				layout.invalidate(input);
				if (input.onresize) input.onresize();
				last = input.offsetWidth;
			}
		} else {
			var min = input._min_size ? input._min_size * 10 : 15;
			if (w < min) w = min;
			input.style.width = w+"px";
			if (last != w) {
				layout.invalidate(input);
				if (input.onresize) input.onresize();
			}
			last = w;
		}
	};
	input.inputAutoresize_prev_onkeydown = input.onkeydown;
	input.onkeydown = function(e) { if (this.inputAutoresize_prev_onkeydown) this.inputAutoresize_prev_onkeydown(e); update(); };
	input.inputAutoresize_prev_onkeyup = input.onkeyup;
	input.onkeyup = function(e) { if (this.inputAutoresize_prev_onkeyup) this.inputAutoresize_prev_onkeyup(e); update(); };
	input.inputAutoresize_prev_oninput = input.oninput;
	input.oninput = function(e) { if (this.inputAutoresize_prev_oninput) this.inputAutoresize_prev_oninput(e); update(); };
	input.inputAutoresize_prev_onpropertychange = input.onpropertychange;
	input.onpropertychange = function(e) { if (this.inputAutoresize_prev_onpropertychange) this.inputAutoresize_prev_onpropertychange(e); update(); };
	input.inputAutoresize_prev_onchange = input.onchange;
	input.onchange = function(e) { if (this.inputAutoresize_prev_onchange) this.inputAutoresize_prev_onchange(e); update(); };
	update();
	input.autoresize = update;
	input.setMinimumSize = function(min_size) {
		last = 0;
		this._min_size = min_size;
		update();
	};
}

function inputDefaultText(input, default_text) {
	var is_default = false;
	var original_class = input.className;
	input.inputDefaultText_prev_onfocus = input.onfocus; 
	input.onfocus = function(ev) {
		if (is_default) {
			input.value = "";
			input.className = original_class;
		}
		if (this.inputDefaultText_prev_onfocus) this.inputDefaultText_prev_onfocus(ev);
	};
	input.inputDefaultText_prev_onblur = input.onblur;
	input.onblur = function(ev) {
		input.value = input.value.trim();
		if (input.value.length == 0) {
			input.className = original_class ? original_class+" informative_text" : "informative_text";
			input.value = default_text;
			is_default = true;
		} else {
			input.className = original_class;
			is_default = false;
		}
		if (this.inputDefaultText_prev_onblur) this.inputDefaultText_prev_onblur(ev);
		if (input.onchange) input.onchange();
	};
	input.getValue = function() {
		if (is_default) return "";
		return input.value;
	};
	if (document.activeElement == input) input.onfocus(); else input.onblur();
}