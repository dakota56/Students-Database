<?php
/**
 * Provides functionalities to lock data, so several users cannot modify the same data at the same time
 */
class DataBaseLock {
	
	/** lock a table
	 * @param string $table the table to lock
	 * @param string $locked_by in case the table is already locked by someone else, this will be filled by the user who locked it
	 * @param boolean $bypass_security if true we will not check the current user has the right to lock the table
	 * @return integer|null the lock id, or null if the table is already locked 
	 */
	public static function lockTable($table, &$locked_by, $bypass_security = false) {
		return DataBaseLock::lock($table, null, null, $locked_by, $bypass_security);
	}
	
	/** lock a row in a table, based on its primary key
	 * @param string $table the table in which to lock a row
	 * @param integer|array $row_key the key of the row: either its primary key, or an array defaining the key
	 * @param string $locked_by in case the row or the table is already locked by someone else, this will be filled by the user who locked it
	 * @param boolean $bypass_security if true we will not check the current user has the right to lock the row
	 * @return integer|null the lock id, or null if the row is already locked
	 */
	public static function lockRow($table, $row_key, &$locked_by, $bypass_security = false) {
		return DataBaseLock::lock($table, $row_key, null, $locked_by, $bypass_security);
	}
	
	/** lock a column in a table, based on its name
	 * @param string $table the table in which to lock a column
	 * @param string $column the name of the column to lock
	 * @param string $locked_by in case the column or the table is already locked by someone else, this will be filled by the user who locked it
	 * @param boolean $bypass_security if true we will not check the current user has the right to lock the column
	 * @return integer|null the lock id, or null if the column is already locked
	 */
	public static function lockColumn($table, $column, &$locked_by, $bypass_security = false) {
		return DataBaseLock::lock($table, null, $column, $locked_by, $bypass_security);
	}
	
	/** lock a specific cell in a table, based on a primary key and a column
	 * @param string $table the table in which to lock a cell
	 * @param integer|array $row_key the key of the row: either its primary key, or an array defaining the key
	 * @param string $column the name of the column to lock
	 * @param string $locked_by in case the column, the row or the table is already locked by someone else, this will be filled by the user who locked it
	 * @param string $bypass_security if true we will not check the current user has the right to lock the cell
	 * @return integer|null the lock id, or null if the cell is already locked
	 */
	public static function lockCell($table, $row_key, $column, &$locked_by, $bypass_security = false) {
		return DataBaseLock::lock($table, $row_key, $column, $locked_by, $bypass_security);
	}
	
	/**
	 * Try to lock the given table, row, column or cell: if it is locked, retry 10 times with 100ms interval
	 * @param string $table table
	 * @param integer|array|null $row_key key of the row
	 * @param string|null $column column name
	 * @param stirng $locked_by filled if this is already locked
	 * @param boolean $bypass_security do not check if the current user has the right to obtain this lock
	 * @return integer|null lock id or null
	 */
	private static function lock($table, $row_key, $column, &$locked_by, $bypass_security) {
		for ($i = 0; $i < 10; $i++) {
			$locked_by = null;
			$id = DataBaseLock::tryLock($table, $row_key, $column, $locked_by, $bypass_security);
			if ($id <> null) return $id;
			if ($i < 9) usleep(100000);
		}
		return null;
	}
	
	/** lock rows in a table, based on primary keys
	 * @param string $table the table in which to lock rows
	 * @param array $row_keys the keys of the rows to lock
	 * @param string $locked_by in case a row or the table is already locked by someone else, this will be filled by the user who locked it
	 * @param boolean $bypass_security if true we will not check the current user has the right to lock the rows
	 * @return array|null the ids or the locks, or null if a row is already locked
	 */
	public static function lockRows($table, $row_keys, &$locked_by, $bypass_security = false) {
		for ($i = 0; $i < 10; $i++) {
			$locked_by = null;
			$ids = DataBaseLock::tryLockRows($table, $row_keys, $locked_by, $bypass_security);
			if ($ids <> null) return $ids;
			if ($i < 9) usleep(100000);
		}
		return null;
	}
	
