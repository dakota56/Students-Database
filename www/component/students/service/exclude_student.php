<?php 
class service_exclude_student extends Service {
	
	public function getRequiredRights() { return array("manage_batches"); }
	
	public function documentation() { echo "Exclude/Get back a student"; }
	public function inputDocumentation() { echo "student,date,reason: if date and reason are null, the student is unexcluded"; }
	public function outputDocumentation() { echo "true on success"; }
	
	public function execute(&$component, $input) {
		$people_id = $input["student"];
		$date = $input["date"];
		$reason = $input["reason"];
		
		$student = SQLQuery::create()->select("Student")->whereValue("Student", "people", $people_id)->executeSingleRow();
		if ($student == null) {
			PNApplication::error("Invalid student");
			echo "false";
			return;
		}
		if ($date == null && $reason == null) {
			if ($student["exclusion_date"] == null) {
				echo "true";
				return;
			}
			SQLQuery::create()->updateByKey("Student", $people_id, array("exclusion_date"=>null,"exclusion_reason"=>null));
			echo "true";
			return;
		}
		if ($date == null || $reason == null) {
			echo "false";
			return;
		}
		if ($student["exclusion_date"] <> null) {
			PNApplication::error("This student is already excluded");
			echo "false";
			return;
		}
		SQLQuery::create()->updateByKey("Student", $people_id, array("exclusion_date"=>$date,"exclusion_reason"=>$reason));
		echo "true";
	}
	
}
?>