function IS_profile(id, config, calendar_id, rights, container, data, organization_contacts,partners_contacts_points,all_duration,campaign_id, save_button_id, remove_button_id){	var t = this;	t.db_lock = null;	t.table = document.createElement("table");	t.div_header = document.createElement("div");	t.div_address = document.createElement("div");	t.div_partners = document.createElement("div");	t.div_date = document.createElement("div");	t.div_name = document.createElement("div");	t.div_statistics = document.createElement("div");		if(typeof(container) == "string") container = document.getElementById(container);	require(["popup_window.js","select_address.js","select_partners.js","IS_date.js","IS_name.js","IS_statistics.js"],function(){t._init();});	t._init = function(){		if((id == -1 && !rights.manage) || (id == "-1" && !rights.manage)) error_dialog("You are not allowed to add an Information Session");		else{			// t._setHeader();			t._setTableAddress();			t._setTablePartners();			t._setTableDate();			var index_name = findIndexInConfig(config, "give_name_to_IS");			if(config[index_name].value) t._setTableName();			t._setTableStatistics();			t._setLayout();			t._lockDatabase();		}	}		t._setHeader = function(){		t.div_header.innerHTML = "<center>Information Session Profile</center>";		t.div_header.style.fontWeight = "bold";		t.div_header.style.fontSize = "x-large";		t.div_header.style.paddingTop = "20px";		t.div_header.style.paddingBottom = "40px";	}		t._setTableAddress = function(){		t.select_address = new select_address(t.div_address, data, organization_contacts, rights.manage);	}		t._setTablePartners = function(){		t.select_partners = new select_partners(t.div_partners, id, data.partners, rights.manage, organization_contacts, partners_contacts_points, t.select_address);	}		t._setTableDate = function(){		var index = findIndexInConfig(config, "default_duration_IS");		// var index2 = findIndexInConfig(config, "give_name_to_IS_event");		t.IS_date = new IS_date(t.div_date, data.date, data.id, calendar_id, config[index].value, rights.read, rights.manage, all_duration);	}		t._setTableName = function(){		t.IS_name = new IS_name(t.div_name,data.name,rights.manage)	}		t._setTableStatistics = function(){		var index_statistics = findIndexInConfig(config, "separate_boys_girls_IS"); 		t.IS_statistics = new IS_statistics(t.div_statistics, config[index_statistics].value, rights.manage, data.number_boys_expected, data.number_boys_real, data.number_girls_expected, data.number_girls_real);	}		t._setLayout = function(){		var tr1 = document.createElement("tr");		var tr2 = document.createElement("tr");		var tr3 = document.createElement("tr");		var tr4 = document.createElement("tr");		var tr5 = document.createElement("tr");		var tr6 = document.createElement("tr");		var td1 = document.createElement("td");				td1.appendChild(t.div_header);		td1.colSpan = 2;		tr1.appendChild(td1);				var td21 = document.createElement("td");		var td22 = document.createElement("td");		td21.appendChild(t.div_address);		td22.appendChild(t.div_partners);		td22.rowSpan = 5;		td22.style.verticalAlign = "top";		tr2.appendChild(td21);		tr2.appendChild(td22);				var td31 = document.createElement("td");		var td32 = document.createElement("td");		td31.appendChild(t.div_name);		// td31.style.textAlign = "center";		tr3.appendChild(td31);		tr3.appendChild(td32);				var td41 = document.createElement("td");		var td42 = document.createElement("td");		td41.appendChild(t.div_date);		tr4.appendChild(td41);		tr4.appendChild(td42);				var td51 = document.createElement("td");		var td52 = document.createElement("td");		td51.appendChild(t.div_statistics);		td51.style.verticalAlign = "top";		tr5.appendChild(td51);		tr5.appendChild(td52);				var td61 = document.createElement("td");		// var td62 = document.createElement("td");				var button_remove = document.getElementById(remove_button_id);		if(rights.manage && data.id != -1 && data.id != "-1"){			// td61.appendChild(button_remove);			button_remove.style.visibility = 'visible';			button_remove.style.position = 'static';			button_remove.onclick = function(){				confirm_dialog("Remove this information session and all the linked data?",function(res){					if(res){						var locker = lock_screen();						service.json("selection","IS/remove",{id:data.id,fake_organization:data.fake_organization},function(r){							unlock_screen(locker);							if(r)								location.assign("/dynamic/selection/page/IS/main_page");							else								error_dialog("An error occured");						});					}				});			};		} else {			button_remove.style.visibility = 'hidden';			button_remove.style.position = 'absolute';			button_remove.style.top = '-10000px';		}		var button_save = document.getElementById(save_button_id);		if(rights.manage){			button_save.style.visibility = 'visible';			button_save.style.position = 'static';			button_save.onclick = function(){				t.launchSaving();			};		} else {			button_save.style.visibility = 'hidden';			button_save.style.position = 'absolute';			button_save.style.top = '-10000px';		}		tr6.appendChild(td61);		// tr6.appendChild(td62);				t.table.appendChild(tr1);		t.table.appendChild(tr2);		t.table.appendChild(tr3);		t.table.appendChild(tr4);		t.table.appendChild(tr5);		t.table.appendChild(tr6);				t.table.style.marginLeft = "15px";				container.appendChild(t.table);	}		t.launchSaving = function(){		var locker = lock_screen();		var host = t.select_address.getHostInData();		if(host == null){			unlock_screen(locker);			error_dialog("Location field is mandatory");		} else {							/** 			 * Get the data from each screen:			 * select_partners works with the reference of data			 * so there is no need to update			 */						//get from select_address			var address = t.select_address.getAddressObject();			if(address.geographic_area == null || (typeof(address.geographic_area.id) != "undefined" && address.geographic_area.id == null)){				unlock_screen(locker);				error_dialog("Please select a geographic area in the Location field");			} else {				//get from date				var event = t.IS_date.getEvent();				event.title = "Information Session, "+address.geographic_area.text;								// get from statistics				var figures = t.IS_statistics.getFigures();				data.number_boys_expected = figures.boys_expected;				data.number_girls_expected = figures.girls_expected;				data.number_boys_real = figures.boys_real;				data.number_girls_real = figures.girls_real;								// get from name				var name = t.IS_name.getName();				if(name != null)					data.name = name;				else					data.name = address.geographic_area.text;								service.json("selection","IS/save",{event:event, address:address, data:data},function(res){					unlock_screen(locker);					if(!res)						error_dialog("An error occured, your informations were not saved");					else {						window.top.status_manager.add_status(new window.top.StatusMessage(window.top.Status_TYPE_OK, "Your informations have been successfuly saved!", [{action:"close"}], 5000));						// Update the data on the page (some ids have been generated...)						data.id = res.id;						data.address = res.address;						data.fake_organization = res.fake_organization;						data.date = res.date;						//reset the table (in case remove button must be added, and update the objects)						t.resetAll();					}				});			}		}	}		t.resetAll = function(locker){		container.removeChild(t.table);		delete(t.table);		t.table = document.createElement("table");		t._setLayout();		t.select_address.resetTableAddress();		t.select_partners.resetTablePartners();		t.IS_date.setEventId(data.date);		t.IS_date.resetTable();		if(typeof(locker) != "undefined" && locker != null) unlock_screen(locker);		t._lockDatabase();	}		/**	 * @method _lockDatabase	 * Called after creating this object and saving	 * If the id != -1 and db_lock attribute == null, this method would	 * call the lock_row service, update the db_lock attribute and add the lock javascript	 * Else nothing is done	 */	t._lockDatabase = function(){		if(t.db_lock == null){			if(data.id != -1 || data.id != "-1")				service.json("data_model","lock_row",{table:"InformationSession",row_key:data.id, sub_model:campaign_id},function(res){					if(res){						databaselock.addLock(res.lock);						t.db_lock = res.lock;					}				});		}	}}