	/**
	 * Lock the given table, row, column or cell
	 * @param string $table table
	 * @param integer|array|null $row_key key of the row
	 * @param string|null $column column name
	 * @param string $locked_by filled if this is already locked
	 * @param boolean $bypass_security do not check if the current user has the right to obtain this lock
	 * @return integer|null lock id or null
	 */
	private static function tryLock($table, $row_key, $column, &$locked_by, $bypass_security) {
		if (!$bypass_security && !DataBaseLock::isLockedByUser($table, $row_key, $column)) {
			require_once("component/data_model/Model.inc");
			$t = DataModel::get()->getTableFromSQLName($table);
			if (!($t->mayInsert() || $t->mayModify() || $t->mayRemove()))
				throw new Exception("Access denied: you cannot lock table '".$t->getName()."'.");
			if ($row_key == null) {
				// TODO can we accept that we lock a table or column if we don't have full access ?
				//if (!($t->canModifyAny() || $t->canRemoveAny()))
				//	throw new Exception("Access denied: you cannot lock table '".$t->getName()."' because you have only partial access to it.");
			} else if (!($t->canModifyEverything() || $t->canRemoveAny())) {
				$ok = false;
				if ($t->mayModify()) {
					$q = SQLQuery::create();
					$table_alias = $q->generateTableAlias();
					$q->select(array($t->getName()=>$table_alias));
					if ($t->getPrimaryKey() <> null)
						$q->whereValue($table_alias, $t->getPrimaryKey()->name, $row_key);
					else {
						$pk = $t->getKey();
						foreach ($pk as $pk_name)
							$q->whereValue($table_alias, $pk_name, $row_key[$pk_name]);
					}
					$t->prepareSelectToDetermineWriteAccess($q, $table_alias);
					$rows = $q->execute();
					$rows = $t->filterWriteAccess($rows);
					if (count($rows) > 0) $ok = true;
				}
				if (!$ok && $t->mayRemove()) {
					$q = SQLQuery::create();
					$table_alias = $q->generateTableAlias();
					$q->select(array($table=>$table_alias));
					if ($t->getPrimaryKey() <> null)
						$q->whereValue($table_alias, $t->getPrimaryKey()->name, $row_key);
					else {
						$pk = $t->getKey();
						foreach ($pk as $pk_name)
							$q->whereValue($table_alias, $pk_name, $row_key[$pk_name]);
					}
					$locks = array();
					$t->prepareSelectToDetermineRemoveAccess($q, $table_alias, $locks);
					$rows = $q->execute();
					$rows = $t->filterRemoveAccess($rows);
					if (count($rows) > 0) $ok = true;
					foreach ($locks as $lock_id) DataBaseLock::unlock($lock_id);
				}
				if (!$ok) throw new Exception("Access denied: you cannot lock the row id ".$row_key." in table ".$table);
			}
		}
		
		DataBaseLock::clean();
		$db = SQLQuery::getDataBaseAccessWithoutSecurity();
		self::mutexLock();
		$lock_user = DataBaseLock::isLocked($table, $row_key, $column, true);
		if ($lock_user <> null) {
			self::mutexUnlock();
			$locked_by = $lock_user;
			return null;
		}
		if ($row_key <> null && is_string($row_key) && ctype_digit($row_key))
			$row_key = intval($row_key);
		$db->execute(
			"INSERT INTO DataLocks".
			" (`timestamp`,`locker_domain`,`locker_username`,`table`,`row_key`,`column`)".
			" VALUE (".
				time().
				",'".$db->escapeString(PNApplication::$instance->user_management->domain)."'".
				",'".$db->escapeString(PNApplication::$instance->user_management->username)."'".
				",'".$db->escapeString($table)."'".
				",".($row_key <> null ? "'".$db->escapeString(json_encode($row_key))."'" : "NULL").
				",".($column <> null ? "'".$db->escapeString($column)."'" : "NULL").
			")"
		);
		$id = $db->getInsertID();
		self::mutexUnlock();
		return $id;
	} 

