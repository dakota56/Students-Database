<?php 
class service_execute_functionalities_scenario extends Service {
	
	public function getRequiredRights() { return array(); }
	public function documentation() {}
	public function inputDocumentation() {}
	public function outputDocumentation() {}
	
	public function execute(&$component, $input) {
		$cname = $input["component"];
		$scenario_path = $input["scenario"];
		require_once("component/test/TestScenario.inc");
		require_once("component/test/TestFunctionalitiesScenario.inc");
		require_once("component/".$cname."/test/functionalities/".$scenario_path.".php");
		$scenario_class = str_replace("/","_",$scenario_path);
		$scenario = new $scenario_class();
		$step = intval($input["step"]);
		$data = @$input["data"];
		if ($data == null) $data = array();
		if ($step == -1) {
			$error = $scenario->init($data);
			// make sure we are not logged in when starting the scenario
			PNApplication::$instance->user_management->logout();
		} else 
			$error = $scenario->run_step($step, $data);
		echo "{error:".json_encode($error).",data:".json_encode($data)."}";
	}
		
}
?>