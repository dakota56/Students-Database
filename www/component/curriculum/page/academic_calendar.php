<?php 
class page_academic_calendar extends Page {
	
	public function get_required_rights() { return array("consult_curriculum"); }
	
	public function execute() {
		$this->require_javascript("vertical_layout.js");
		$this->onload("new vertical_layout('top_container');");
		$this->require_javascript("header_bar.js");
		$this->onload("new header_bar('header','toolbar');");
		$this->require_javascript("tree.js");
		require_once("component/curriculum/CurriculumJSON.inc");
?>
<div id='top_container'>
	<div id='header'>
		<button class='button_verysoft' onclick='new_year();'>New Academic Year</button>
	</div>
	<div id='tree_container' style='background-color:white;' layout='fill'></div>
</div>

<script type='text/javascript'>
var tr = new tree('tree_container');
tr.addColumn(new TreeColumn(""));
tr.addColumn(new TreeColumn(""));
tr.addColumn(new TreeColumn(""));
tr.addColumn(new TreeColumn(""));
tr.addColumn(new TreeColumn(""));

var past = createTreeItemSingleCell(null, "Past Years", false);
tr.addItem(past);
var current_and_future = createTreeItemSingleCell(null, "Current and future years", true);
tr.addItem(current_and_future);

function build_years(years) {
	for (var i = 0; i < years.length; ++i)
		build_year(years[i]);
}
function build_year(year) {
	var now = new Date();
	var span = document.createElement("SPAN");
	span.appendChild(document.createTextNode("Academic Year "));
	var text = document.createTextNode(year.name);
	span.appendChild(text);
	window.top.datamodel.registerCellText(window, "AcademicYear", "name", year.id, text);
	var parent = year.year < now.getFullYear() ? past : current_and_future;
	var item = createTreeItemSingleCell(null, span, true);
	parent.addItem(item);
	span.style.cursor = "pointer";
	span.onmouseover = function() { this.style.textDecoration = "underline"; };
	span.onmouseout = function() { this.style.textDecoration = "none"; };
	span.title = "Edit or Remove Academic Year "+year.name;
	span.onclick = function() {
		window.top.require("popup_window.js",function() {
			var popup = new window.top.popup_window("New Academic Year",null,"");
			var frame = popup.setContentFrame("/dynamic/curriculum/page/edit_academic_year?id="+year.id+"&onsave=saved");
			frame.saved = function() {
				popup.close();
				location.reload();
			};
			popup.show();
		});
	};
	item.academic_year = year;
	for (var i = 0; i < year.periods.length; ++i)
		build_period(item, year.periods[i]);
}
function build_period(parent, period) {
	var cells = [];

	var span = document.createElement("SPAN");
	span.appendChild(document.createTextNode("Period "));
	var text = document.createTextNode(period.name);
	span.appendChild(text);
	window.top.datamodel.registerCellText(window, "AcademicPeriod", "name", period.id, text);
	cells.push(new TreeCell(span));

	span = document.createElement("SPAN");
	span.innerHTML = "&nbsp;from ";
	text = document.createTextNode(period.start);
	span.appendChild(text);
	window.top.datamodel.registerCellText(window, "AcademicPeriod", "start", period.id, text);
	cells.push(new TreeCell(span));
	
	span = document.createElement("SPAN");
	span.innerHTML = "&nbsp;to ";
	text = document.createTextNode(period.end);
	span.appendChild(text);
	window.top.datamodel.registerCellText(window, "AcademicPeriod", "end", period.id, text);
	cells.push(new TreeCell(span));
	
	span = document.createElement("SPAN");
	span.innerHTML = "&nbsp;(";
	text = document.createTextNode(period.weeks);
	span.appendChild(text);
	window.top.datamodel.registerCellText(window, "AcademicPeriod", "weeks", period.id, text);
	span.appendChild(document.createTextNode(" weeks"));
	cells.push(new TreeCell(span));
	
	span = document.createElement("SPAN");
	span.innerHTML = "&nbsp;+ ";
	text = document.createTextNode(period.weeks_break);
	span.appendChild(text);
	window.top.datamodel.registerCellText(window, "AcademicPeriod", "weeks_break", period.id, text);
	span.appendChild(document.createTextNode(" weeks of break)"));
	cells.push(new TreeCell(span));
	
	var item = new TreeItem(cells);
	parent.addItem(item);
	item.tr.style.cursor = "pointer";
	item.tr.onmouseover = function() { this.style.textDecoration = "underline"; };
	item.tr.onmouseout = function() { this.style.textDecoration = "none"; };
	item.tr.title = "Edit or Remove Academic Year "+parent.academic_year.name;
	item.tr.onclick = function() {
		window.top.require("popup_window.js",function() {
			var popup = new window.top.popup_window("New Academic Year",null,"");
			var frame = popup.setContentFrame("/dynamic/curriculum/page/edit_academic_year?id="+period.year_id+"&onsave=saved");
			frame.saved = function() {
				popup.close();
				location.reload();
			};
			popup.show();
		});
	};
}
build_years(<?php echo CurriculumJSON::AcademicCalendarJSON();?>);

function new_year() {
	var year = new Date().getFullYear();
	if (current_and_future.children.length > 0)
		year = current_and_future.children[current_and_future.children.length-1].academic_year.year+1;
	window.top.require("popup_window.js",function() {
		var popup = new window.top.popup_window("New Academic Year",null,"");
		var frame = popup.setContentFrame("/dynamic/curriculum/page/edit_academic_year?year="+year+"&onsave=saved");
		frame.saved = function() {
			popup.close();
			location.reload();
		};
		popup.show();
	});
}
</script>
<?php 
	}
	
}
?>