	/**
	 * Lock the given rows
	 * @param string $table table
	 * @param array $row_keys keys of the rows
	 * @param string $locked_by filled if this is already locked
	 * @param boolean $bypass_security do not check if the current user has the right to obtain this lock
	 * @return array|null locks ids or null
	 */
	private static function tryLockRows($table, $row_keys, &$locked_by, $bypass_security) {
		if (!$bypass_security) {
			require_once("component/data_model/Model.inc");
			$t = DataModel::get()->getTableFromSQLName($table);
			if (!($t->mayInsert() || $t->mayModify() || $t->mayRemove()))
				throw new Exception("Access denied: you cannot lock table '".$t->getName()."'.");
			if (!($t->canModifyEverything() || $t->canRemoveAny())) {
				$rows_ok = array();
				if ($t->mayModify()) {
					$q = SQLQuery::create();
					$table_alias = $q->generateTableAlias();
					$q->select(array($table=>$table_alias));
					if ($t->getPrimaryKey() <> null) {
						$q->whereIn($table_alias, $t->getPrimaryKey()->name, $row_keys);
						$q->field($table_alias, $t->getPrimaryKey()->name, "LOCK_ROW_KEY");
					} else {
						$pk = $t->getKey();
						foreach ($pk as $pk_name)
							$q->field($table_alias, $pk_name, "LOCK_ROW_KEY_".$pk_name);
						$where = "(";
						$first_key = true;
						foreach ($row_keys as $row_key) {
							if ($first_key) $first_key = false; else $where .= " OR "; 
							$where .= "(";
							$first_pk = true;
							foreach ($pk as $pk_name) {
								if ($first_pk) $first_pk = false; else $where .= " AND ";
								$where .= "`".$table_alias."`.`".$pk_name."`='".SQLQuery::escape($row_key[$pk_name])."'";
							}
							$where .= ")";
						}
						$where .= ")";
						$q->where($where);
					}
					$t->prepareSelectToDetermineWriteAccess($q, $table_alias);
					$rows = $q->execute();
					$rows_ok = $t->filterWriteAccess($rows);
				}
				if (count($rows_ok) < count($row_keys) && $t->mayRemove()) {
					$q = SQLQuery::create();
					$table_alias = $q->generateTableAlias();
					$q->select(array($table=>$table_alias));
					if ($t->getPrimaryKey() <> null) {
						$q->whereIn($table_alias, $t->getPrimaryKey()->name, $row_keys);
						$q->field($table_alias, $t->getPrimaryKey()->name, "LOCK_ROW_KEY");
					} else {
						$pk = $t->getKey();
						foreach ($pk as $pk_name)
							$q->field($table_alias, $pk_name, "LOCK_ROW_KEY_".$pk_name);
						$where = "(";
						$first_key = true;
						foreach ($row_keys as $row_key) {
							if ($first_key) $first_key = false; else $where .= " OR "; 
							$where .= "(";
							$first_pk = true;
							foreach ($pk as $pk_name) {
								if ($first_pk) $first_pk = false; else $where .= " AND ";
								$where .= "`".$table_alias."`.`".$pk_name."`='".SQLQuery::escape($row_key[$pk_name])."'";
							}
							$where .= ")";
						}
						$where .= ")";
						$q->where($where);
					}
					$locks = array();
					$t->prepareSelectToDetermineRemoveAccess($q, $table_alias, $locks);
					$rows = $q->execute();
					$rows = $t->filterRemoveAccess($rows);
					foreach ($rows as $r) {
						$found = false;
						foreach ($rows_ok as $r2) {
							if ($t->getPrimaryKey() <> null) {
								if ($r["LOCK_ROW_KEY"] == $r2["LOCK_ROW_KEY"]) {
									$found = true;
									break;
								} 
							} else {
								$pk = $t->getKey();
								$ok = true;
								foreach ($pk as $pk_name)
									if ($r["LOCK_ROW_KEY_".$pk_name] <> $r2["LOCK_ROW_KEY_".$pk_name]) { $ok = false; break; }
								if ($ok) {
									$found = true;
									break;
								}
							}
						}
						if (!$found) array_push($rows_ok, $r);
					}
					foreach ($locks as $lock_id) DataBaseLock::unlock($lock_id);
				}
				if (count($rows_ok) <> count($row_keys)) throw new Exception("Access denied: you cannot lock some rows in table ".$table);
			}
		}
	
		DataBaseLock::clean();
		$db = SQLQuery::getDataBaseAccessWithoutSecurity();
		self::mutexLock();
		$lock_user = DataBaseLock::areRowsLocked($table, $row_keys);
		if ($lock_user <> null) {
			self::mutexUnlock();
			$locked_by = $lock_user;
			return null;
		}
		$sql = "INSERT INTO DataLocks".
			" (`timestamp`,`locker_domain`,`locker_username`,`table`,`row_key`,`column`)".
			" VALUES ";
		$first = true;
		foreach ($row_keys as $row_key) {
			if (is_string($row_key) && ctype_digit($row_key))
				$row_key = intval($row_key);
			if ($first) $first = false; else $sql .= ",";
			$sql .= "(".
				time().
				",'".$db->escapeString(PNApplication::$instance->user_management->domain)."'".
				",'".$db->escapeString(PNApplication::$instance->user_management->username)."'".
				",'".$db->escapeString($table)."'".
				",'".$db->escapeString(json_encode($row_key))."'".
				",NULL".
				")";
		}
		$db->execute($sql);
		$id = $db->getInsertID();
		$ids = array();
		if ($id <> 0) {
			$nb_rows = $db->affectedRows();
			if ($nb_rows == count($row_keys)) {
				$res = $db->execute("SELECT LAST_INSERT_ID()");
				$row = $db->nextRow($res);
				$id = $row["LAST_INSERT_ID()"];
				for ($i = 0; $i < $nb_rows; $i++)
					array_push($ids, $id+$i);
			}
		}
		self::mutexUnlock();
		return $ids;
	}
	
