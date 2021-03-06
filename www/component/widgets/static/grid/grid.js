if (typeof require != 'undefined') {
	require("typed_field.js",function(){
		require("field_blank.js");
	});
	theme.css("grid.css");
}

function GridColumnAction(id,icon,onclick,tooltip) {
	this.id = id;
	this.icon = icon;
	this.onclick = onclick;
	this.tooltip = tooltip;
}

function GridColumnContainer(title, sub_columns, attached_data) {
	this.title = title;
	this.text_title = null;
	this.sub_columns = sub_columns;
	this.attached_data = attached_data;
	this.th = document.createElement("TH");
	this.th.className = "container";
	if (title instanceof Element)
		this.th.appendChild(title);
	else
		this.th.innerHTML = title;
	this.th.col = this;
	window.to_cleanup.push(this);
	this.cleanup = function() {
		this.th.col = null;
		this.th = null;
		this.attached_data = null;
		this.sub_columns = null;
	};
	this._updateLevels = function() {
		this.nb_columns = 0;
		this.levels = 2;
		for (var i = 0; i < this.sub_columns.length; ++i) {
			this.sub_columns[i].parent_column = this;
			if (this.sub_columns[i] instanceof GridColumn) {
				this.nb_columns++;
				continue;
			}
			if (this.sub_columns[i].levels > this.levels+1) this.levels = this.sub_columns[i].levels+1;
			this.nb_columns += sub_columns[i].nb_columns;
		}
		this.th.colSpan = this.nb_columns;
		if (this.parent_column) this.parent_column._updateLevels();
	};
	this._updateLevels();
	this.getNbFinalColumns = function() {
		var nb = 0;
		for (var i = 0; i < this.sub_columns.length; ++i) {
			if (this.sub_columns[i] instanceof GridColumnContainer)
				nb += this.sub_columns[i].getNbFinalColumns();
			else
				nb++;
		}
		return nb;
	};
	this.getFinalColumns = function() {
		var list = [];
		for (var i = 0; i < this.sub_columns.length; ++i) {
			if (this.sub_columns[i] instanceof GridColumnContainer) {
				var sub_list = this.sub_columns[i].getFinalColumns();
				for (var j = 0; j < sub_list.length; ++j) list.push(sub_list[j]);
			} else
				list.push(this.sub_columns[i]);
		}
		return list;
	};
	this.addSubColumn = function(final_col, index) {
		if (typeof index == 'undefined' || index >= this.sub_columns.length)
			this.sub_columns.push(final_col);
		else
			this.sub_columns.splice(index,0,final_col);
		this._updateLevels();
		this.grid._subColumnAdded(this, final_col);
	};
}

