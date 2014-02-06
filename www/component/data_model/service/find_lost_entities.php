<?php 
class service_find_lost_entities extends Service {
	
	public function get_required_rights() { return array(); } // TODO manage database
	
	public function documentation() { echo "Look for lost data in the database"; }
	public function input_documentation() { echo "No input"; }
	public function output_documentation() { echo "List of lost entities: {table,rows:[...]}"; }
	
	public function execute(&$component, $input) {
		require_once("component/data_model/Model.inc");
		echo "[";
		$first = true;
		foreach (DataModel::get()->internalGetTables() as $table) {
			if ($table->isRoot()) continue;
			// not a root table
			if ($table->getModel() instanceof SubDataModel) {
				// TODO
			} else {
				$rows = SQLQuery::create()->bypassSecurity()->select($table->getName())->execute();
				if (count($rows) == 0) continue;
				$this->findLinked($table, array(), $rows, array());
				if (count($rows) == 0) continue;
				if ($first) $first = false; else echo ",";
				$this->printRows($table, null, $rows);
			}
		}
		echo "]";
	}
	
	/**
	 * Find somewhere the given rows are linked to, and remove them from the list of rows when a path has been found.
	 * @param \datamodel\Table $table the table
	 * @param array $sub_models list of sub model instances
	 * @param array $rows rows to check
	 */
	private function findLinked($table, $sub_models, &$rows, $tables_done) {
		if (in_array($table->getSQLName($sub_models), $tables_done)) return;
		if (count($rows) == 0) return;
		array_push($tables_done, $table->getSQLName($sub_models));
		if ($table->getModel() instanceof SubDataModel) {
			// TODO
		} else {
			// first, look at root tables directly linked
			// look for foreign keys on this table
			foreach ($table->internalGetColumnsFor(null) as $col) {
				if (!($col instanceof \datamodel\ForeignKey)) continue;
				$ft = DataModel::get()->internalGetTable($col->foreign_table);
				if (!$ft->isRoot()) continue;
				$keys = array();
				foreach ($rows as $r) if ($r[$col->name] <> null) array_push($keys, $r[$col->name]);
				if (count($keys) == 0) continue;
				$found = SQLQuery::create()->bypassSecurity()->select($ft->getName())->whereIn($ft->getName(), $ft->getPrimaryKey()->name, $keys)->field($ft->getName(), $ft->getPrimaryKey()->name)->executeSingleField();
				for ($i = 0; $i < count($rows); $i++) {
					if (in_array($rows[$i][$col->name], $found)) {
						// ok, we have a link
						array_splice($rows, $i, 1);
						$i--;
						continue;
					}
				}
				if (count($rows) == 0) return; // we are done
			}
			// look for tables having a foreign key to this table
			$pk = $table->getPrimaryKey();
			if ($pk <> null) {
				foreach (DataModel::get()->internalGetTables() as $ft) {
					if ($ft->getModel() instanceof SubDataModel) continue; // TODO
					if ($ft == $table) continue;
					if (!$ft->isRoot()) continue;
					foreach ($ft->internalGetColumnsFor(null) as $col) {
						if (!($col instanceof \datamodel\ForeignKey)) continue;
						if ($col->foreign_table <> $table->getName()) continue;
						// we have a foreign key here
						$keys = array();
						foreach ($rows as $r) array_push($keys, $r[$pk->name]);
						$found = SQLQuery::create()->bypassSecurity()->select($ft->getName())->whereIn($ft->getName(), $col->name, $keys)->field($ft->getName(), $col->name)->executeSingleField();
						for ($i = 0; $i < count($rows); $i++) {
							if (in_array($rows[$i][$pk->name], $found)) {
								// ok, we have a link
								array_splice($rows, $i, 1);
								$i--;
								continue;
							}
						}
						if (count($rows) == 0) return; // we are done
					}
				}
			}
			
			// second step: indirect links
			// look for foreign keys on this table
			foreach ($table->internalGetColumnsFor(null) as $col) {
				if (!($col instanceof \datamodel\ForeignKey)) continue;
				$ft = DataModel::get()->internalGetTable($col->foreign_table);
				if ($ft->isRoot()) continue;
				$keys = array();
				foreach ($rows as $r) if ($r[$col->name] <> null) array_push($keys, $r[$col->name]);
				if (count($keys) == 0) continue;
				$found = SQLQuery::create()->bypassSecurity()->select($ft->getName())->whereIn($ft->getName(), $ft->getPrimaryKey()->name, $keys)->execute();
				if (count($found) == 0) continue;
				$keys_found = array();
				foreach ($found as $f) array_push($keys_found, $f[$ft->getPrimaryKey()->name]);
				$this->findLinked($ft, $sub_models, $found, $tables_done);
				// found are the rows which didn't find any link
				// so keys_found which are not anymore in found are rows which have link
				foreach ($keys_found as $key) {
					$has_link = true;
					foreach ($found as $f) if ($f[$ft->getPrimaryKey()->name] == $key) { $has_link = false; break; }
					if ($has_link) {
						// remove rows
						for ($i = 0; $i < count($rows); $i++) {
							if ($rows[$i][$col->name] == $key) {
								array_splice($rows, $i, 1);
								$i--;
								continue;
							}
						}
						if (count($rows) == 0) return; // we are done
					}
				}
			}
			// look for tables having a foreign key to this table
			$pk = $table->getPrimaryKey();
			if ($pk <> null) {
				foreach (DataModel::get()->internalGetTables() as $ft) {
					if ($ft->getModel() instanceof SubDataModel) continue; // TODO
					if ($ft == $table) continue;
					if ($ft->isRoot()) continue;
					foreach ($ft->internalGetColumnsFor(null) as $col) {
						if (!($col instanceof \datamodel\ForeignKey)) continue;
						if ($col->foreign_table <> $table->getName()) continue;
						// we have a foreign key here
						$keys = array();
						foreach ($rows as $r) array_push($keys, $r[$pk->name]);
						$found = SQLQuery::create()->bypassSecurity()->select($ft->getName())->whereIn($ft->getName(), $col->name, $keys)->execute();
						$no_link = array();
						foreach ($found as $f) array_push($no_link, $f);
						$this->findLinked($ft, $sub_models, $no_link, $tables_done);
						foreach ($found as $f) {
							$has_link = true;
							foreach ($no_link as $n) if ($n == $f) { $has_link = false; break; }
							if ($has_link) {
								// we can remove the row
								for ($i = 0; $i < count($rows); $i++) {
									if ($rows[$i][$pk->name] == $f[$col->name]) {
										array_splice($rows, $i, 1);
										$i--;
										continue;
									}
								}
							}
						}
						if (count($rows) == 0) return; // we are done
					}
				}
			}
		}
	}
	
	/**
	 * Print the rows found on the given table
	 * @param \datamodel\Table $table the table
	 * @param number|null $sub_model sub model instance
	 * @param array $rows the lost rows found
	 */
	private function printRows($table, $sub_model, $rows) {
		echo "{table:".json_encode($table->getSQLNameFor($sub_model)).",rows:[";
		$first = true;
		foreach ($rows as $r) {
			if ($first) $first = false; else echo ",";
			echo "{";
			$first_col = true;
			foreach ($table->internalGetColumnsFor($sub_model) as $col) {
				if ($first_col) $first_col = false; else echo ",";
				echo $col->name.":".json_encode($r[$col->name]);
			}
			echo "}";
		}
		echo "]}";
	}
	
}
?>