	/** Used to clean only once per request */
	private static $cleant = false;
	
	/** remove expired locks */
	public static function clean() {
		if (self::$cleant) return;
		self::$cleant = true;
		$db = SQLQuery::getDataBaseAccessWithoutSecurity();
		self::mutexLock();
		$db->execute("DELETE FROM DataLocks WHERE timestamp <= ".(time()-7*60));
		self::mutexUnlock();
	}
	
	/** check if the table/row/column/cell is locked by someone else.
	 * If it is the case, return the username of the locker, else return null (if not locked, or locked by the current user)
	 * @param string $table the table name
	 * @param integer|array|null $row_key the row key or null
	 * @param string|null $column the column name or null
	 * @param boolean $db_locked indicates if the database is already locked using the mutex
	 * @return null|string if this is locked by someone else, returns the user who locked it, else returns null
	 */
	public static function isLocked($table, $row_key, $column, $db_locked = false) {
		$db = SQLQuery::getDataBaseAccessWithoutSecurity();
		if (!$db_locked)
			self::mutexLock();
		$res = $db->execute("SELECT * FROM DataLocks WHERE `table`='".$db->escapeString($table)."'");
		while (($row = $db->nextRow($res)) <> null) {
			if ($row["table"] <> $table) continue; // not the same table
			if ($row_key == null) {
				if ($column == null) {
					// full table is requested
					if ($row["locker_domain"] <> PNApplication::$instance->user_management->domain ||
						$row["locker_username"] <> PNApplication::$instance->user_management->username) {
						if (!$db_locked)
							self::mutexUnlock();
						return $row["locker_username"]; // not the current user
					}
					// same user
					if ($row["row_key"] == null && $row["column"] == $column) {
						if (!$db_locked)
							self::mutexUnlock();
						return null; // same user locked the full table
					}
					continue; // same user, but not full table
				}
				// one column is requested
				if ($row["column"] == $column) {
					// same column is locked
					if ($row["locker_domain"] <> PNApplication::$instance->user_management->domain ||
						$row["locker_username"] <> PNApplication::$instance->user_management->username) {
						if (!$db_locked)
							self::mutexUnlock();
						return $row["locker_username"]; // not the current user
					}
					if (!$db_locked)
						self::mutexUnlock();
					return null; // same user: ok
				}
				if ($row["row_key"] <> null) {
					// a row is locked: there will be a conflict if we lock a column
					if ($row["locker_domain"] <> PNApplication::$instance->user_management->domain ||
						$row["locker_username"] <> PNApplication::$instance->user_management->username) {
						if (!$db_locked)
							self::mutexUnlock();
						return $row["locker_username"]; // not the current user
					}
					continue; // same user: ok
				}
				if ($row["column"] <> null) {
					// a column is locked, and this is not the same
					continue;
				}
				// the full table is locked
				if ($row["locker_domain"] <> PNApplication::$instance->user_management->domain ||
					$row["locker_username"] <> PNApplication::$instance->user_management->username) {
					if (!$db_locked)
						self::mutexUnlock();
					return $row["locker_username"]; // not the current user
				}
				if (!$db_locked)
					self::mutexUnlock();
				return null; // same user
			} else {
				if ($column == null) {
					// a row is requested
					if ($row["column"] <> null) {
						// there is a column locked
						if ($row["locker_domain"] <> PNApplication::$instance->user_management->domain ||
							$row["locker_username"] <> PNApplication::$instance->user_management->username) {
							if (!$db_locked)
								self::mutexUnlock();
							return $row["locker_username"]; // not the current user
						}
						continue; // same user
					}
					if ($row["row_key"] <> null) {
						if ($row["row_key"] <> json_encode($row_key)) {
							// not the same row
							continue;
						}
						if ($row["locker_domain"] <> PNApplication::$instance->user_management->domain ||
							$row["locker_username"] <> PNApplication::$instance->user_management->username) {
							if (!$db_locked)
								self::mutexUnlock();
							return $row["locker_username"]; // not the current user
						}
						continue; // same user
					}
					// the table is locked
					if ($row["locker_domain"] <> PNApplication::$instance->user_management->domain ||
						$row["locker_username"] <> PNApplication::$instance->user_management->username) {
						if (!$db_locked)
							self::mutexUnlock();
						return $row["locker_username"]; // not the current user
					}
					if (!$db_locked)
						self::mutexUnlock();
					return null; // same user
				} else {
					// a cell is requested
					if ($row["column"] <> null) {
						if ($row["column"] <> $column)
							continue; // not on the same column
						// same column is locked
						if ($row["locker_domain"] <> PNApplication::$instance->user_management->domain ||
							$row["locker_username"] <> PNApplication::$instance->user_management->username) {
							if (!$db_locked)
								self::mutexUnlock();
							return $row["locker_username"]; // not the current user
						}
						if ($row["row_key"] == null) {
							if (!$db_locked)
								self::mutexUnlock();
							return null; // full column already locked by same user
						}
						if ($row["row_key"] == json_encode($row_key)) {
							if (!$db_locked)
								self::mutexUnlock();
							return null; // same cell locked by same user
						}
						continue; // different cell
					} else {
						if ($row["row_key"] <> null) {
							// a row is locked
							if ($row["row_key"] <> json_encode($row_key))
								continue; // not on the same row
							if ($row["locker_domain"] <> PNApplication::$instance->user_management->domain ||
								$row["locker_username"] <> PNApplication::$instance->user_management->username) {
								if (!$db_locked)
									self::mutexUnlock();
								return $row["locker_username"]; // not the current user
							}
							if (!$db_locked)
								self::mutexUnlock();
							return null; // same user
						} else {
							// full table is locked
							if ($row["locker_domain"] <> PNApplication::$instance->user_management->domain ||
								$row["locker_username"] <> PNApplication::$instance->user_management->username) {
								if (!$db_locked)
									self::mutexUnlock();
								return $row["locker_username"]; // not the current user
							}
							if (!$db_locked)
								self::mutexUnlock();
							return null; // same user
						}
					}
				}
			}
		}
		if (!$db_locked)
			self::mutexUnlock();
	}

