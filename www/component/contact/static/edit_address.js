if (typeof window.top.require != 'undefined') window.top.require("geography.js");if (typeof require != 'undefined') {	require("geographic_area_selection.js");	require("select.js");}/** * This javascript does not save / lock any data. When users update a field, the structure object is updated (with an additional field corresponding to the country code) * @param {Element} container where to display * @param {PostalAddress} address the address to edit */function edit_address(container, address){	if(typeof(container) == 'string') container = document.getElementById(container);	var t = this;	t.address = address;	/** Create the part containing the geographic area */	t._initArea = function() {		while (t.area_div.childNodes.length > 0) t.area_div.removeChild(t.area_div.childNodes[0]);		if (t.select_country.value == 0) return;		if (t._initializing_area) { t._reinit_area = true; return; }		t._initializing_area = true;		require("geographic_area_selection.js", function() {			var country_id = t.select_country.getSelectedValue();			new geographic_area_selection(t.area_div, country_id, function(area) {				if (t.address.geographic_area && t.address.geographic_area.id) {					area.setToReturn(t.address.geographic_area.id);					area.startFilter(t.address.geographic_area.id);				}				area.onchange = function() {					var a = area.getSelectedArea();					t.address.geographic_area = {id:a.id,text:a.text};				};				if (window.get_popup_window_from_element) {					var popup = window.get_popup_window_from_element(t.area_div);					if (popup != null) popup.resize();				}				t._initializing_area = false;				if (t._reinit_area) {					t._reinit_area = false;					t._initArea();				}			});		});	};		/** Create a table with a title 	 * @param {String} title the title	 * @param {Element} container where to put the table	 * @returns {Element} the cell where we can put the content	 */	t._createTable = function(title, container) {		var table = document.createElement("TABLE"); container.appendChild(table);		var thead = document.createElement("THEAD"); table.appendChild(thead);		var tbody = document.createElement("TBODY"); table.appendChild(tbody);		var tr = document.createElement("TR"); thead.appendChild(tr);		var td = document.createElement("TD"); tr.appendChild(td);		table.style.border = "1px solid #808080";		table.style.borderSpacing = "0";		table.style.marginBottom = "3px";		setBorderRadius(table, 5, 5, 5, 5, 5, 5, 5, 5);		td.style.textAlign = "center";		td.style.padding = "2px 5px 2px 5px";		td.innerHTML = title;		td.style.backgroundColor = "#F0F0F0";		td.style.borderBottom = "1px solid #808080";		setBorderRadius(td, 5, 5, 5, 5, 0, 0, 0, 0);		tr = document.createElement("TR"); tbody.appendChild(tr);		td = document.createElement("TD"); tr.appendChild(td);		td.style.padding = "0px";		return td;	};	/** Create the display */	t._init = function() {		var table, tr, td;		// table to split geographic area, and postal address		container.appendChild(table = document.createElement("TABLE"));		table.appendChild(tr = document.createElement("TR"));		tr.appendChild(td = document.createElement("TD"));		td.style.verticalAlign = "top";		var tbody = t._createTable("Geographic Area", td);		t.country_div = document.createElement("DIV");		t.country_div.style.borderBottom = "1px solid #808080";		t.country_div.style.padding = "2px";		tbody.appendChild(t.country_div);		t.area_div = document.createElement("DIV");		t.area_div.style.padding = "2px";		tbody.appendChild(t.area_div);		tr.appendChild(td = document.createElement("TD"));		td.style.verticalAlign = "top";		tbody = t._createTable("Postal Address", td);		t.postal_div = document.createElement("DIV");		t.postal_div.style.padding = "2px";		tbody.appendChild(t.postal_div);		/* Country */		t.country_div.appendChild(document.createTextNode("Country "));		require("select.js", function() {			t.select_country = new select(t.country_div);			t.select_country.getHTMLElement().style.verticalAlign = "bottom";			window.top.require("geography.js", function() {				window.top.geography.getCountries(function(countries) {					t.countries = countries;					for(var i = 0; i < countries.length; i++){						t.select_country.add(							countries[i].country_id,							"<img src='/static/geography/flags/"+countries[i].country_code+".png' style='vertical-align:bottom;padding-right:2px' />"+countries[i].country_name						);					}					if(!t.select_country.onchange && t.address.country_id == null)						t.address.country_id = t.select_country.getSelectedValue();											t.select_country.select(t.address.country_id);					t._initArea();					/* Set onchange after the initialization */					t.select_country.onchange = function(){						t.address.country_id = t.select_country.getSelectedValue();						t.address.geographic_area.id = null;						t.address.geographic_area.text = null;						t._initArea();					};				});			});		});				/* Building and Unit */		t.postal_div.appendChild(table = document.createElement("TABLE"));		table.style.borderCollapse = "collapse";		table.style.borderSpacing = "0";		table.appendChild(tr = document.createElement("TR"));		tr.appendChild(td = document.createElement("TD"));		td.style.color = "#808080";		td.style.fontStyle = "italic";		td.style.fontSize = "80%";		td.style.padding = "0px";		td.innerHTML = "Building";		tr.appendChild(td = document.createElement("TD"));		td.style.color = "#808080";		td.style.fontStyle = "italic";		td.style.fontSize = "80%";		td.style.padding = "0px";		td.innerHTML = "Unit";		table.appendChild(tr = document.createElement("TR"));		tr.appendChild(td = document.createElement("TD"));		td.style.padding = "0px";		td.appendChild(t.input_building = document.createElement("INPUT"));		t.input_building.type = 'text';		t.input_building.value = t.address.building;		t.input_building.onchange = function() { t.address.building = t.input_building.value; };		require("input_utils.js", function() { inputAutoresize(t.input_building, 10); });		tr.appendChild(td = document.createElement("TD"));		td.style.padding = "0px";		td.appendChild(t.input_unit = document.createElement("INPUT"));		t.input_unit.type = 'text';		t.input_unit.value = t.address.unit;		t.input_unit.onchange = function() { t.address.unit = t.input_unit.value; };		require("input_utils.js", function() { inputAutoresize(t.input_unit, 5); });				/* Street number and street name */		t.postal_div.appendChild(table = document.createElement("TABLE"));		table.style.borderCollapse = "collapse";		table.style.borderSpacing = "0";		table.appendChild(tr = document.createElement("TR"));		tr.appendChild(td = document.createElement("TD"));		td.style.color = "#808080";		td.style.fontStyle = "italic";		td.style.fontSize = "80%";		td.style.padding = "0px";		td.innerHTML = "Number";		tr.appendChild(td = document.createElement("TD"));		td.style.color = "#808080";		td.style.fontStyle = "italic";		td.style.fontSize = "80%";		td.style.padding = "0px";		td.innerHTML = "Street";		table.appendChild(tr = document.createElement("TR"));		tr.appendChild(td = document.createElement("TD"));		td.style.padding = "0px";		td.appendChild(t.input_street_number = document.createElement("INPUT"));		t.input_street_number.type = 'text';		t.input_street_number.value = t.address.street_number;		t.input_street_number.onchange = function() { t.address.street_number = t.input_street_number.value; };		require("input_utils.js", function() { inputAutoresize(t.input_street_number, 5); });		tr.appendChild(td = document.createElement("TD"));		td.style.padding = "0px";		td.appendChild(t.input_street_name = document.createElement("INPUT"));		t.input_street_name.type = 'text';		t.input_street_name.value = t.address.street;		t.input_street_name.onchange = function() { t.address.street = t.input_street_name.value; };		require("input_utils.js", function() { inputAutoresize(t.input_street_name, 10); });		/* Additional */		t.postal_div.appendChild(table = document.createElement("TABLE"));		table.style.borderCollapse = "collapse";		table.style.borderSpacing = "0";		table.appendChild(tr = document.createElement("TR"));		tr.appendChild(td = document.createElement("TD"));		td.style.color = "#808080";		td.style.fontStyle = "italic";		td.style.fontSize = "80%";		td.style.padding = "0px";		td.innerHTML = "Additional information";		table.appendChild(tr = document.createElement("TR"));		tr.appendChild(td = document.createElement("TD"));		td.style.padding = "0px";		td.appendChild(t.input_additional = document.createElement("INPUT"));		t.input_additional.type = 'text';		t.input_additional.value = t.address.additional;		t.input_additional.onchange = function() { t.address.additional = t.input_additional.value; };		require("input_utils.js", function() { inputAutoresize(t.input_additional, 15); });	};	t._init();}