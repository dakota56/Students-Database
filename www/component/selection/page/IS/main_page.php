<?php 
require_once("/../selection_page.inc");
class page_IS_main_page extends selection_page {
	public function get_required_rights() { return array("see_information_session_details"); }
	public function execute_selection_page(&$page){
		$page->add_javascript("/static/widgets/grid/grid.js");
		$page->add_javascript("/static/data_model/data_list.js");
		$page->onload("init_organizations_list();");
		$list_container_id = $page->generateID();
		$can_create = PNApplication::$instance->user_management->has_right("manage_information_session",true);
		$status_container_id = $page->generateID();
		$page->require_javascript("section.js");
		$page->onload("section_from_html('status_section');");
		$steps = PNApplication::$instance->selection->getSteps();
		if($steps["information_session"]){
			$page->onload("new IS_status('$status_container_id');");
			$page->require_javascript("IS_status.js");
		}
		$page->require_javascript("horizontal_layout.js");
		$page->onload("new horizontal_layout('horizontal_split',true);");
		
		?>
		<div id='horizontal_split'>
			<div id='status_section' title='Information Sessions Status' collapsable='false' css='soft' style='display:inline-block;margin:10px; width:340px;'>
				<div id = '<?php echo $status_container_id; ?>'>
				<?php 
				if(!$steps["information_session"]){
				?>
				<div><i>There is no information session yet</i><a class = "button"href = "/dynamic/selection/page/IS/profile" style = "margin-left:3px; margin-top:3px;">Create First</a></div>
				<?php
				}
				?>
				</div>
			</div>
			<div style="padding: 10px;display:inline-block" layout='fill'>
				<div id = '<?php echo $list_container_id; ?>' class="section soft">
				</div>
			</div>
		</div>
		
		<script type='text/javascript'>
			function init_organizations_list() {
				new data_list(
					'<?php echo $list_container_id;?>',
					'InformationSession',
					['Information Session.Name','Information Session.Date'],
					[],
					function (list) {
						list.addTitle("/static/selection/IS/IS_16.png", "Information Sessions");
						var new_IS = document.createElement("DIV");
						new_IS.className = 'button_verysoft';
						new_IS.innerHTML = "<img src='"+theme.build_icon("/static/selection/IS/IS_16.png",theme.icons_10.add)+"'/> New Information Session";
						new_IS.onclick = function() {
							location.assign("/dynamic/selection/page/IS/profile");
						};
						list.addHeader(new_IS);
						list.makeRowsClickable(function(row){
							var is_id = list.getTableKeyForRow('InformationSession',row.row_id);
							location.href = "/dynamic/selection/page/IS/profile?id="+is_id;
						});
					}
				);
			}
			
			
			
		</script>
	
	<?php		
	}
	
}