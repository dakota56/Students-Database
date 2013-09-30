<?php 
class service_get_root_tables extends Service {
	
	public function get_required_rights() {
		return array();
	}
	
	public function documentation() { echo "Return the root tables which can be proposed to the user for an import"; }
	public function input_documentation() { echo "nothing"; }
	public function output_documentation() { 
		echo "An array of [{table:xxx,display:yyy}]";
	}
	
	public function execute(&$component, $input) {
		echo "[";
		require_once("component/data_model/Model.inc");
		$first = true;
		foreach (DataModel::get()->getTables() as $table) {
			if ($table->getDisplayName() == null) continue;
			if ($first) $first = false; else echo ",";
			echo "{table:".json_encode($table->getName()).",display:".json_encode($table->getDisplayName())."}";
		} 
		echo "]";
	}
	
}
?>