function GridColumn(id, title, width, align, field_type, editable, onchanged, onunchanged, field_args, attached_data) {
	// check parameters
	if (!id) id = generateID();
	if (!field_type) field_type = "field_text";
	if (!field_args) field_args = {};
	// put values in the object
	this.id = id;
	this.title = title;
	this.text_title = null;
	this.width = width;
	this.align = align ? align : "left";
	this.field_type = field_type;
	this._loaded = false;
	this.onloaded = new Custom_Event();
	var t=this;
	require([["typed_field.js",field_type+".js"]], function() { t._loaded = true; t.onloaded.fire(); });
	this.editable = editable;
	this.onchanged = onchanged;
	this.onunchanged = onunchanged;
	this.field_args = field_args;
	this.attached_data = attached_data;
	// init
	this.th = document.createElement('TH');
	this.th.rowSpan = 1;
	this.th.col = this;
	window.to_cleanup.push(this);
	this.cleanup = function() {
		this.th.col = null;
		this.th = null;
		this.attached_data = null;
		this.grid = null;
		for (var i = 0; i < this.actions.length; ++i)
			if (this.actions[i].element) {
				this.actions[i].element.data = null;
				this.actions[i].element = null;
			}
		this.actions = null;
	};
	this.col = document.createElement('COL');
	if (this.width) {
		this.col.style.width = this.width+"px";
		this.col.style.minWidth = this.width+"px";
	}
	this.onclick = new Custom_Event();
	this.actions = [];
	
	this.toggleEditable = function() {
		this.editable = !this.editable;
		var index = this.grid.columns.indexOf(this);
		if (this.grid.selectable) index++;
		for (var i = 0; i < this.grid.table.childNodes.length; ++i) {
			var row = this.grid.table.childNodes[i];
			if (index >= row.childNodes.length) continue;
			var td = row.childNodes[index];
			if (td.field)
				td.field.setEditable(this.editable);
		}
		this._refresh_title();
	};
	
	this.setId = function(id) {
		for (var i = 0; i < this.grid.table.childNodes.length; ++i) {
			var tr = this.grid.table.childNodes[i];
			// change in row_data
			if (tr.row_data)
				for (var j = 0; j < tr.row_data.length; ++j)
					if (tr.row_data[j].col_id == this.id) { tr.row_data[j].col_id = id; break; }
			// change in td
			for (var j = 0; j < tr.childNodes.length; ++j)
				if (tr.childNodes[j].col_id == this.id) { tr.childNodes[j].col_id = id; break; }
		}
		this.id = id;
	};
	
	this.addAction = function(action) {
		this.actions.push(action);
		this._refresh_title();
	};
	this.removeAction = function(action) {
		this.actions.remove(action);
		this._refresh_title();
	};
	this.getAction = function(id) {
		for (var i = 0; i < this.actions.length; ++i)
			if (this.actions[i].id == id) return this.actions[i];
		return null;
	};

	this.addSorting = function(sort_function) {
		if (!sort_function) {
			var t=this;
			require([["typed_field.js",field_type+".js"]], function() {
				if (!window[field_type].prototype.compare) return;
				t.addSorting(window[field_type].prototype.compare);
			});
			return;
		}
		if (!this.sort_order)
			this.sort_order = 3; // not sorted
		this.sort_function = sort_function;
		var t=this;
		this.onclick.add_listener(function(){
			var new_sort = t.sort_order == 1 ? 2 : 1;
			t._onsort(new_sort);
		});
		this._refresh_title();
	};
	this.addExternalSorting = function(handler) {
		if (!this.sort_order)
			this.sort_order = 3; // not sorted
		this.sort_handler = handler;
		this.onclick.add_listener(function(){
			var new_sort = t.sort_order == 1 ? 2 : 1;
			t._onsort(new_sort);
		});
	};
	this.sort = function(asc) {
		if (!this.sort_function && !this.sort_handler) {
			var t=this;
			setTimeout(function(){t.sort(asc);},25);
			return;
		};
		this._onsort(asc ? 1 : 2);
	};
	
	this.addFiltering = function() {
		var url = get_script_path("grid.js");
		var t=this;
		var a = new GridColumnAction('filter', url+"/filter.gif",function(ev,a,col){
			if (t.filtered) {
				t.filtered = false;
				a.icon = url+"/filter.gif";
				t._refresh_title();
				t.grid.apply_filters();
			} else {
				if (t.grid.table.childNodes.length == 0) return;
				require("context_menu.js", function() {
					var values = [];
					var index = 0;
					var ptr = t.th;
					while (ptr.previousSibling) { index++; ptr = ptr.previousSibling; };
					for (var i = 0; i < t.grid.table.childNodes.length; ++i) {
						var row = t.grid.table.childNodes[i];
						if (row.style.visibility == "hidden") continue;
						var cell = row.childNodes[index];
						var value = cell.field.getCurrentData();
						var found = false;
						for (var j = 0; j < values.length; ++j)
							if (values[j] == value) { found = true; break; }
						if (!found) values.push(value);
					}
					var menu = new context_menu();
					var checkboxes = [];
					for (var i = 0; i < values.length; ++i) {
						var item = document.createElement("DIV");
						var cb = document.createElement("INPUT");
						cb.type = 'checkbox';
						cb.checked = 'checked';
						item.appendChild(cb);
						checkboxes.push(cb);
						t.grid._create_field(t.field_type, false, null, null, t.field_args, item, values[i], function(input) {
							input.disabled = 'disabled';
						});
						item.style.paddingRight = "2px";
						menu.addItem(item);
						item.onclick = null;
					}
					menu.removeOnClose = true;
					menu.onclose = function() {
						t.filtered = true;
						a.icon = url+"/remove_filter.gif";
						t._refresh_title();
						t.filter_values = [];
						for (var i = 0; i < checkboxes.length; ++i)
							if (checkboxes[i].checked)
								t.filter_values.push(values[i]);
						if (t.filter_values.length == checkboxes.length) {
							t.filter_values = null;
							t.filtered = false;
							a.icon = url+"/filter.gif";
							t._refresh_title();
						}
						t.grid.apply_filters();
					};
					menu.showBelowElement(a.element);
				});
			}
			stopEventPropagation(ev);
			return false;
		});
		this.addAction(a);
	};
	
	this._refresh_title = function() {
		var url = get_script_path("grid.js");
		var t=this;
		this.th.removeAllChildren();
		this.th.style.textAlign = this.align;
		if (title instanceof Element)
			this.th.appendChild(title);
		else
			this.th.innerHTML = title;
		this.span_actions = document.createElement("DIV");
		this.span_actions.style.whiteSpace = 'nowrap';
		//if (this.align == "right")
		//	this.th.insertBefore(span, this.th.childNodes[0]);
		//else
			this.th.appendChild(this.span_actions);
		var create_action_image = function(url, info, onclick) {
			var img = document.createElement("IMG");
			img.src = url;
			img.style.verticalAlign = "middle";
			img.style.cursor = "pointer";
			if (info) tooltip(img, info);
			img.onclick = onclick;
			img.style.marginLeft = "1px";
			img.style.marginRight = "1px";
			setOpacity(img, 0.65);
			listenEvent(img, 'mouseover', function() { setOpacity(img, 1); });
			listenEvent(img, 'mouseout', function() { setOpacity(img, 0.65); });
			return img;
		};
		if (this.sort_order) {
			switch (this.sort_order) {
			case 1: // ascending
				this.span_actions.appendChild(create_action_image(
					url+"/arrow_up_10.gif",
					"Sort by descending order (currently ascending)",
					function() { t._onsort(2); }
				));
				break;
			case 2: // descending
				this.span_actions.appendChild(create_action_image(
					url+"/arrow_down_10.gif",
					"Sort by ascending order (currently descending)",
					function() { t._onsort(1); }
				));
				break;
			case 3: // not sorted yet
				this.span_actions.appendChild(create_action_image(
					url+"/arrow_up_10.gif",
					"Sort by ascending order",
					function() { t._onsort(1); }
				));
				this.span_actions.appendChild(create_action_image(
					url+"/arrow_down_10.gif",
					"Sort by descending order",
					function() { t._onsort(2); }
				));
				break;
			}
		}
		for (var i = 0; i < this.actions.length; ++i) {
			var img = create_action_image(
				this.actions[i].icon,
				this.actions[i].tooltip,
				function(ev) { this.data.onclick(ev, this.data, t); }
			);
			img.data = this.actions[i];
			this.actions[i].element = img;
			this.span_actions.appendChild(img);
			img.ondomremoved(function(img) { img.data.element = null; img.data = null; });
		}
		layout.invalidate(this.th);
	};
	this._onsort = function(sort_order) {
		// cancel sorting of other columns
		for (var i = 0; i < this.grid.columns.length; ++i) {
			var col = this.grid.columns[i];
			if (col == this) continue;
			if (col.sort_order) {
				col.sort_order = 3;
				col._refresh_title();
			}
		}
		if (this.sort_function) {
			// get all rows
			var rows = [];
			for (var i = 0; i < this.grid.table.childNodes.length; ++i)
				rows.push(this.grid.table.childNodes[i]);
			// call sort function
			var t=this;
			var col_index = t.grid.columns.indexOf(t);
			if (t.grid.selectable) col_index++;
			rows.sort(function(r1,r2){
				var f1 = r1.childNodes[col_index].field;
				var f2 = r2.childNodes[col_index].field;
				var v1 = f1.getCurrentData();
				var v2 = f2.getCurrentData();
				var res = t.sort_function(v1,v2);
				if (sort_order == 2) res = -res;
				return res;
			});
			// order rows
			for (var i = 0; i < rows.length; ++i) {
				if (this.grid.table.childNodes[i] == rows[i]) continue;
				this.grid.table.insertBefore(rows[i], this.grid.table.childNodes[i]);
			}
		} else
			this.sort_handler(sort_order);
		
		this.sort_order = sort_order;
		this._refresh_title();
	};
}

