<?php require_once("/../selection_page.inc");function getJsonAllParts(){	$all_parts = SQLQuery::create()		->select("ExamSubjectPart")		->join("ExamSubjectPart","ExamSubject",array("exam_subject" => "id"))		->field("ExamSubjectPart","id","part_id")		->field("ExamSubjectPart","max_score","max_score")		->field("ExamSubjectPart","name","part_name")		->field("ExamSubjectPart","index","index")		->field("ExamSubject","id","id")		->field("ExamSubject","name","name")		->orderBy("ExamSubject","id")		->orderBy("ExamSubjectPart","index")		->execute();	if($all_parts <> null){		$json = "[{id:".json_encode($all_parts[0]["id"]);		$json .= ", name:".json_encode($all_parts[0]["name"]);		$json .= ", parts:[";		$first_part = true;		$current_subject = $all_parts[0]["id"];		foreach($all_parts as $p){			if($p["id"] != $current_subject){				$current_subject = $p["id"];				$json .= "]}, {id:".json_encode($p["id"]).", name:".json_encode($p["name"]).", parts:[";				$first_part = true;			}			if(!$first_part)				$json .= ", ";			$first_part = false;			$json .= "{id:".json_encode($p["part_id"]).", ";			$json .= "name:".json_encode($p["part_name"]).", ";			$json .= "max_score:".json_encode($p["max_score"]).", ";			$json .= "index:".json_encode($p["index"])."}";		}		$json .= "]}]";		return $json;	} else 		return "[]";}class page_eligibility_rules_manage_exam_topic extends selection_page {	public function get_required_rights() { return array(); }	public function execute_selection_page(&$page){		/* Check the rights */		if(!PNApplication::$instance->user_management->has_right("manage_exam_subject",true)){			?>			<script type = "text/javascript">			error_dialog("You are not allowed to manage the exam topics for eligibility rules");			</script>			<?php		} else {			//initialize all the rights to true because manage_exam_subject is true			$can_add = true;			$can_edit = true;			$can_remove = true;			$restricted = PNApplication::$instance->selection->updateRightsFromStepsDependenciesRestrictions("define_topic_for_eligibility_rules",$can_add,$can_remove,$can_edit);			if($restricted[0]){				?>				<script type = "text/javascript">				var error_text = <?php echo json_encode($restricted[1]);?>;				error_dialog(error_text);				</script>				<?php			}			if($can_edit){				$id = null;				if(isset($_GET["id"]))					$id = $_GET["id"];				else					$id = -1;				//temp				$id = 1;				$container_id = $page->generateId();				$topic = null;				$other_topics = null;				if($id ==  -1 || $id == "-1"){					//initialize topic object					$topic = "{id:-1,name:\"New Topic\",subjects:[]}";				} else {					require_once 'component/selection/SelectionJSON.inc';					$topic = SelectionJSON::ExamTopicForEligibilityRulesFromID($id);				}				$other_topics = SelectionJSON::getAllJsonTopics($id);				$json_all_parts = getJsonAllParts();								//temp				echo "topic: ".$topic;				echo "<br/><br/><br/>";				echo "all_parts: ".$json_all_parts;				echo "<br/><br/><br/>";				echo "other_topics: ".$other_topics;				echo "<br/><br/><br/>";								//Todo: lock the tables? (to have the last version of the other topics)																?>				<div id = "<?php echo $container_id;?>"></div>				<script type = "text/javascript">				require("manage_exam_topic_for_eligibility_rules.js",function(){					var can_add = <?php echo json_encode($can_add);?>;					var can_edit = <?php echo json_encode($can_edit);?>;					var can_remove = <?php echo json_encode($can_remove);?>;					var container_id = <?php echo json_encode($container_id);?>;					var topic = <?php echo $topic;?>;					var other_topics = <?php echo $other_topics;?>;					var all_parts = <?php echo $json_all_parts;?>;					new manage_exam_topic_for_eligibility_rules(topic, container_id, can_add, can_edit, can_remove, other_topics, all_parts);				});				</script>				<?php			}		}	}	}