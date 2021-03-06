<?php 
class service_save_subject_comments extends Service {
	
	public function getRequiredRights() { return array(); }
	
	public function documentation() { echo "Save final grades of students for a given subject"; }
	public function inputDocumentation() {
		echo "<ul>";
		echo "<li><code>subject_id</code></li>";
		echo "<li><code>students</code>: list of {<code>people</code>, <code>comment</code>}</li>";
		echo "</ul>";
	}
	public function outputDocumentation() { echo "true on success"; }
	
	public function execute(&$component, $input) {
		// check access
		if (!PNApplication::$instance->user_management->has_right("edit_students_grades")) {
			if (!PNApplication::$instance->curriculum->amIAssignedTo($input["subject_id"])) {
				PNApplication::error("Access denied");
				return;
			}
		}
		
		set_time_limit(120);
		SQLQuery::startTransaction();
		set_time_limit(120);
		if (count($input["students"]) > 0)
			$component->update_students_comments($input["subject_id"], $input["students"]);
		SQLQuery::commitTransaction();
		echo "true";
	}
	
}
?>