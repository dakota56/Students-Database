<?php 
class page_home extends Page {
	
	public function get_required_rights() { return array(); }
	
	public function execute() {
?>
TODO: home page<br/><br/>
<a href="/dynamic/contact/page/organizations?creator=Selection">Organizations for Selection</a><br/>
<a href="/dynamic/contact/page/organization_profile?organization=1">Organization profile</a><br/>
<a href="#" onclick="post_data('/dynamic/people/page/create_people',{types:['student'],icon:'/static/application/icon.php?main=/static/students/student_32.png&small='+theme.icons_16.add+'&where=right_bottom',title:'New Student',redirect:'/dynamic/application/page/home'});return false;">Create student</a><br/>
<a href="#" onclick="post_data('/dynamic/data_model/page/create_data',{root_table:'Student'});return false;">Create data</a><br/>
<a href="/dynamic/excel/page/test">Excel</a><br/>
<a href="/dynamic/selection/page/IS_profile">IS profile</a><br/>
<a href="/dynamic/selection/page/exam_subject">exam subject</a><br/>
<a href="/dynamic/students/page/import_students">import student</a><br/>
<a href="/dynamic/selection/page/custom_import_applicants">import applicants</a><br/>
<a href="/dynamic/selection/page/create_exam_subject">create exam</a><br/>
<a href="/dynamic/selection/page/import_exam_subject">Import exam</a><br/>
<!-- 
<a href="/dynamic/data_import/page/build_excel_import?import=create_template">Create Excel Import Template</a><br/>
<a href="#" onclick="post_data('/dynamic/data_model/page/create_data',{icon:'/static/application/icon.php?main=/static/students/student_32.png&small='+theme.icons_16.add+'&where=right_bottom',title:'Create new student',root_table:'Student'});return false;">Create a student</a><br/>
<a href="#" onclick="post_data('/dynamic/data_model/page/create_data',{icon:'/static/application/icon.php?main=/static/students/student_32.png&small='+theme.icons_16.add+'&where=right_bottom',title:'Create new people',root_table:'People'});return false;">Create a people</a><br/>
<a href="#" onclick="post_data('/dynamic/data_model/page/create_data',{icon:'/static/application/icon.php?main=/static/students/student_32.png&small='+theme.icons_16.add+'&where=right_bottom',title:'Create new staff',root_table:'StaffPosition'});return false;">Create a staff</a><br/>
 -->
 
<?php
//echo "<br/><br/>".str_replace("\n","<br/>",htmlentities(var_export($_SERVER, true))); 		
	}
	
}
?>