	public static function areRowsLocked($table, $row_keys) {
		$db = SQLQuery::getDataBaseAccessWithoutSecurity();
		$res = $db->execute("SELECT * FROM DataLocks WHERE `table`='".$db->escapeString($table)."'");
		while (($row = $db->nextRow($res)) <> null) {
			if ($row["locker_domain"] == PNApplication::$instance->user_management->domain ||
				$row["locker_username"] == PNApplication::$instance->user_management->username)
				continue; // same user
			if ($row["column"] <> null) {
				// there is a column locked
				return $row["locker_username"];
			}
			if ($row["row_key"] <> null) {
				foreach ($row_keys as $row_key) {
					if ($row["row_key"] <> json_encode($row_key)) continue; // not the same row
					return $row["locker_username"];
				}
			}
			// the table is locked
			return $row["locker_username"]; // full table lockes
		}
		return null;
	}
	
	/** check if the table/row/column/cell is locked by the current user. If it is the case, return true, else return false.
	 * @param string $table table name
	 * @param integer|array|null $row_key key of the row or null
	 * @param string $column column name or null
	 * @param boolean $db_locked indicates if the database is already locked using the mutex
	 * @return boolean true if it is locked by the current user
	 */
	public static function isLockedByUser($table, $row_key, $column, $db_locked = false) {
		$db = SQLQuery::getDataBaseAccessWithoutSecurity();
		if (!$db_locked)
			self::mutexLock();
		$res = $db->execute("SELECT * FROM DataLocks WHERE `table`='".$db->escapeString($table)."'");
		while (($row = $db->nextRow($res)) <> null) {
			if ($row["table"] <> $table) continue; // not the same table
			if ($row["locker_domain"] <> PNApplication::$instance->user_management->domain ||
				$row["locker_username"] <> PNApplication::$instance->user_management->username) continue;
			if ($row["row_key"] == null) {
				if ($row["column"] == null) {
					if (!$db_locked) self::mutexUnlock();
					return true; // full table is locked
				} else {
					if ($column == $row["column"]) {
						if (!$db_locked) self::mutexUnlock();
						return true; // full column is locked
					}
				}
			} else {
				if (json_encode($row_key) == $row["row_key"]) {
					// same row
					if ($row["column"] == null) {
						if (!$db_locked) self::mutexUnlock();
						return true; // full row is locked
					}
					if ($row["column"] == $column) {
						if (!$db_locked) self::mutexUnlock();
						return true; // same cell is locked				
					}
				}
			}
		}
		if (!$db_locked) self::mutexUnlock();
	}
	
