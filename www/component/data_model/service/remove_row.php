<?php
class service_remove_row extends Service {
	public function getRequiredRights() { return array(); }
	public function documentation() { echo "Remove an entry in the given table"; }
	public function inputDocumentation() {
?>
<ul>
	<li><code>table</code>: table name of the row to remove</li>
	<li><code>row_key</code>: primary key of the row to remove</li>
	<li><code>sub_model</code>: optional, only if the table is in the sub model</li>
</ul>
<?php		
	}
	public function outputDocumentation() { echo "return true on success"; }
	public function execute(&$component, $input) {
		$table = $input["table"];
		$key = $input["row_key"];
		require_once("component/data_model/Model.inc");
		try {
			$q = SQLQuery::create();
			$sub_model = @$input["sub_model"];
			if ($sub_model <> null) $q->selectSubModelForTable(DataModel::get()->getTable($table), $sub_model);
			$q->removeKey($table, $key);
		} catch (Exception $e) {
			PNApplication::error($e);
		}
		echo PNApplication::hasErrors() ? "false" : "true";
	}
}
?>