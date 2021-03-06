/* #depends[typed_field.js] */
function field_blank(html, value) {
	if (html == null) html = "";
	this.html = html;
	typed_field.call(this, value, false, null, null);
}
field_blank.prototype = new typed_field();
field_blank.prototype.constructor = field_blank;
field_blank.prototype.exportCell = function(cell) { cell.value = ""; };
field_blank.prototype._create = function() {
	if (typeof this.html == 'string') {
		this.element.innerHTML = this.html;
	} else {
		this.element.appendChild(this.html);
	}
};

