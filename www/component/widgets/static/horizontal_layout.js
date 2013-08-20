/** Create a horizontal layout: children will fill the height, and be positioned horizontally according to the layout info of each.
 * Each child can contain a <i>layout</i> attribute, having one of the following value:<ul style='margin:0px'>
 * <li><code>fill</code>: the element will take as much space as possible</li>
 * <li><code>fixed</code>: the element should ne be resized</li>
 * <li>an integer value: the element must have the given width (in pixel)</li>
 * </ul>
 * @constructor
 * @param container the container (either the HTMLElement or its id)
 */
function horizontal_layout(container) {
	var t = this;
	t.container = container;
	if (typeof t.container == 'string') t.container = document.getElementById(t.container);
	
	t.layout = function() {
		// reset
		for (var i = 0; i < t.container.childNodes.length; ++i) {
			var e = t.container.childNodes[i];
			if (e.nodeType != 1) continue;
			var layout;
			if (e.getAttribute('layout')) layout = e.getAttribute('layout'); else layout = 'fixed';
			if (layout == 'fill')
				e.style.width = "";
		}
		var w = t.container.offsetWidth;
		var h = t.container.offsetHeight;
		var nb_to_fill = 0;
		var used = 0;
		for (var i = 0; i < t.container.childNodes.length; ++i) {
			var e = t.container.childNodes[i];
			if (e.nodeType != 1) continue;
			var layout;
			if (e.getAttribute('layout')) layout = e.getAttribute('layout'); else layout = 'fixed';
			if (layout == 'fill')
				nb_to_fill++;
			else if (!isNaN(parseInt(layout)))
				used += parseInt(layout);
			else {
				e.style.display = 'inline-block';
				e.style.width = "";
				setHeight(e, h);
				used += e.offsetWidth;
			}
		}
		var x = 0;
		for (var i = 0; i < t.container.childNodes.length; ++i) {
			var e = t.container.childNodes[i];
			if (e.nodeType != 1) continue;
			var layout;
			if (e.getAttribute('layout')) layout = e.getAttribute('layout'); else layout = 'fixed';
			e.style.display = 'inline-block';
			e.style.verticalAlign = "top";
			setHeight(e, h);
			if (layout == 'fill') {
				var ww = Math.floor((w-used)/nb_to_fill--);
				setWidth(e, ww);
				x += ww;
			} else if (!isNaN(parseInt(layout))) {
				var ww = parseInt(layout);
				setWidth(e, ww);
				x += ww;
			} else {
				x += e.offsetWidth;
			}
		}
	};
	
	t.layout();
	addLayoutEvent(t.container, function(){t.layout();});
}