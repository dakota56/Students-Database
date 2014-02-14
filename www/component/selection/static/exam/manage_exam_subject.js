function manage_exam_subject(subject, container, can_edit, can_remove, can_add, display_correct_answer,display_choices,no_question,campaign_id, read_only, subject_header_id){	var t = this;	t.ordered = null;	t.allReseters = [];	t.table = document.createElement("table");	t.full_dislayed_parts = {};	t.db_lock = null;	t.global_can_edit = null;	t.global_can_remove = null;	t.global_can_add = null;	t.page_header_container = document.getElementById(subject_header_id);	t.page_header = null;	if(typeof container == "string")		container = document.getElementById(container);	container.style.backgroundColor = "FFFFFF";		t._init = function(){		t._setHeaderContent();		t._setTableBody();		// t._setTableFooter();		t._setPageHeader();		t._setTableStyle();		container.appendChild(t.table);		//if the exam subject is new we focus on the exam_name input		if(subject.name == "New Exam" && subject.parts.length == 0){			t._focusOnInput("exam_name");		}	};	//	t._setTableHeader = function(){////		t.tr_head = document.createElement("tr");////		t.th_head.colSpan = 2;//		t._setHeaderContent();////		t.table.appendChild(thead.appendChild((document.createElement("tr")).appendChild(t.th_head)));//		//	}		t._setHeaderContent = function(){		if(typeof t.thead != "undefined"){			t.table.removeChild(t.thead);			delete t.thead;		}		t.thead = document.createElement("thead");		var max_score = 0;		for (var i = 0; i < subject.parts.length; i++){			var score = subject.parts[i].max_score;			if(typeof(score) == "string")				score = parseFloat(score);			if(isNaN(score))				score = 0;			max_score = max_score + score;		}		var th2 = document.createElement("th");		th2.colSpan = 2;		if(t.global_can_edit){			var th1 = document.createElement("th");			th1.colSpan = 2;			var input = document.createElement("input");			input.type = "text";			input.value = subject.name.uniformFirstLetterCapitalized();			if(input.value == "New Exam"){				input.style.color = "#808080";				input.style.fontStyle = "italic";			}			input.onfocus = function(){				this.style.color = "";				this.style.fontStyle = "";				if(this.value == "New Exam")					this.value = null;			};			input.onblur = function(){				if(this.value == null || (this.value != null && !this.value.checkVisible())){					this.value = "New Exam";					this.style.color = "#808080";					this.style.fontStyle = "italic";				} else					this.value = this.value.uniformFirstLetterCapitalized();				subject.name = this.value;			};			input.style.fontSize = "x-large";			input.style.textAlign = "center";			input.id = "exam_name";			new autoresize_input(input,20);			var text = subject.parts.length+" "+getGoodSpelling("part",subject.parts.length)+ " - Max score: "+max_score+" "+getGoodSpelling("point",max_score);			var text_node = document.createTextNode(text);			th1.appendChild(input);			th2.appendChild(text_node);			var tr1 = document.createElement("tr");			var tr2 = document.createElement("tr");			tr1.appendChild(th1);			tr2.appendChild(th2);			t.thead.appendChild(tr1);			t.thead.appendChild(tr2);		} else {			th2.innerHTML ="<div style = 'font-size:x-large'>"+subject.name.uniformFirstLetterCapitalized()+"</div></br> "+subject.parts.length+" "+getGoodSpelling("part",subject.parts.length)+ " - Max score: "+max_score+" "+getGoodSpelling("point",max_score);			t.thead.appendChild((document.createElement("tr")).appendChild(th2));		}		t.table.appendChild(t.thead);		//update subject object		subject.max_score = max_score;	};		t._setTableBody = function(){		var tbody = document.createElement("tbody");		if(subject.parts.length == 0){			t.ordered = [];			var td = document.createElement("td");			td.innerHTML = "<i>This exam subject has no part yet</i>";			td.style.paddingTop = "25px";			var td_insert = document.createElement("td");			if(t.global_can_edit)				td_insert.appendChild(t._createInsertPartButton());			var tr = document.createElement("tr");			tr.appendChild(td);			tr.appendChild(td_insert);			tbody.appendChild(tr);					} else {			t.ordered = t._getOrderedParts();			for(var i = 0; i < subject.parts.length; i++){				var tr1 = document.createElement("tr");				var td11 = document.createElement("td");				td11.style.paddingTop = "30px";				var td12 = document.createElement("td");				td12.style.paddingTop = "25px";				var remove_button = t._createButton("remove");				var index_button = t._createButton("change_index");				var cont_buttons = null;				if(t.global_can_edit){					cont_buttons = document.createElement("div");					cont_buttons.appendChild(remove_button);					cont_buttons.appendChild(index_button);					cont_buttons.style.display = "inline-block";					cont_buttons.style.paddingLeft = "10px";				}				var show_button = t._createButton("hide_detail");				if(typeof(t.full_dislayed_parts[subject.parts[t.ordered[i]].index]) == "undefined")					t.full_dislayed_parts[subject.parts[t.ordered[i]].index] = true;				if(t.full_dislayed_parts[subject.parts[t.ordered[i]].index] == false)					show_button.innerHTML = "<img src = '/static/widgets/tree/plus.png'/>";				show_button.td = td12;				td11.appendChild(show_button);				td11.style.verticalAlign = "top";				show_button.index = i;				show_button.onclick = function(){					var t2 = this;					if(this.part.getDisplayQuestionDetail()){						delete this.part;						this.td.removeChild(this.div_part);						delete this.div_part;						this.div_part = document.createElement("div");						this.part = new manage_exam_subject_part_questions(							subject.parts[t.ordered[t2.index]],							t2.div_part,							t.global_can_edit, //if the user can edit a subject, he can remove/add questions							t.global_can_edit,							t.global_can_edit,							false,							display_correct_answer,							display_choices,							t._getQuestionsBefore(t2.index),							no_question,							cont_buttons						);						this.part.onmanagerow.add_listener(t.resetPartsAndHeader);						this.part.onupdatescore.add_listener(t._setHeaderContent);						this.part.focusonagiveninput.add_listener(t._focusOnInput);						this.td.appendChild(t2.div_part);						this.innerHTML = "<img src = '/static/widgets/tree/plus.png'/>";						t.full_dislayed_parts[subject.parts[t.ordered[t2.index]].index] = false;					} else {						delete this.part;						this.td.removeChild(this.div_part);						delete this.div_part;						this.div_part = document.createElement("div");						this.part = new manage_exam_subject_part_questions(							subject.parts[t.ordered[t2.index]],							t2.div_part,							t.global_can_edit,							t.global_can_edit,							t.global_can_edit,							true,							display_correct_answer,							display_choices,							t._getQuestionsBefore(t2.index),							no_question,							cont_buttons						);						this.part.onmanagerow.add_listener(t.resetPartsAndHeader);						this.part.onupdatescore.add_listener(t._setHeaderContent);						this.part.focusonagiveninput.add_listener(t._focusOnInput);						this.td.appendChild(t2.div_part);						this.innerHTML = "<img src = '/static/widgets/tree/minus.png'/>";						t.full_dislayed_parts[subject.parts[t.ordered[t2.index]].index] = true;					}					// update the reseter					t.allReseters[this.index] = this.part.reset;				};				show_button.div_part = document.createElement("div");				show_button.part = new manage_exam_subject_part_questions(					subject.parts[t.ordered[i]],					show_button.div_part,					t.global_can_edit,					t.global_can_edit,					t.global_can_edit,					t.full_dislayed_parts[subject.parts[t.ordered[i]].index],					display_correct_answer,					display_choices,					t._getQuestionsBefore(i),					no_question,					cont_buttons				);				t.allReseters[i] = show_button.part.reset;				show_button.part.onmanagerow.add_listener(t.resetPartsAndHeader);				show_button.part.onupdatescore.add_listener(t._setHeaderContent);				show_button.part.focusonagiveninput.add_listener(t._focusOnInput);				td12.appendChild(show_button.div_part);				/**				 * Manage the buttons the buttons				 */				index_button.title = "Change the part index in the subject";				remove_button.index_in_parts = t.ordered[i];				remove_button.title = "Remove the part";				remove_button.onclick = function(){					var t2 = this;					var pop = new popup_window("Remove a part",theme.icons_16.question,"<center>Do you really want to remove this part<br/> and <b>all</b> the questions inside?</center>");					pop.addOkCancelButtons(function(){						t._removePart(t2.index_in_parts);						pop.close();					});					pop.show();				};				index_button.index_in_parts = t.ordered[i];				index_button.title = "Move the part";				index_button.onclick = function(){					var t2 = this;					var cont = document.createElement("div");					var div = document.createElement("div");					var text = document.createElement("div");					cont.appendChild(text);					cont.appendChild(div);					text.innerHTML = "Select the new index";					var pop = new popup_window(								"Set the index",								theme.icons_16.question,								cont							);					for(var j = 0; j < t.ordered.length; j++){						var b = t._createButton(j+1);						if(subject.parts[t2.index_in_parts].index == j+1)							b.style.backgroundColor = "rgb(17, 225, 45)";						b.index = j+1;						b.onclick = function(){							t._setIndex(t2.index_in_parts, this.index);							pop.close();						};						div.appendChild(b);					}					pop.show();				};				tr1.appendChild(td11);				tr1.appendChild(td12);				tbody.appendChild(tr1);								if(i == subject.parts.length - 1 && t.global_can_edit){					var td_insert_part = document.createElement("td");					td_insert_part.colSpan = 2;					td_insert_part.style.paddingTop = "15px";					var tr_insert_part = document.createElement("tr");					td_insert_part.appendChild(t._createInsertPartButton());					tr_insert_part.appendChild(td_insert_part);					tbody.appendChild(tr_insert_part);				}			}		}		t.table.appendChild(tbody);	};		t._setIndex = function(index_in_parts, new_index_attribute){		var actual_index_attribute = parseInt(subject.parts[index_in_parts].index);		if(actual_index_attribute > new_index_attribute){			//increase the indexes before			for(var i = new_index_attribute; i < actual_index_attribute; i++)				subject.parts[t.ordered[i-1]].index = parseInt(subject.parts[t.ordered[i-1]].index) + 1;			//set the new value			subject.parts[t.ordered[actual_index_attribute-1]].index = new_index_attribute;			//reset			t.reset();		} else if(actual_index_attribute < new_index_attribute){			//decrease the ones after			var temp = parseInt(new_index_attribute) +1;			for(var i = actual_index_attribute +1; i < temp; i++)				subject.parts[t.ordered[i-1]].index = parseInt(subject.parts[t.ordered[i-1]].index) -1;			//set the new value			subject.parts[t.ordered[actual_index_attribute-1]].index = new_index_attribute;			//reset			t.reset();		}		// if actual_index_attribute == new_index_attribute, nothing to do	};		t._removePart = function(index_in_parts){		//update the index attribute of the following parts		t._decreaseIndexAttribute(parseInt(subject.parts[index_in_parts].index) -1);		//remove the part		subject.parts.splice(index_in_parts,1);		//reset table		t.reset();	};		t._decreaseIndexAttribute = function(index_in_ordered){		if(typeof(index_in_ordered != "number"))			index_in_ordered = parseInt(index_in_ordered);		//if last part, nothing to do		if(index_in_ordered != t.ordered.length -1){			var j = index_in_ordered;			i = 1;			while(j != t.ordered.length){				subject.parts[t.ordered[index_in_ordered + i]].index = parseInt(subject.parts[t.ordered[index_in_ordered + i]].index) -1;				i++;				j = index_in_ordered + i;			}		}	};		t._createInsertPartButton = function(){		var insert_part = t._createButton("insert_part");		insert_part.onclick = function(){			// insert a part in subject with a first empty question			var length = subject.parts.length;			var new_index = t.ordered.length +1;			var new_questions = [];			var first_question = new ExamSubjectQuestion(-1,1,null,null,null);			new_questions.push(first_question);			subject.parts[length] = new ExamSubjectPart(-1,new_index,"",0,new_questions);						// reset			t.reset();			//focus			t._focusOnInput("question"+subject.parts[length].index+"."+1);		};		return insert_part;	};		t._setTableStyle = function(){		t.table.style.backgroundColor = "#FFFFFF";		t.table.style.marginLeft = "10px";		t.table.style.marginTop = "10px";		t.table.style.marginBottom = "5px";		t.table.style.paddingLeft = "20px";		t.table.style.paddingRight = "20px";		t.table.style.paddingTop = "20px";		t.table.style.paddingBottom = "20px";		setBorderRadius(t.table, 5, 5, 5, 5, 5, 5, 5, 5);		t.table.style.border = "1px solid";	};		t._setPageHeader = function(){		if(!t.page_header)			t.page_header = new header_bar(t.page_header_container,true);		t.page_header.resetMenu();			//		var rename_button = t._createButton("<img src='"+theme.icons_16.edit+"'/> Rename exam");//		rename_button.onclick = function(){//			locker = lock_screen();//			var all_subject_names = null;//			//Get all the existing exam names//			service.json("selection","exam/get_all_subject_names",{},function(res){//				unlock_screen(locker);//				if(!res){//					error_dialog("This functionality is not available for the moment");//					all_subject_names = false;//				} else//					all_subject_names = res;//			});//			if(all_subject_names !== false){//				new input_dialog(//					theme.icons_16.question,//					"Rename the exam subject",//					"Enter the new name",//					"",//					255,//					function(text){//						if(!text.checkVisible())//							return "You must enter at least one visible caracter";//						else {//							if(t._nameDoesNotAlreadyExist(text, all_subject_names))//								return;//							else//								return "An exam subject already exists with the same name";//						}//					},//					function(text){//						if(text != null){//							subject.name = text.uniformFirstLetterCapitalized();//							t._setHeaderContent();//						}//					}//				);//			}//		};				var remove_button = t._createButton("remove_exam");		remove_button.onclick = function(){			new confirm_dialog("<center>Do you want to remove this exam,<br/> and all the informations related? (Questions, parts...)</center>",				function(answer){					if(answer){						var locker = lock_screen();						if(subject.id != -1 && subject.id != "-1")							// remove from database							service.json("selection","exam/remove_subject",{id:subject.id},function(res){								unlock_screen(locker);								if(!res)									error_dialog("An error occured");								else									location.assign("/dynamic/selection/page/exam/main_page");							});						else							location.assign("/dynamic/selection/page/exam/main_page");					}				}			);		};				var save_button = t._createButton("save");		save_button.onclick = function(){			locker = lock_screen();			//Check no question is empty			var no_empty_question = t._noEmptyQuestion();			var no_empty_choices = [true,null];			var no_empty_correct_answer = [true,null];			if(display_correct_answer)				no_empty_correct_answer = t._noEmptyGivenField("correct_answer","You haven't filled up the choices column for the following questions","These fields are mandatory");			if(display_choices)				no_empty_choices = t._noEmptyGivenField("choices","You haven't filled up the choices column for the following questions","These fields are mandatory");			var name_updated = true;			var name_already_exists = false;			service.json("selection","exam/get_all_subject_names",{exclude_id:subject.id},function(res){				unlock_screen(locker);				if(!res){//					error_dialog("This functionality is not available for the moment");//					all_subject_names = false;					name_already_exists = false;				} else {					if(!t._nameDoesNotAlreadyExist(subject.name.uniformFirstLetterCapitalized(), res))						name_already_exists = true;				}			},true);			if(subject.name.uniformFirstLetterCapitalized() == "New Exam")				name_updated = false;			if(no_empty_question[0] && no_empty_choices[0] && no_empty_correct_answer[0] && name_updated && !name_already_exists){				service.json("selection","exam/save_subject",{exam:subject},function(res){					unlock_screen(locker);					if(!res)						error_dialog("An error occured, your informations were not saved");					else {						//update subject						subject = res;						//reset						t.reset();						window.top.status_manager.add_status(new window.top.StatusMessage(window.top.Status_TYPE_OK, "Your informations have been successfuly saved!", [{action:"close"}], 5000));					}				});			} else {				unlock_screen(locker);				if(!no_empty_question[0])					error_dialog(no_empty_question[1]);				if(!name_updated){					error_dialog("You must set an exam name");					t._focusOnInput("exam_name");				}				if(name_already_exists){					error_dialog("An exam subject already exists with the same name for this selection campaign");					t._focusOnInput("exam_name");				}				if(!no_empty_correct_answer[0])					error_dialog(no_empty_correct_answer[1]);				if(!no_empty_choices[0])					error_dialog(no_empty_choices[1]);			}		};				var back_button = t._createButton("<img src = '"+theme.icons_16.back+"'/> Back to Exams");		back_button.onclick = function(){			location.assign("/dynamic/selection/page/exam/main_page");		};		t.page_header.addMenuItem(back_button);				var export_button = t._createButton("<img src = '"+theme.icons_16["_export"]+"'/> Export");		export_button.onclick = function(){			t._export_menu(this);		};		t.page_header.addMenuItem(export_button);				/**		 * If the user has not can_edit right no need to add the go_editable button		 */		if(can_edit && !t.global_can_edit){			var go_editable = t._createButton("<img src ='"+theme.icons_16.edit+"'/> Edit");			go_editable.onclick = t._goEditableMode;			t.page_header.addMenuItem(go_editable);		}		/**		 * If the user is in an editable mode he can go to read only mode		 */		if(t.global_can_edit){			if(t.global_can_add || (subject.id != -1 && subject.id != "-1"))				t.page_header.addMenuItem(save_button);			if(subject.id != -1){				var go_read_only = t._createButton("<img src ='"+theme.icons_16.no_edit+"'/> Unedit");				go_read_only.onclick = t._confirmGoUneditableMode;				t.page_header.addMenuItem(go_read_only);			}		}		if(t.global_can_remove && subject.id != -1 && subject.id != "-1")			t.page_header.addMenuItem(remove_button);				t.page_header.setTitle(null,"Exam Subject");	};		t._export_menu = function(button) {		require("context_menu.js",function(){			var menu = new context_menu();			menu.removeOnClose = true;			menu.addTitleItem(null, "Export Format");			menu.addIconItem('/static/data_model/excel_16.png', 'Excel 2007 (.xlsx)', function() { t._export_list('excel2007'); });			menu.addIconItem('/static/data_model/excel_16.png', 'Excel 5 (.xls)', function() { t._export_list('excel5'); });			menu.addIconItem('/static/selection/exam/sunvote_16.png', 'SunVote ETS compatible format', function() { t._export_list('excel2007',true); });			menu.showBelowElement(button);		});	};		t._export_list = function(format,compatible_clickers){		var form = document.createElement('form');		form.action = "/dynamic/selection/service/exam/export_subject";		form.method = "POST";		var input = document.createElement("input");		input.type = "hidden";		input.name = "format";		input.value = format;		form.appendChild(input);		var input2 = document.createElement("input");		input2.type = "hidden";		input2.value = service.generateInput(subject);		input2.name = "subject";		form.appendChild(input2);		if(compatible_clickers){			var input3 = document.createElement("input");			input3.type = "hidden";			input3.value = "true";			input3.name = "clickers";			form.appendChild(input3);		}		document.body.appendChild(form);		form.submit();	};		t._nameDoesNotAlreadyExist = function(name, all_subject_names){		var unique = true;		var name2 = null;		if(name != "" && name != null){				name2 = name.uniformFirstLetterCapitalized();			for(var i = 0; i < all_subject_names.length; i++){				if(name2 == all_subject_names[i].uniformFirstLetterCapitalized()){					unique = false;					break;				}			}		}		return unique;	};		/**	 * Check that each question object has at least a score <> null	 */	t._noEmptyQuestion = function(){		var no_empty = true;		var error_message = "";		var res = [];		var first_error = true;		for(var i = 0; i < subject.parts.length; i++){			for(var j = 0; j < subject.parts[i].questions.length; j++){				if(subject.parts[i].questions[j].max_score == null || subject.parts[i].questions[j].max_score == "" || parseFloat(subject.parts[i].questions[j].max_score) <= 0.00){					no_empty = false;					if(first_error)						error_message += "You have not set a score (<b>number > 0</b>) to the following questions:<br/><ul>";					first_error = false;					var questions_before = parseInt(t._getQuestionsBefore(subject.parts[i].index -1));					var index = parseInt(subject.parts[i].questions[j].index) + questions_before;//					error_message += "<li>Part "+subject.parts[i].index+", question "+subject.parts[i].questions[j].index+"</li>";					error_message += "<li>Part "+subject.parts[i].index+", question "+index+"</li>";				}			}		}		if(!no_empty)			error_message += "</ul><br/><center><i>The score field is mandatory</i></center>";		res[0] = no_empty;		res[1] = error_message;		return res;	};		t._noEmptyGivenField = function(field_name,error_message_first_row,error_message_last_row){		var no_empty = true;		var error_message = "";		var res = [];		var first_error = true;		for(var i = 0; i < subject.parts.length; i++){			for(var j = 0; j < subject.parts[i].questions.length; j++){				if(subject.parts[i].questions[j][field_name] == null || subject.parts[i].questions[j][field_name] == ""){					no_empty = false;					if(first_error){						error_message += error_message_first_row;						error_message += ":<br/><ul>";					}					first_error = false;					var questions_before = parseInt(t._getQuestionsBefore(subject.parts[i].index -1));					var index = parseInt(subject.parts[i].questions[j].index) + questions_before;//					error_message += "<li>Part "+subject.parts[i].index+", question "+subject.parts[i].questions[j].index+"</li>";					error_message += "<li>Part "+subject.parts[i].index+", question "+index+"</li>";				}			}		}		if(!no_empty){			error_message += "</ul><br/><center><i>";			error_message += error_message_last_row;			error_message += "</i></center>";		}		res[0] = no_empty;		res[1] = error_message;		return res;	};		t._getQuestionsBefore = function(index_in_ordered){		var questions_before = null;		if(index_in_ordered == 0)			questions_before = 0;		else {			for(var i = 0; i < index_in_ordered; i++){				var count = subject.parts[t.ordered[i]].questions.length;				if(isNaN(count))					count = parseInt(count);				questions_before = questions_before + count;			}		}		return questions_before;	};		t._getOrderedParts = function(){		var ordered = [];		for(var i = 1; i < subject.parts.length + 1; i++){			ordered[i-1] = t._getPartIndexInSubject(i);		}		return ordered;	};		t._getPartIndexInSubject = function(part_index_attribute){		var index = null;		for(var i = 0; i < subject.parts.length; i++){			if(subject.parts[i].index == part_index_attribute){				index = i;				break;			}		}		return index;	};		t._createButton = function(content){		var button = document.createElement("div");		button.className = "button";		if(content == "show_detail"){			button.innerHTML = "<img src = '/static/widgets/tree/plus.png'/>";			button.className = "";			button.title = "Show part detail";			button.style.cursor = "pointer";		} else if(content == "hide_detail") {			button.innerHTML = "<img src = '/static/widgets/tree/minus.png'/>";			button.className = "";			button.title = "Hide part detail";			button.style.cursor = "pointer";		} else if(content == "remove"){			button.innerHTML = "<img src = '"+theme.icons_16.remove+"'/>";			button.className = "button_verysoft";			// button.onmouseover = function(){				// this.innerHTML = "<img src = '"+theme.icons_16.remove_black+"'/>";			// };			// button.onmouseout = function(){				// this.innerHTML = "<img src = '"+theme.icons_16.remove+"'/>";			// };		}		else if(content == "rename")			button.innerHTML = "<img src = '"+theme.icons_16.edit+"'/> Rename";		else if(content == "change_index"){			button.innerHTML = "<img src = '"+theme.icons_16.move+"'/>";			button.className = "button_verysoft";		} else if(content == "insert_part")			button.innerHTML = "<img src = '"+theme.icons_16.add+"'/> Add a part";		else if(content == "remove_exam"){			button.innerHTML = "<img src = '"+theme.icons_16.remove+"'/> Remove exam";			button.onmouseover = function(){				this.innerHTML = "<img src = '"+theme.icons_16.remove_black+"'/> Remove exam";			};			button.onmouseout = function(){				this.innerHTML = "<img src = '"+theme.icons_16.remove+"'/> Remove exam";			};		}		else if(content == "save")			button.innerHTML = "<img src = '"+theme.icons_16.save+"'/> <b>Save</b>";		else			button.innerHTML = content;		return button;	};		t._getPartIndexFromNumberOfQuestionsBefore = function(question_index_before_part){		var number_questions = 0;		var part_index = 0;		if(question_index_before_part == 0)			part_index = 0;		else {			while(number_questions < question_index_before_part && part_index < t.ordered.length){				number_questions = number_questions + parseFloat(subject.parts[t.ordered[part_index]].questions.length);				part_index++;			}		}		return part_index;	};		t._focusOnInput = function(id){		var input = document.getElementById(id);		if(input != null)			input.focus();	};		t.resetPartsAndHeader = function(question_index_before_part){		if(typeof(question_index_before_part) != "undefined" && subject.parts.length > 0)			var start = t._getPartIndexFromNumberOfQuestionsBefore(question_index_before_part);		t.table.removeChild(t.thead);		delete t.thead;		t._setHeaderContent();		if(typeof(start) == "undefined")			var start = 0;		//launch reset only for the parts after the one that fired onmanagerow		for(var i = start; i < t.ordered.length; i++){			t.allReseters[i](t._getQuestionsBefore(i));		}	};		t.reset = function(){		for(var i = 0; i < t.allReseters.length; i++)			t.allReseters[i]();		t.table.removeChild(t.thead);		delete t.thead;		container.removeChild(t.table);		delete t.table;		t.table = document.createElement("table");		delete t.ordered;		t.ordered = null;		t._lockDatabase(); //in case saving has created an exam		t.page_header.resetMenu();		t._init();	};		/**	 * @method _lockDatabase	 * Called after creating this object and saving	 * If the id != -1 and db_lock attribute == null, this method would	 * call the lock_row service, update the db_lock attribute and add the lock javascript	 * Else nothing is done	 * @param {function} (optional) onlock	 * @param {function} (optional) onnothing	 */	t._lockDatabase = function(onlock, onnothing){		if(t.db_lock == null){			if(subject.id != -1 || subject.id != "-1"){				service.json("data_model","lock_row",{table:"ExamSubject",row_key:subject.id, sub_model:campaign_id},function(res){					if(res){						databaselock.addLock(res.lock);						t.db_lock = res.lock;						if(onlock)							onlock();					}				});			} else {				if(onnothing)					onnothing();			}		} else {			if(onnothing)				onnothing();		}	};			t._confirmGoUneditableMode = function(){		if(subject.id == -1)			error_dialog("You cannot go to the read only mode because your subject has never been saved yet");		else {			new confirm_dialog("Do you really want to go on the \"read only\" mode? <br/><i>Note: all the unsaved data will be lost</i>",function(res){				if(res)					t._goUneditableMode();			});		}	};		/**	 * @method _goUneditableMode	 * Update the global rights attributes and reset the table	 * Unlock the row in database	 */	t._goUneditableMode = function(){		var locker = lock_screen();		t._setGlobalRights(true);		if(t.db_lock != null)			service.json("data_model","unlock",{lock:t.db_lock},function(res){				if(res){					databaselock.removeLock(t.db_lock);					t.db_lock = null;				}			});		//only keep the saved data		service.json("selection","exam/get_subject",{id:subject.id},function(res){			if(res)				subject = res.subject;			unlock_screen(locker);			t.reset();		});	};		/**	 * @method _goEditableMode	 * Update the global rights attributes and reset the table	 * Lock the row in database	 */	t._goEditableMode = function(){		var onlock = function(){			t._setGlobalRights(false);			t.reset();		};		t._lockDatabase(onlock, onlock);	};		/**	 * @method _setGlobalRights	 * @param {boolean} new_read_only	 * First called when this object is instantiated	 * Set the current displaying mode (editable/non-editable)	 * based on the user rights (defined by can_edit, can_add, can_remove parameters)	 * and the displaying mode (defined by read_only)	 * For instance, a user can have the right can_edit but is using the read_only_mode,	 * so he the global_can_edit attribute is false	 */	t._setGlobalRights = function(new_read_only){		if(can_edit){			if(new_read_only)				t.global_can_edit = false;			else				t.global_can_edit = true;		} else t.global_can_edit = false;		if(can_add){			if(new_read_only)				t.global_can_add = false;			else				t.global_can_add = true;		} else t.global_can_add = false;		if(can_remove){			if(new_read_only)				t.global_can_remove = false;			else				t.global_can_remove = true;		} else t.global_can_remove = false;	};		require(["manage_exam_subject_part_questions.js","popup_window.js","header_bar.js","exam_objects.js","autoresize_input.js"],function(){		t._setGlobalRights(read_only);		if(!read_only)			t._lockDatabase(function(){t._init();},function(){t._init();});		else {//no need to lock			t._init();		}	});}