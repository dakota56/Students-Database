<?php
require_once("/../selection_page.inc");
require_once("component/selection/SelectionJSON.inc");
class page_exam_center_main_page extends selection_page {
	
	public function get_required_rights() {return array("see_exam_center_detail");}
	
	public function execute_selection_page(&$page) {
		
		$page->add_javascript("/static/widgets/grid/grid.js");
		$page->add_javascript("/static/data_model/data_list.js");
		$page->onload("init_organizations_list();");
		$list_container_id = $page->generateID();
		$can_create = PNApplication::$instance->user_management->has_right("manage_exam_center",true);
		$status_container_id = $page->generateID();
		$ECIS_status_container_id = $page->generateID();
		$page->require_javascript("section.js");
		$page->onload("section_from_html('status_section');");
		$page->onload("section_from_html('status_ECIS_section');");
		$steps = PNApplication::$instance->selection->getSteps();
		if($steps["exam_center"]){			
			$page->require_javascript("exam_center_status.js");
			$page->onload("new exam_center_status('$status_container_id');");
		}
		$page->require_javascript("exam_center_and_informations_sessions_status.js");
		$page->onload("new exam_center_and_informations_sessions_status('".$ECIS_status_container_id."');");
		$page->require_javascript("horizontal_layout.js");
		$page->onload("new horizontal_layout('horizontal_split',true);");
		
		?>		<script type='text/javascript'>
					function onCreateNewCenter(button){
						require("context_menu.js",function(){
							var menu = new context_menu();
							var from_scratch = document.createElement("div");
							from_scratch.appendChild(document.createTextNode("Create a center from scratch"));
							from_scratch.className = "context_menu_item";
							from_scratch.onclick = function(){
								location.assign("/dynamic/selection/page/exam/center_profile");
							};
							menu.addItem(from_scratch);
							from_IS = document.createElement("div");
							from_IS.className = "context_menu_item";
							from_IS.appendChild(document.createTextNode("Create from an Information Session"));
							from_IS.onclick = function(){
								require("popup_window.js",function(){
									var pop = new popup_window("Link Exam Centers and Information Sessions","");
									pop.setContentFrame("/dynamic/selection/page/exam/convert_IS_into_center");
									pop.onclose = function(){ //Refresh in the case of any centers have been created
										location.reload();
									};
									pop.show();
								});
							};
							menu.addItem(from_IS);
							menu.showBelowElement(button);
						});
					}
				</script>
				<div id='horizontal_split'>
					<div style ="display:inline-block;">
						<div id='status_section' title='Exam Centers Status' collapsable='false' css='soft' style='margin:10px; width:360px;'>
							<div id = '<?php echo $status_container_id; ?>'>
							<?php 
							if(!$steps["exam_center"]){
							?>
							<div><i>There is no exam center yet</i><div class = "button" onclick = "onCreateNewCenter(this);" style = "margin-left:3px; margin-top:3px;">Create First</div></div>
							<?php
							}
							?>
							</div>
						</div>
						<div id='status_ECIS_section' title='Exam Centers and Information Sessions' collapsable='false' css='soft' style='margin:10px; width:360px;'>
							<div id = '<?php echo $ECIS_status_container_id;?>'></div>						
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
							'ExamCenter',
							['Exam Center.Name'],
							[],
							function (list) {
								list.addTitle("/static/selection/exam/exam_center_16.png", "Exam Centers");
								var new_EC = document.createElement("DIV");
								new_EC.className = 'button_verysoft';
								new_EC.innerHTML = "<img src='"+theme.build_icon("/static/selection/exam/exam_center_16.png",theme.icons_10.add)+"'/> New Exam Center";
								new_EC.onclick = function() {
									onCreateNewCenter(this);
								};
								list.addHeader(new_EC);
								list.makeRowsClickable(function(row){
									var ec_id = list.getTableKeyForRow('ExamCenter',row.row_id);
									location.href = "/dynamic/selection/page/exam/center_profile?id="+ec_id;
								});
							}
						);
					}
					
					
					
				</script>
		<?php 
	}
}