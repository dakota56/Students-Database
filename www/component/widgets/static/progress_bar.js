if (typeof theme != 'undefined')
	theme.css("progress_bar.css");

function progress_bar(width, height, css) {
	
	this.total = 0;
	this.position = 0;
	this.element = document.createElement("DIV");
	this.element.className = "progress_bar"+(css ? " "+css : "");
	this.element.style.width = width+"px";
	this.element.style.height = height+"px";
	this.element.style.overflow = "hidden";
	this.element.style.position = "relative";
	this.progress = document.createElement("DIV");
	this.progress.style.position = "absolute";
	this.progress.style.top = "0px";
	this.progress.style.left = "0px";
	this.progress.style.width = "0px";
	this.progress.style.height = height+"px";
	this.element.appendChild(this.progress);
	
	this.setTotal = function(total) {
		this.total = total;
		this.setPosition(0);
	};
	this.setPosition = function(pos) {
		if (pos > this.total) pos = this.total;
		this.position = pos;
		this.progress.style.width = Math.floor(this.position*width/this.total)+"px";
	};
	this.addAmount = function(amount) {
		this.setPosition(this.position + amount);
	};
	this.done = function() {
		this.element.innerHTML = "Done.";
	};
	
	this.error = function() {
		this.element.innerHTML = "Error";
	};
	
}