	/** remove a lock (it must be owned by the current user)
	 * @param integer $id lock id
	 * @return null|string null if it succeed, or error message
	 */
	public static function unlock($id) {
		$result = null;
		$db = SQLQuery::getDataBaseAccessWithoutSecurity();
		self::mutexLock();
		$r = $db->execute("SELECT locker_domain,locker_username FROM DataLocks WHERE id='".$db->escapeString($id)."'");
		if ($r) {
			$row = $db->nextRow($r);
			if ($row) {
				if ($row["locker_domain"] == PNApplication::$instance->user_management->domain &&
					$row["locker_username"] == PNApplication::$instance->user_management->username) {
					$db->execute("DELETE FROM DataLocks WHERE id='".$db->escapeString($id)."'");
				} else
					$result = "You are not the owner of this lock";
			}
		}
		self::mutexUnlock();
		return $result;
	}
	/** remove a list of locks (it must be owned by the current user)
	 * @param array $ids lock ids to remove
	 * @return null|string null if it succeed, or error message
	 */
	public static function unlockMultiple($ids) {
		if (count($ids) == 0) return null;
		$result = null;
		$db = SQLQuery::getDataBaseAccessWithoutSecurity();
		self::mutexLock();
		$sql = "SELECT id,locker_domain,locker_username FROM DataLocks WHERE id IN (";
		$first = true;
		foreach ($ids as $id) {
			if ($first) $first = false; else $sql .= ",";
			$sql .= "'".$db->escapeString($id)."'";
		}
		$sql .= ")";
		$r = $db->execute($sql);
		if ($r) {
			$list = array();
			while (($row = $db->nextRow($r)) !== FALSE) {
				if ($row) {
					if ($row["locker_domain"] == PNApplication::$instance->user_management->domain &&
						$row["locker_username"] == PNApplication::$instance->user_management->username) {
						array_push($list, $row["id"]);
					} else {
						$result = "You are not the owner of the lock id ".$row["id"];
						break;
					}
				}
			}
			if ($result == null && count($list) > 0) {
				$sql = "DELETE FROM DataLocks WHERE id IN(";
				$first = true;
				foreach ($list as $id) {
					if ($first) $first = false; else $sql .= ",";
					$sql .= "'".$db->escapeString($id)."'";
				}
				$sql .= ")";
				$db->execute($sql);
			}
		}
		self::mutexUnlock();
		return $result;
	}
	
	/** extend expiration time of a lock
	 * @param integer $id lock id
	 * @return null|string null if it succeed, or error message
	 */
	public static function update($id) {
		$db = SQLQuery::getDataBaseAccessWithoutSecurity();
		$result = null;
		$ts = time();
		self::mutexLock();
		$r = $db->execute("SELECT locker_domain,locker_username FROM DataLocks WHERE id='".$db->escapeString($id)."'");
		if ($r) {
			$row = $db->nextRow($r);
			if ($row) {
				if ($row["locker_domain"] == PNApplication::$instance->user_management->domain &&
					$row["locker_username"] == PNApplication::$instance->user_management->username) {
					$db->execute("UPDATE DataLocks SET timestamp=".$ts." WHERE id='".$db->escapeString($id)."'");
				} else
					$result = "You are not the owner of this lock";
			} else
				$result = "This lock does not exist";
		} else
			$result = "This lock does not exist";
		self::mutexUnlock();
		DataBaseLock::clean();
		return $result;
	}
	
