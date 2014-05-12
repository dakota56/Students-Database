<?php 
class service_user_picture extends Service {
	
	public function getRequiredRights() { return array(); }
	
	public function documentation() { echo "Retrieve the picture from the given user"; }
	public function inputDocumentation() { echo "domain and username"; }
	public function outputDocumentation() { echo "the picture in JPEG format"; }
	
	public function getOutputFormat($input) {
		return "image/jpeg";
	}
	
	public function execute(&$component, $input) {
		if ($_GET["domain"] == PNApplication::$instance->local_domain) {
			require_once("component/people/service/picture.php");
			$service = new service_picture();
			$people_id = SQLQuery::create()->bypassSecurity()
				->select("Users")
				->whereValue("Users", "username", $_GET["username"])
				->join("Users", "UserPeople", array("id"=>"user"))
				->field("UserPeople", "people", "people_id")
				->executeSingleValue();
			header("Location: /dynamic/people/service/picture?people=".$people_id);
		} else {
			header('Cache-Control: public', true);
			header('Pragma: public', true);
			$date = date("D, d M Y H:i:s",time());
			header('Date: '.$date, true);
			$expires = time()+24*60*60;
			header('Expires: '.date("D, d M Y H:i:s",$expires).' GMT', true);
			// TODO picture with interrogation point ?
		}
	}
	
}
?>