function grid(element) {
	if (typeof element == 'string') element = document.getElementById(element);
	var t = this;
	window.to_cleanup.push(t);
	t.cleanup = function() {
		t.element = null;
		t.columns = null;
		t.table = null;
		t.thead = null;
		t.grid_element = null;
		t.header_rows = null;
		t.colgroup = null;
	};
	t.element = element;
	t.columns = [];
	t.selectable = false;
	t.selectable_unique = false;
	t.url = get_script_path("grid.js");
	t.onrowselectionchange = null;
	t.oncellcreated = new Custom_Event();
	t.onrowfocus = new Custom_Event();
	
	t.onallrowsready = function(listener) {
		if (t._columns_loading == 0 && t._cells_loading == 0) {
			listener();
			return;
		}
		
		t._loaded_listeners.push(listener);
	};
	t.addColumnContainer = function(column_container, index) {
		// if more levels, we add new rows in the header
		while (t.header_rows.length < column_container.levels)
			t._addHeaderLevel();
		// if less levels, set the rowSpan of first level
		if (column_container.levels < t.header_rows.length)
			column_container.th.rowSpan = t.header_rows.length-column_container.levels+1;
		t._addColumnContainer(column_container, 0, index);
	};
	t._addHeaderLevel = function() {
		// new level needed
		// apppend a TR
		var tr = document.createElement("TR");
		t.header_rows.push(tr);
		t.header_rows[0].parentNode.appendChild(tr);
		// increase rowSpan of first row
		for (var i = 0; i < t.header_rows[0].childNodes.length; i++)
			t.header_rows[0].childNodes[i].rowSpan++;
		layout.invalidate(t.element);
	};
	t._addColumnContainer = function(container, level, index) {
		container.grid = this;
		// insert the container TH
		if (typeof index != 'undefined') {
			// calculate the real index in the TR for the header
			var i = index;
			var tr_index = t.selectable ? 1 : 0;
			while (i > 0) {
				i -= t.header_rows[level].childNodes[tr_index].colSpan;
				tr_index++;
			}
			if (tr_index < t.header_rows[level].childNodes.length)
				t.header_rows[level].insertBefore(container.th, t.header_rows[level].childNodes[tr_index]);
			else
				t.header_rows[level].appendChild(container.th);
		} else
			t.header_rows[level].appendChild(container.th);
		// continue insertion
		for (var i = 0; i < container.sub_columns.length; ++i) {
			if (container.sub_columns[i] instanceof GridColumnContainer) {
				index = t._addColumnContainer(container.sub_columns[i], level+1, index);
			} else {
				t._addFinalColumn(container.sub_columns[i], level+1, index);
				if (typeof index != 'undefined') index++;
			}
		}
		layout.invalidate(t.element);
		return index;
	};
	t._addFinalColumn = function(col, level, index) {
		if (typeof index != 'undefined') {
			if (index < 0) index = undefined;
			else if (index >= t.columns.length) index = undefined;
		}
		col.grid = this;
		if (typeof index == 'undefined') {
			t.columns.push(col);
			t.colgroup.appendChild(col.col);
			t.header_rows[level].appendChild(col.th);
		} else {
			t.columns.splice(index,0,col);
			t.colgroup.insertBefore(col.col, t.colgroup.childNodes[t.selectable ? index +1 : index]);
			// need to calculate the real index inside the container
			var index_in_container = index;
			var i;
			for (i = level == 0 && t.selectable ? 1 : 0; i < t.header_rows[level].childNodes.length && index_in_container > 0; ++i) {
				var th = t.header_rows[level].childNodes[i];
				if (th.col instanceof GridColumnContainer) index_in_container -= th.col.getNbFinalColumns();
				else index_in_container--;
			}
			if (i >= t.header_rows[level].childNodes.length)
				t.header_rows[level].appendChild(col.th);
			else
				t.header_rows[level].insertBefore(col.th, t.header_rows[level].childNodes[i]);
		}
		if (level > 0) {
			if (col.parent_column.sub_columns.length > 1) {
				for (var i = 0; i < col.parent_column.sub_columns.length; ++i) {
					if (i == 0) addClassName(col.parent_column.sub_columns[i].th, "first_in_container");
					else removeClassName(col.parent_column.sub_columns[i].th, "first_in_container");
					if (i == col.parent_column.sub_columns.length-1) addClassName(col.parent_column.sub_columns[i].th, "last_in_container");
					else removeClassName(col.parent_column.sub_columns[i].th, "last_in_container");
				}
			}
		}
		col._refresh_title();
		if (!col.loaded) {
			t._columns_loading++;
			col.onloaded.add_listener(function() { t._columns_loading--; t._check_loaded(); });
		}
		// add cells
		for (var i = 0; i < t.table.childNodes.length; ++i) {
			var tr = t.table.childNodes[i];
			if (tr.title_row)
				tr.childNodes[0].colSpan++;
			else {
				var td = document.createElement("TD");
				td.col_id = col.id;
				var col_index = index + (t.selectable ? 1 : 0);
				if (col_index >= tr.childNodes.length)
					tr.appendChild(td);
				else
					tr.insertBefore(td, tr.childNodes[col_index]);
				var data = null;
				for (var k = 0; k < tr.row_data.length; ++k)
					if (col.id == tr.row_data[k].col_id) { data = tr.row_data[k].data; break; }
				t._create_cell(col, data, td, function(field){
					field.onfocus.add_listener(function() { t.onrowfocus.fire(tr); });
				});
				td.ondomremoved(function(td) { td.field = null; });
			}
		}
		if (level > 0) {
			if (col.parent_column.sub_columns.length > 1) {
				var ids = [];
				for (var i = 0; i < col.parent_column.sub_columns.length; ++i) ids.push(col.parent_column.sub_columns[i].id);
				for (var i = 0; i < t.table.childNodes.length; ++i) {
					var tr = t.table.childNodes[i];
					for (var j = 0; j < tr.childNodes.length; ++j) {
						var td = tr.childNodes[j];
						if (td.col_id == col.parent_column.sub_columns[0].id) addClassName(td, "first_in_container");
						else if (ids.contains(td.col_id)) removeClassName(td, "first_in_container");
						if (td.col_id == col.parent_column.sub_columns[col.parent_column.sub_columns.length-1].id) addClassName(td, "last_in_container");
						else if (ids.contains(td.col_id)) removeClassName(td, "last_in_container");
					}
				}
			}
		}
		layout.invalidate(this.element);
	};
	t._subColumnAdded = function(container, final_col) {
		// get the top level
		var top_container = container;
		while (top_container.parent_column) top_container = top_container.parent_column;

		// if more levels, we add new rows in the header
		while (t.header_rows.length < top_container.levels)
			t._addHeaderLevel();
		// decrease the rowSpan of parents if needed
		var total_rowSpan = 0;
		var p = container;
		while (p) { total_rowSpan += p.th.rowSpan; p = p.parent_column; }
		p = container;
		while (p && total_rowSpan > t.header_rows.length-1) {
			if (p.rowSpan > 1) {
				total_rowSpan -= p.rowSpan-1;
				p.rowSpan = 1;
			}
			p = p.parent_column;
		}
		// finally, add the final column
		var list = container.getFinalColumns();
		var first_index = this.getColumnIndex(final_col == list[0] ? list[1] : list[0]);
		var level;
		for (level = 0; level < t.header_rows.length-1; level++) {
			if (t.header_rows[level] == container.th.parentNode) break;
		}
		t._addFinalColumn(final_col, level+1, first_index+list.indexOf(final_col));
	};
	
	t.addColumn = function(column, index) {
		column.th.rowSpan = t.header_rows.length;
		t._addFinalColumn(column,0, index);
	};
	t.getNbColumns = function() { return t.columns.length; };
	t.getColumn = function(index) { return t.columns[index]; };
	t.getColumnById = function(id) {
		for (var i = 0; i < t.columns.length; ++i)
			if (t.columns[i].id == id)
				return t.columns[i];
		return null;
	};
	t.getColumnByAttachedData = function(data) {
		for (var i = 0; i < t.columns.length; ++i)
			if (t.columns[i].attached_data == data)
				return t.columns[i];
		return null;
	};
	t.getColumnContainerByAttachedData = function(data) {
		for (var i = 0; i < t.columns.length; ++i)
			if (t.columns[i].parent_column) {
				var c = t._getColumnContainerByAttachedData(t.columns[i].parent_column, data);
				if (c) return c;
			}
		return null;
	};
	t._getColumnContainerByAttachedData = function(container, data) {
		if (container.attached_data == data) return container;
		if (!container.parent_column) return null;
		return t._getColumnContainerByAttachedData(container.parent_column, data);
	};
	t.getColumnIndex = function(col) { return t.columns.indexOf(col); };
	t.getColumnIndexById = function(col_id) {
		for (var i = 0; i < t.columns.length; ++i)
			if (t.columns[i].id == col_id)
				return i;
		return -1;
	};
	t.removeColumn = function(index) {
		var col = t.columns[index];
		t.columns.splice(index,1);
		t.colgroup.removeChild(col.col);
		var td_index = index + (t.selectable ? 1 : 0);
		for (var i = 0; i < t.table.childNodes.length; ++i) {
			var row = t.table.childNodes[i];
			if (row.title_row)
				row.childNodes[0].colSpan--;
			else
				row.removeChild(row.childNodes[td_index]);
			if (row.row_data)
				for (var j = 0; j < row.row_data.length; ++j)
					if (row.row_data[j].col_id == col.id) {
						row.row_data.splice(j,1);
						break;
					}
		}
		if (!col.parent_column)
			t.header_rows[0].removeChild(col.th);
		else {
			// decrease colSpan for parents
			var p = col.parent_column;
			while (p) {
				p.th.colSpan--;
				p = p.parent_column;
			}
			// remove from parent
			var p = col.parent_column;
			var c = col;
			while (p) {
				p.sub_columns.remove(c);
				c.th.parentNode.removeChild(c.th);
				if (p.sub_columns.length > 0) {
					// still something
					if (p.sub_columns.length == 1) {
						var last_col = p.sub_columns[0];
						for (var i = 0; i < t.table.childNodes.length; ++i) {
							var tr = t.table.childNodes[i];
							for (var j = 0; j < tr.childNodes.length; ++j) {
								var td = tr.childNodes[j];
								if (td.col_id == last_col.id) {
									removeClassName(td, "last_in_container");
									removeClassName(td, "first_in_container");
									break;
								}
							}
						}
					} else {
						var ids = [];
						for (var i = 0; i < col.parent_column.sub_columns.length; ++i) ids.push(col.parent_column.sub_columns[i].id);
						for (var i = 0; i < t.table.childNodes.length; ++i) {
							var tr = t.table.childNodes[i];
							for (var j = 0; j < tr.childNodes.length; ++j) {
								var td = tr.childNodes[j];
								if (td.col_id == col.parent_column.sub_columns[0].id) addClassName(td, "first_in_container");
								else if (ids.contains(td.col_id)) removeClassName(td, "first_in_container");
								if (td.col_id == col.parent_column.sub_columns[col.parent_column.sub_columns.length-1].id) addClassName(td, "last_in_container");
								else if (ids.contains(td.col_id)) removeClassName(td, "last_in_container");
							}
						}
					}
					break;
				}
				// no more sub column -> remove it
				p.th.parentNode.removeChild(p.th);
				p = p.parent_column;
				c = p;
			}
		}
		t.apply_filters();
		layout.invalidate(this.element);
	};
	t.rebuildColumn = function(column) {
		column._refresh_title();
		var index = t.columns.indexOf(column);
		if (t.selectable) index++;
		for (var i = 0; i < t.table.childNodes.length; ++i) {
			var row = t.table.childNodes[i];
			var td = row.childNodes[index];
			if (td.field) {
				var data = td.field.getCurrentData();
				td.removeAllChildren();
				t._create_cell(column, data, td, function(field){
					field.onfocus.add_listener(function() { t.onrowfocus.fire(row); });
				});
				td.style.textAlign = column.align;
			}
		}
	};
	
	t.setSelectable = function(selectable, unique) {
		if (!unique) unique = false;
		if (t.selectable == selectable && t.selectable_unique == unique) return;
		if ((t.selectable && !selectable) || (t.selectable && selectable && unique != t.selectable_unique)) {
			if (t.header_rows[0].childNodes.length > 0) {
				t.header_rows[0].removeChild(t.header_rows[0].childNodes[0]);
				t.colgroup.removeChild(t.colgroup.childNodes[0]);
				for (var i = 0; i < t.table.childNodes.length; ++i)
					t.table.childNodes[i].removeChild(t.table.childNodes[i].childNodes[0]);
			}
		}
		t.selectable = selectable;
		t.selectable_unique = unique;
		if (selectable) {
			var th = document.createElement('TH');
			th.style.textAlign = "left";
			if (!unique) {
				var cb = document.createElement("INPUT");
				cb.type = 'checkbox';
				cb.onchange = function() { if (this.checked) t.selectAll(); else t.unselectAll(); };
				th.appendChild(cb);
			}
			var col = document.createElement('COL');
			//col.width = 20;
			col.style.width ='20px';
			if (t.header_rows[0].childNodes.length == 0) {
				t.header_rows[0].appendChild(th);
				t.colgroup.appendChild(col);
			} else {
				t.header_rows[0].insertBefore(th, t.header_rows[0].childNodes[0]);
				t.colgroup.insertBefore(col, t.colgroup.childNodes[0]);
			}
			th.rowSpan = t.header_rows.length;
			for (var i = 0; i < t.table.childNodes.length; ++i)
				t.table.childNodes[i].insertBefore(t._createSelectionTD(), t.table.childNodes[i].childNodes[0]);
		}
		layout.invalidate(this.table);
	};
	t.selectAll = function() {
		if (!t.selectable) return;
		for (var i = 0; i < t.table.childNodes.length; ++i) {
			var tr = t.table.childNodes[i];
			if (tr.style.visibility == "hidden") continue; // do not select filtered/hidden
			if (tr.className == "title_row") continue;
			var td = tr.childNodes[0];
			var cb = td.childNodes[0];
			if (cb.disabled) continue; //do not select if the checkbox is disabled
			cb.checked = 'checked';
			cb.onchange();
		}
		t._selection_changed();
	};
	t.unselectAll = function() {
		if (!t.selectable) return;
		for (var i = 0; i < t.table.childNodes.length; ++i) {
			var tr = t.table.childNodes[i];
			var td = tr.childNodes[0];
			var cb = td.childNodes[0];
			if (cb.disabled) continue; //do not unselect if the checkbox is disabled
			cb.checked = '';
			if (cb.onchange) cb.onchange();
		}
		t._selection_changed();
	};
	t._selection_changed = function() {
		if (t.onselect) {
			t.onselect(t.getSelectionByIndexes(), t.getSelectionByRowId());
		}
	};
	t.onselect = null;
	t.getSelectionByIndexes = function() {
		var selection = [];
		for (var i = 0; i < t.table.childNodes.length; ++i) {
			var tr = t.table.childNodes[i];
			var td = tr.childNodes[0];
			var cb = td.childNodes[0];
			if (cb.checked)
				selection.push(i);
		}
		return selection;
	};
	t.getSelectionByRowId = function() {
		var selection = [];
		for (var i = 0; i < t.table.childNodes.length; ++i) {
			var tr = t.table.childNodes[i];
			var td = tr.childNodes[0];
			var cb = td.childNodes[0];
			if (cb.checked)
				selection.push(tr.row_id);
		}
		return selection;
	};
	t.isSelected = function(index) {
		if (!t.selectable) return false;
		var tr = t.table.childNodes[index];
		var td = tr.childNodes[0];
		var cb = td.childNodes[0];
		return cb.checked;
	};
	t.selectByIndex = function(index, selected) {
		if (!t.selectable) return;
		if (t.selectable_unique && selected) {
			for (var i = 0; i < t.table.childNodes.length; i++) {
				var tr = t.table.childNodes[i];
				var td = tr.childNodes[0];
				var cb = td.childNodes[0];
				if ((tr.className == 'selected') != (i==index)) {
					if (t.onrowselectionchange)
						t.onrowselectionchange(tr.row_id, i==index);
					cb.checked = i==index ? 'checked' : '';
					tr.className = i==index ? "selected" : "";
				}
			}
		} else {
			var tr = t.table.childNodes[index];
			var td = tr.childNodes[0];
			var cb = td.childNodes[0];
			if (cb.checked != selected) {
				cb.checked = selected ? 'checked' : '';
				tr.className = selected ? "selected" : "";
				if (t.onrowselectionchange)
					t.onrowselectionchange(tr.row_id, selected);
			}
		}
	};
	t.disableByIndex = function(index, disabled){
		if(!t.selectable) return;
		var tr = t.table.childNodes[index];
		var td = tr.childNodes[0];
		var cb = td.childNodes[0];
		cb.disabled = disabled;
	};
	t.selectByRowId = function(row_id, selected) {
		if (!t.selectable) return;
		for (var i = 0; i < t.table.childNodes.length; ++i) {
			var tr = t.table.childNodes[i];
			if (tr.row_id != row_id && (!t.selectable_unique || !selected)) continue;
			var td = tr.childNodes[0];
			var cb = td.childNodes[0];
			if (t.selectable_unique && tr.row_id != row_id) {
				if (tr.className == 'selected') {
					cb.checked = "";
					tr.className = "";
					if (t.onrowselectionchange)
						t.onrowselectionchange(tr.row_id, false);
				}
			} else {
				if (cb.checked != selected) {
					cb.checked = selected ? 'checked' : '';
					tr.className = selected ? "selected" : "";
					if (t.onrowselectionchange)
						t.onrowselectionchange(tr.row_id, selected);
				}
			}
		}
	};
	
	t.makeScrollable = function() {
		var update = function() {
			// put back the thead, so we can get the width of every th
			t.element.style.paddingTop = "0px";
			t.element.style.position = "static";
			t.grid_element.style.overflow = "auto";
			t.thead.style.position = "static";
			t.element.style.width = "";
			var footer = null;
			for (var i = 0; i < t.table.parentNode.childNodes.length; ++i)
				if (t.table.parentNode.childNodes[i].nodeName == "TFOOT") { footer = t.table.parentNode.childNodes[i]; break; }
			if (footer && footer.childNodes.length > 0 && footer.childNodes[0]._for_fixed) footer.removeChild(footer.childNodes[0]);
			// remove fixed width
			for (var i = 0; i < t.thead.childNodes.length; ++i)
				for (var j = 0; j < t.thead.childNodes[i].childNodes.length; ++j) {
					t.thead.childNodes[i].childNodes[j].style.width = "";
					t.thead.childNodes[i].childNodes[j].style.minWidth = "";
				}
			// put back original fixed col width
			for (var i = 0; i < t.colgroup.childNodes.length; ++i) {
				if (t.colgroup.childNodes[i]._width) {
					t.colgroup.childNodes[i].style.width = t.colgroup.childNodes[i]._width;
					t.colgroup.childNodes[i].style.minWidth = t.colgroup.childNodes[i]._width;
				} else {
					t.colgroup.childNodes[i].style.width = "";
					t.colgroup.childNodes[i].style.minWidth = "";
				}
			}
			// fix the size of the container
			var total_width = getWidth(t.element);
			setWidth(t.element, total_width-1);
			// take the width of each th
			for (var i = 0; i < t.thead.childNodes.length; ++i)
				for (var j = 0; j < t.thead.childNodes[i].childNodes.length; ++j)
					t.thead.childNodes[i].childNodes[j]._width = getWidth(t.thead.childNodes[i].childNodes[j]);
			setWidth(t.element, total_width);
			// take the width of each column
			var widths = [];
			if (t.selectable)
				widths.push(t.thead.childNodes[0].childNodes[0]._width);
			for (var i = 0; i < t.columns.length; ++i)
				widths.push(t.columns[i].th._width);
			// fix the width of each th
			for (var i = 0; i < t.thead.childNodes.length; ++i)
				for (var j = 0; j < t.thead.childNodes[i].childNodes.length; ++j) {
					setWidth(t.thead.childNodes[i].childNodes[j], t.thead.childNodes[i].childNodes[j]._width);
					t.thead.childNodes[i].childNodes[j].style.minWidth = t.thead.childNodes[i].childNodes[j].style.width;
				}
			// fix the width of each column
			var tr = document.createElement("TR");
			tr._for_fixed = true;
			tr.title_row = true;
			if (!footer) {
				footer = document.createElement("TFOOT");
				t.table.parentNode.appendChild(footer);
			}
			if (footer.childNodes.length > 0)
				footer.insertBefore(tr,footer.childNodes[0]);
			else
				footer.appendChild(tr);
			for (var i = 0; i < t.colgroup.childNodes.length; ++i) {
				if (t.colgroup.childNodes[i].style.width)
					 t.colgroup.childNodes[i]._width = t.colgroup.childNodes[i].style.width;
				t.colgroup.childNodes[i].style.width = widths[i]+"px";
				t.colgroup.childNodes[i].style.minWidth = widths[i]+"px";
				var td = document.createElement("TD");
				td.style.padding = "0px";
				var div = document.createElement("DIV");
				td.appendChild(div);
				tr.appendChild(td);
				setWidth(td, widths[i]);
				setWidth(div, widths[i]);
			}
			tr.style.height = "0px";
			// put the thead as relative
			t.element.style.paddingTop = t.thead.offsetHeight+"px";
			t.element.style.position = "relative";
			t.grid_element.style.overflow = "auto";
			t.thead.style.position = "absolute";
			t.thead.style.top = "0px";
			t.thead.style.left = (-t.grid_element.scrollLeft)+"px";
			setWidth(t.thead, t.grid_element.clientWidth+t.grid_element.scrollLeft); 
			t.thead.style.overflow = "hidden";
			//t.table.parentNode.style.marginRight = "1px";
		};
		t.element.style.display = "flex";
		t.element.style.flexDirection = "column";
		t.grid_element.style.flex = "1 1 auto";
		t.grid_element.onscroll = function(ev) {
			t.thead.style.left = (-t.grid_element.scrollLeft)+"px";
			setWidth(t.thead, t.grid_element.clientWidth+t.grid_element.scrollLeft); 
		};
		layout.addHandler(t.element, update);
	};

	/**
	 * Change the data in the grid.
	 * data is an array, each element representing an entry/row.
	 * Each entry is an object {row_id:xxx,row_data:[]} where the row_id can be used later to identify the row or to attach data to the row. 
	 * Each row_data element is an object {col_id:xxx,data_id:yyy,data:zzz} where the data is given to the typed field, col_id identifies the column and data_id can be used later to identify the data or to attach information to the data
	 */
	t.setData = function(data) {
		// empty table
		t.unselectAll();
		while (t.table.childNodes.length > 0) t.table.removeChild(t.table.childNodes[0]);
		// create rows
		for (var i = 0; i < data.length; ++i) {
			t.addRow(data[i].row_id, data[i].row_data);
		}
	};
	t.addRow = function(row_id, row_data) {
		var tr = document.createElement("TR");
		listenEvent(tr, 'click', function() { t.onrowfocus.fire(tr); });
		tr.row_id = row_id;
		tr.row_data = row_data;
		if (t.selectable)
			tr.appendChild(t._createSelectionTD());
		for (var j = 0; j < t.columns.length; ++j) {
			var td = document.createElement("TD");
			tr.appendChild(td);
			var data = null;
			for (var k = 0; k < row_data.length; ++k)
				if (t.columns[j].id == row_data[k].col_id) { data = row_data[k]; break; }
			if (data == null)
				data = {data_id:null,data:"No data found for this column"};
			td.col_id = t.columns[j].id;
			td.data_id = data.data_id;
			if (hasClassName(t.columns[j].th, "first_in_container"))
				addClassName(td, "first_in_container");
			else if (hasClassName(t.columns[j].th, "last_in_container"))
				addClassName(td, "last_in_container");
			td.style.textAlign = t.columns[j].align;
			if (typeof data.data != 'undefined')
				t._create_cell(t.columns[j], data.data, td, function(field){
					field.onfocus.add_listener(function() { t.onrowfocus.fire(tr); });
				});
			if (typeof data.css != 'undefined' && data.css)
				td.className = data.css;
			td.ondomremoved(function(td) { td.field = null; td.col_id = null; td.data_id = null; });
		}
		// check if sorted or not
		var sorted = false;
		for (var i = 0; i < t.columns.length; ++i)
			if (t.columns[i].sort_function && t.columns[i].sort_order != 3) {
				var new_data = null;
				for (var col = 0; col < row_data.length; ++col)
					if (row_data[col].col_id == t.columns[i].id) { new_data = row_data[col].data; break; }
				for (var row = 0; row < t.table.childNodes.length; ++row) {
					var rdata = t.table.childNodes[row].row_data;
					if (!rdata) continue;
					var data = null;
					for (var col = 0; col < rdata.length; ++col)
						if (rdata[col].col_id == t.columns[i].id) { data = rdata[col].data; break; }
					if (t.columns[i].sort_function(new_data, data) < 0) {
						sorted = true;
						t.table.insertBefore(tr, t.table.childNodes[row]);
						break;
					}
				}
				break;
			}
		if (!sorted)
			t.table.appendChild(tr);
		layout.invalidate(t.element);
		tr.ondomremoved(function(tr) { tr.row_data = null; });
		return tr;
	};
	t._createSelectionTD = function() {
		var td = document.createElement("TD");
		var cb = document.createElement("INPUT");
		if (t.selectable_unique) {
			cb.type = 'radio';
			if (!t.table.id) t.table.id = generateID();
			cb.name = t.table.id+'_selection';
		} else
			cb.type = 'checkbox';
		cb.style.marginTop = "0px";
		cb.style.marginBottom = "0px";
		cb.style.verticalAlign = "middle";
		cb.onchange = function(ev) {
			var tr = this.parentNode.parentNode;
			tr.className = this.checked ? "selected" : "";
			if (t.onrowselectionchange)
				t.onrowselectionchange(tr.row_id, this.checked);
			if (t.selectable_unique && this.checked) {
				for (var i = 0; i < t.table.childNodes.length; ++i)
					if (tr != t.table.childNodes[i] && t.table.childNodes[i].className == "selected") {
						t.table.childNodes[i].className = "";
						if (t.onrowselectionchange)
							t.onrowselectionchange(t.table.childNodes[i].row_id, false);
					}
			}
			t._selection_changed();
		};
		td.onclick = function(ev) {
			stopEventPropagation(ev, true);
		};
		td.appendChild(cb);
		return td;
	};
	
	t.addTitleRow = function(title, style) {
		var tr = document.createElement("TR");
		tr.title_row = true;
		tr.className = "title_row";
		var td = document.createElement("TD");
		tr.appendChild(td);
		td.colSpan = t.columns.length+(t.selectable ? 1 : 0);
		if (typeof title == 'string')
			td.appendChild(document.createTextNode(title));
		else
			td.appendChild(title);
		if (style)
			for (var name in style)
				td.style[name] = style[name];
		t.table.appendChild(tr);
		layout.invalidate(t.table);
		return tr;
	};
	
	t.getNbRows = function() {
		return t.table.childNodes.length;
	};
	t.getRow = function(index) {
		return t.table.childNodes[index];
	};
	t.getRowIndex = function(row) {
		for (var i = 0; i < t.table.childNodes.length; ++i)
			if (t.table.childNodes[i] == row) return i;
		return -1;
	};
	t.getRowFromID = function(id) {
		for (var i = 0; i < t.table.childNodes.length; ++i)
			if (t.table.childNodes[i].row_id == id) return t.table.childNodes[i];
		return null;
	};
	t.getRowIndexById = function(row_id) {
		for (var i = 0; i < t.table.childNodes.length; ++i)
			if (t.table.childNodes[i].row_id == row_id) return i;
		return -1;
	};
	t.getRowID = function(row) {
		if (row == null) return null;
		if (typeof row.row_id == 'undefined') return null;
		return row.row_id;
	};
	t.getRowIDFromIndex = function(row_index) {
		return t.getRowID(t.getRow(row_index));
	};
	
	t.removeRowIndex = function(index) {
		t.table.removeChild(t.table.childNodes[index]);
		layout.invalidate(this.table);
	};
	t.removeRow = function(row) {
		t.table.removeChild(row);
		layout.invalidate(this.table);
	};
	t.removeAllRows = function() {
		while (t.table.childNodes.length > 0)
			t.table.removeChild(t.table.childNodes[0]);
		layout.invalidate(this.table);
	};
	
	t.getCellContent = function(row,col) {
		if (t.selectable) col++;
		var tr = t.table.childNodes[row];
		var td = tr.childNodes[col];
		return td.childNodes[0];
	};
	t.getCellField = function(row_index,col_index) {
		if (t.selectable) col_index++;
		var tr = t.table.childNodes[row_index];
		if (!tr) return null;
		if (col_index >= tr.childNodes.length) return null;
		var td = tr.childNodes[col_index];
		return td && td.field ? td.field : null;
	};
	t.getCellFieldById = function(row_id,col_id) {
		return t.getCellField(t.getRowIndexById(row_id), t.getColumnIndexById(col_id));	
	};
	t.getCellData = function(row_id, col_id) {
		var f = t.getCellFieldById(row_id, col_id);
		if (!f) return null;
		return f.getCurrentData();
	};
	t.setCellData = function(row_id, col_id, data) {
		var f = t.getCellFieldById(row_id, col_id);
		if (!f) return;
		f.setData(data);
	};
	t.getCellDataId = function(row,col) {
		if (t.selectable) col++;
		var tr = t.table.childNodes[row];
		var td = tr.childNodes[col];
		return td.data_id;
	};
	t.setCellDataId = function(row,col,data_id) {
		if (t.selectable) col++;
		var tr = t.table.childNodes[row];
		var td = tr.childNodes[col];
		td.data_id = data_id;
	};
	
	t.getContainingRowIndex = function(element) {
		while (element && element != document.body) {
			if (element.nodeName == "TD" && element.col_id) {
				var tr = element.parentNode;
				for (var i = 0; i < t.table.childNodes.length; ++i)
					if (t.table.childNodes[i] == tr) return i;
			}
			element = element.parentNode;
		}
		return -1;
	};
	t.getContainingRow = function(element) {
		while (element && element != document.body) {
			if (element.nodeName == "TD" && element.col_id) {
				var tr = element.parentNode;
				for (var i = 0; i < t.table.childNodes.length; ++i)
					if (t.table.childNodes[i] == tr) return tr;
			}
			element = element.parentNode;
		}
		return null;
	};
	t.getContainingRowAndColIds = function(element) {
		while (element && element != document.body) {
			if (element.nodeName == "TD" && element.col_id) {
				var tr = element.parentNode;
				for (var i = 0; i < t.table.childNodes.length; ++i)
					if (t.table.childNodes[i] == tr) {
						return {col_id:element.col_id, row_id:tr.row_id};
					}
			}
			element = element.parentNode;
		}
		return null;
	};
	
	t.reset = function() {
		// remove data rows
		t.table.removeAllChildren();
		// remove columns
		for (var i = 1; i < t.header_rows.length; ++i)
			t.header_rows[i].parentNode.removeChild(t.header_rows[i]);
		while (t.header_rows[0].childNodes.length > 0) t.header_rows[0].removeChild(t.header_rows[0].childNodes[0]);		
		while (t.colgroup.childNodes.length > 0) t.colgroup.removeChild(t.colgroup.childNodes[0]);
		t.columns = [];
		t.setSelectable(!t.selectable);
		t.setSelectable(!t.selectable);
		layout.invalidate(this.table);
	};
	
	t.startLoading = function() {
		if (t._loading_hidder) return;
		if (!t.table) return;
		t._loading_hidder = new LoadingHidder(t.table);
		t._loading_hidder.setContent("<img src='"+theme.icons_16.loading+"' style='vertical-align:bottom'/> Loading data...");
	};
	t.endLoading = function() {
		if (!t._loading_hidder) return;
		t._loading_hidder.remove();
		t._loading_hidder = null;
	};
	
	t.apply_filters = function() {
		var selection_changed = false;
		for (var i = 0; i < t.table.childNodes.length; ++i) {
			var row = t.table.childNodes[i];
			var hidden = false;
			for (var j = 0; j < t.columns.length; ++j) {
				var col = t.columns[j];
				if (!col.filtered) continue;
				var cell = row.childNodes[j];
				var value = cell.field.getCurrentData();
				var found = false;
				for (var k = 0; k < col.filter_values.length; ++k)
					if (col.filter_values[k] == value) { found = true; break; }
				if (!found) { hidden = true; break; }
			}
			row.style.visibility = hidden ? "hidden" : "visible";
			row.style.position = hidden ? "absolute" : "static";
			row.style.top = "-10000px";
			// TODO color?
			// make sure it is not selected anymore
			if (t.selectable) {
				var td = row.childNodes[0];
				var cb = td.childNodes[0];
				if (cb.checked) {
					cb.checked = '';
					cb.onchange();
					selection_changed = true;
				}
			}
		}
		if (selection_changed)
			t._selection_changed();
	};
	
	t.print = function() {
		var container = document.createElement("DIV");
		var table = document.createElement("TABLE");
		table.className = "grid";
		container.appendChild(table);
		var thead = document.createElement("THEAD");
		table.appendChild(thead);
		var tr, td;
		for (var i = 0; i < t.header_rows.length; ++i) {
			thead.appendChild(tr = document.createElement("TR"));
			for (var j = 0; j < t.header_rows[i].childNodes.length; ++j) {
				var th = t.header_rows[i].childNodes[j];
				if (!th.col) continue;
				tr.appendChild(td = document.createElement("TH"));
				td.colSpan = th.colSpan;
				td.rowSpan = th.rowSpan;
				if (th.col.text_title)
					td.appendChild(document.createTextNode(th.col.text_title));
				else if (th.col.title instanceof Element)
					td.innerHTML = th.col.title.outerHTML;
				else
					td.innerHTML = th.col.title;
				td.style.textAlign = th.style.textAlign;
			}
		}
		var tbody = document.createElement("TBODY");
		table.appendChild(tbody);
		for (var i = 0; i < t.table.childNodes.length; ++i) {
			var ttr = t.table.childNodes[i];
			tbody.appendChild(tr = document.createElement("TR"));
			tr.className = ttr.className;
			for (var j = 0; j < ttr.childNodes.length; ++j) {
				if (j == 0 && t.selectable) continue;
				var cell = ttr.childNodes[j];
				tr.appendChild(td = document.createElement("TD"));
				td.className = cell.className;
				if (!cell.field) {
					td.innerHTML = cell.innerHTML;
					if (cell.style && cell.style.textAlign)
						td.style.textAlign = cell.style.textAlign;
				} else if (cell.col_id) {
					var col = t.getColumnById(cell.col_id);
					var f = new window[col.field_type](cell.field.getCurrentData(),false,col.field_args);
					td.appendChild(f.getHTMLElement());
					td.style.textAlign = col.align;
					f.fillWidth();
				}
			}
		}
		printContent(container);
	};
	
	/* --- internal functions --- */
	t._createTable = function() {
		t.grid_element = document.createElement("DIV");
		var table = document.createElement('TABLE');
		table.style.width = "100%";
		t.grid_element.appendChild(table);
		t.colgroup = document.createElement('COLGROUP');
		table.appendChild(t.colgroup);
		t.thead = document.createElement('THEAD');
		t.header_rows = [];
		t.header_rows.push(document.createElement('TR'));
		t.thead.appendChild(t.header_rows[0]);
		table.appendChild(t.thead);
		t.table = document.createElement('TBODY');
		table.appendChild(t.table);
		t.element.appendChild(t.grid_element);
		table.className = "grid";
	};
	t._create_cell = function(column, data, parent, ondone) {
		t._cells_loading++;
		t._create_field(column.field_type, column.editable, column.onchanged, column.onunchanged, column.field_args, parent, data, function(field) {
			parent.field = field;
			field.grid_column_id = column.id;
			if (ondone) ondone(field);
			t._cells_loading--;
			t._check_loaded();
			t.oncellcreated.fire({parent:parent,field:field,column:column,data:data});
			layout.invalidate(parent);
		});
	},
	t._create_field = function(field_type, editable, onchanged, onunchanged, field_args, parent, data, ondone) {
		require([["typed_field.js",field_type+".js"]], function() {
			var f = new window[field_type](data, editable, field_args);
			f.fillWidth();
			if (onchanged) f.ondatachanged.add_listener(onchanged);
			if (onunchanged) f.ondataunchanged.add_listener(onunchanged);
			parent.appendChild(f.getHTMLElement());
			ondone(f);
		});
	};
	
	t.exportData = function(format,filename,sheetname,excluded_columns) {
		if (!excluded_columns) excluded_columns = [];
		else for (var i = 0; i < excluded_columns.length; ++i) {
			excluded_columns[i] = t.getColumnById(excluded_columns[i]);
			if (excluded_columns[i] == null) {
				excluded_columns.splice(i,1);
				i--;
			}
		}
		var ex = {format:format,name:filename,sheets:[]};
		var sheet = {name:sheetname,rows:[]};
		ex.sheets.push(sheet);
		// headers
		for (var i = 0; i < t.header_rows.length; ++i) {
			var row = [];
			for (var j = 0; j < t.header_rows[i].childNodes.length; ++j) {
				var th = t.header_rows[i].childNodes[j];
				var excluded = false;
				for (var k = 0; k < excluded_columns.length; ++k) if (excluded_columns[k].th == th) { excluded = true; break; }
				var cell = {};
				if (excluded)
					cell.value = "";
				else {
					if (th.rowSpan && th.rowSpan > 1) cell.rowSpan = th.rowSpan;
					if (th.colSpan && th.colSpan > 1) cell.colSpan = th.colSpan;
					if (th.col && th.col.text_title)
						cell.value = th.col.text_title;
					else {
						if (th.col.span_actions)
							th.removeChild(th.col.span_actions);
						cell.value = th.innerHTML;
						if (th.col.span_actions)
							th.appendChild(th.col.span_actions);
					}
					cell.style = {fontWeight:'bold',textAlign:'center'};
				}
				row.push(cell);
			}
			sheet.rows.push(row);
		}
		// rows
		for (var i = 0; i < t.table.childNodes.length; ++i) {
			var row = [];
			for (var j = 0; j < t.table.childNodes[i].childNodes.length; ++j) {
				var cell = {};
				var excluded = false;
				if (!t.table.childNodes[i].title_row)
					for (var k = 0; k < excluded_columns.length; ++k) if (j < t.columns.length && excluded_columns[k].id == t.columns[j].id) { excluded = true; break; }
				if (excluded)
					cell.value = "";
				else {
					var td = t.table.childNodes[i].childNodes[j];
					if (td.rowSpan && td.rowSpan > 1) cell.rowSpan = td.rowSpan;
					if (td.colSpan && td.colSpan > 1) cell.colSpan = td.colSpan;
					if (td.field) td.field.exportCell(cell);
					else cell.value = td.innerHTML;
					if (!cell.style) cell.style = {};
					cell.style.textAlign = t.columns[j].align;
				}
				row.push(cell);
			}
			sheet.rows.push(row);
		}
		// export
		var form = document.createElement("FORM");
		var input = document.createElement("INPUT");
		form.appendChild(input);
		form.action = "/dynamic/lib_php_excel/service/create";
		form.method = 'POST';
		input.type = 'hidden';
		input.name = 'input';
		input.value = service.generateInput(ex);
		if (t._download_frame) document.body.removeChild(t._download_frame);
		var frame = document.createElement("IFRAME");
		frame.style.position = "absolute";
		frame.style.top = "-10000px";
		frame.style.visibility = "hidden";
		frame.name = "grid_download";
		document.body.appendChild(frame);
		form.target = "grid_download";
		document.body.appendChild(form);
		form.submit();
		t._download_frame = frame;
		window.top.status_manager.add_status(new window.top.StatusMessage(window.top.Status_TYPE_INFO,"Your file is being generated, and the download will start soon...",[{action:"close"}],5000));
	};

	t._columns_loading = 0;
	t._cells_loading = 0;
	t._loaded_listeners = [];
	t._check_loaded = function() {
		if (t._columns_loading == 0 && t._cells_loading == 0) {
			var list = t._loaded_listeners;
			t._loaded_listeners = [];
			for (var i = 0; i < list.length; ++i) list[i]();
		}
	};
	
	/* initialization */
	t._createTable();
}