	public static function updateLocks($ids) {
		if (count($ids) == 0) return;
		$db = SQLQuery::getDataBaseAccessWithoutSecurity();
		$ts = time();
		self::mutexLock();
		$sql = "SELECT locker_domain,locker_username FROM DataLocks WHERE id IN (";
		$first = true;
		foreach ($ids as $id) {
			if ($first) $first = false; else $sql .= ",";
			$sql .= "'".$db->escapeString($id)."'";
		}
		$sql .= ")";
		$r = $db->execute($sql);
		$sql = "UPDATE DataLocks SET timestamp=".$ts." WHERE id IN (";
		$first = true;
		if ($r) {
			while (($row = $db->nextRow($r))<>null) {
				if ($row["locker_domain"] == PNApplication::$instance->user_management->domain &&
					$row["locker_username"] == PNApplication::$instance->user_management->username) {
					if ($first) $first = false; else $sql .= ",";
					$sql .= "'".$db->escapeString($id)."'";
				}
			}
		}
		if (!$first)
			$db->execute($sql.")");
		self::mutexUnlock();
		DataBaseLock::clean();
	}
	
	/** check the given lock is locking the given table by the current user
	 * @param integer $lock_id lock id to check
	 * @param string $table table name
	 * @param integer|array|null $row_key key of the row or null
	 * @param string|null $column column name or null
	 * @return string|null null if this is already locked by the current user, or error message
	 */
	public static function checkLock($lock_id, $table, $row_key, $column) {
		$db = SQLQuery::getDataBaseAccessWithoutSecurity();
		$r = $db->execute("SELECT * FROM DataLocks WHERE id='".$db->escapeString($lock_id)."'");
		if ($r == null) return "Lock ".$lock_id." does not exist";
		$r = $db->nextRow($r);
		if ($r == null) return "Lock ".$lock_id." does not exist";
		if ($r["locker_domain"] <> PNApplication::$instance->user_management->domain ||
			$r["locker_username"] <> PNApplication::$instance->user_management->username)
			return "This lock is own by someone else";
		if ($r["table"] <> $table) return false;
		if ($r["row_key"] == null) {
			if ($r["column"] == null) {
				// full table is locked
				return null;
			}
			// only a column is locked
			if ($column == null) return "The lock only locks column ".$r["column"];
			if ($column == $r["column"]) return null;
			return "The lock locks the column ".$r["column"]." while you are asking for the column ".$column;
		}
		// a specific row is locked
		if ($r["column"] <> null) {
			// a specific cell
			if ($row_key == null) return "This lock locks a specific cell while you are asking for the full table or a column";
			if ($column == null) return "This lock locks a specific cell while you are asking for the full table or a row";
			if (json_encode($row_key) <> $r["row_key"]) return "This lock locks a cell in a different row";
			if ($column <> $r["column"]) return "This lock locks a cell in a different column";
			return null;
		}
		if ($row_key == null) return "This lock locks a row while you are asking for a full table or a column";
		if (json_encode($row_key) == $r["row_key"]) return null;
		return "This lock locks a different row";
	}
	
	/** @var handle $mutex handle to the file locked to handle mutual exclusion */
	private static $mutex = null;
	/** Lock, to make sure no other request can perform the same operation */
	private static function mutexLock() {
		if (self::$mutex <> null) return;
		self::$mutex = fopen(realpath(dirname($_SERVER["SCRIPT_FILENAME"]))."/component/data_model/DataBaseLock.mutex","r+");
		for ($i = 0; $i < 50; $i++) {
			if (flock(self::$mutex, LOCK_EX)) return;
			usleep(50000);
		}
		fclose(self::$mutex);
		self::$mutex = null;
		throw new Exception("Unable to lock access to database");
	}
	/** Unlock */
	private static function mutexUnlock() {
		if (self::$mutex == null) return;
		fclose(self::$mutex);
		self::$mutex = null;
	}

	/** Generate the necessary JavaScript code so the given lock if will be added to the list of locks
	 * @param integer $id lock id
	 */
	public static function generateScript($id) {
?>
<script type='text/javascript'>
if (window.databaselock)
	window.databaselock.addLock(<?php echo $id?>);
else {
	var f = function() {
		if (window.databaselock)
			window.databaselock.addLock(<?php echo $id?>);
		else
			setTimeout(f,100);
	};
	setTimeout(f,10);
}
</script>
<?php
	}

}
?>