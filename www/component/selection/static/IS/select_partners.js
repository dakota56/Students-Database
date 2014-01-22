function select_partners(container, IS_id, partners, can_manage, organization_contacts, partners_contacts_points, select_address){	var t = this;		t.partners = partners;	t.organization_contacts = organization_contacts;	t.partners_contacts_points = partners_contacts_points;	require(["popup_window.js","contacts.js"],function(){		t._setTablePartners();	});		t.getPartners = function(){		return t.partners;	}		t.getOrganizationContact = function(){		return t.organization_contacts;	}		t.getPartnersContactsPoints = function(){		return t.partners_contacts_points;	}		t.resetTablePartners = function(div_locker){		// alert(service.generateInput(t.partners));		container.removeChild(t.table_partners);		t._setTablePartners();		if(typeof(div_locker) != "undefined" && div_locker != null) unlock_screen(div_locker);	}		t._setTablePartners = function(){		t.table_partners = document.createElement("table");		var thead = document.createElement("thead");		var tbody = document.createElement("tbody");		var tfoot = document.createElement("tfoot");				th_head = document.createElement("th");		th_head.innerHTML = "<img src='/static/contact/directory_16.png' style = 'vertical-align:bottom'/> Partners";		setCommonStyleTable(t.table_partners,th_head,"#DADADA");		th_head.colSpan = 3;		thead.appendChild((document.createElement("tr")).appendChild(th_head));				if(t.partners.length == 0){			var text = document.createElement("div");			text.innerHTML = "No partner is set for this Information Session";			text.style.fontStyle = "italic";		}		if(t.partners.length > 0){			for(var i = 0; i < t.partners.length; i++){				t._addPartnerRows(i, tbody);			}		}		if(can_manage){			t._addAddPartnerButton(tfoot);		}				t.table_partners.appendChild(thead);		t.table_partners.appendChild(tbody);		t.table_partners.appendChild(tfoot);		container.appendChild(t.table_partners);	}		t._addAddPartnerButton = function(cont){		var tr = document.createElement("tr");		var td = document.createElement("td");		var div = document.createElement("div");		var data_grid = document.createElement("div");		div.innerHTML = "<img src='"+theme.icons_16.add+"'/> Add a partner";		div.className = "button";		div.onclick = function(){			var pop = new popup_window("Select the partners",theme.icons_16.question,data_grid);			var url_partners = "";			if(t.partners.length == 0) url_partners = "&partners=0";			else{				var j = 0;				for(var i = 0; i < t.partners.length; i++){					url_partners += "&partners["+j+"]="+t.partners[i].organization;					j++;				}			}			var frame = pop.setContentFrame("/dynamic/selection/page/IS/select_organizations?creator=Selection&is="+IS_id+url_partners);			pop.addOkCancelButtons(function(){				pop.close();				var locker = lock_screen();				var win = getIFrameWindow(frame);				// alert(service.generateInput(win.selected_partners));				//update the data object				service.json("selection","IS/get_partners_array",{partners_id:win.selected_partners},function(new_partners){					if(!new_partners){						error_dialog("An error occured");						unlock_screen(locker);						return;					} else {						select_address.transferPartnerAddressToHostAddress(new_partners);						//match the two partners array (in case some contact points were already selected but not saved into the database)						var list = t._matchPartnersArrays(new_partners);						t.partners.splice(0,t.partners.length);						for (var i=0; i<list.length; ++i) t.partners.push(list[i]);						//refresh the organization_contacts,partners_contacts_points						service.json("selection","IS/get_partners_contacts",{partners_id:win.selected_partners,no_address:false,no_contact:true},function(res){							if(!res){								error_dialog("An error occured");								unlock_screen(locker);								return;							} else {								t.organization_contacts.splice(0,t.organization_contacts.length);								for(var i = 0; i < res.length; i++){									t.organization_contacts.push(res[i]);								}								service.json("contact","get_json_contact_points_no_address",{partners_id:win.selected_partners},function(r){									if(!r){										error_dialog("An error occured");										unlock_screen(locker);										return;									} else {										t.partners_contacts_points.splice(0,t.partners_contacts_points.length);										for(var i = 0; i < r.length; i++){											t.partners_contacts_points.push(r[i]);										}										//reset tables										t.resetTablePartners(locker);									}								});							}						});					}				});			});			pop.show();		};		td.appendChild(div);		td.colSpan = 3;		td.style.borderTop = "1px solid #959595";		tr.appendChild(td);		cont.appendChild(tr);	}		t._addManageContactPointsButton = function(cont, partner_index_in_data){		var div = document.createElement("div");		div.innerHTML = "<img src = '/static/contact/contact_16.png' /> Set/unset contacts points";		div.className = "button";		div.onclick = function(){			var pop_cont = document.createElement("div");			var pop = new popup_window("Select the contacts points",theme.icons_16.question,pop_cont);			var table = document.createElement("table");			table.contact_points_selected = [];			pop_cont.appendChild(table);			t._setTableSelectContactPoints(table,partner_index_in_data);			pop.addOkCancelButtons(function(){				pop.close();				var div_locker = lock_screen();				//update the data object				t.partners[partner_index_in_data].contact_points_selected = [];				var j = 0;				for(var i = 0; i < table.contact_points_selected.length; i++){					if(table.contact_points_selected[i].selected){						t.partners[partner_index_in_data].contact_points_selected[j] = table.contact_points_selected[i].people_id;						j++;					}				}				t.resetTablePartners(div_locker);			});			pop.show();		};		cont.appendChild(div);	}		t._setTableSelectContactPoints = function(table, partner_index_in_data){		var index = t._findPartnerIndexInPartners_contacts_points(t.partners[partner_index_in_data].organization);		if(index != null){			var length = t.partners_contacts_points[index].contact_points.length;			for(var j = 0; j < length; j++){				table.contact_points_selected[j] = {};				table.contact_points_selected[j].people_id = t.partners_contacts_points[index].contact_points[j].people_id;				table.contact_points_selected[j].selected = false;				var tr = document.createElement("tr");				var td1 = document.createElement("td");				var td2 = document.createElement("td");				td2.people_id =  t.partners_contacts_points[index].contact_points[j].people_id;				td2.index = j;				if(j == 0){					td1.innerHTML = t.partners[partner_index_in_data].organization_name;					td1.style.fontSize = "large";					td1.style.fontWeight = "bold";					td1.style.paddingRight = "20px";				}				var text = "";				text +=  t.partners_contacts_points[index].contact_points[j].people_last_name;				text += ", "+  t.partners_contacts_points[index].contact_points[j].people_first_name;				if( t.partners_contacts_points[index].contact_points[j].people_designation != null &&  t.partners_contacts_points[index].contact_points[j].people_designation != "")					text += ", "+  t.partners_contacts_points[index].contact_points[j].people_designation;				td2.innerHTML = text;				td2.style.fontStyle = "italic";				td2.className = "button";				if(t._isContactPointSelectedInData(partner_index_in_data,  t.partners_contacts_points[index].contact_points[j].people_id)){					td2.style.backgroundColor = "rgb(17, 225, 45)";					table.contact_points_selected[j].selected = true;				}								td2.onclick = function(){					if(this.style.backgroundColor == "#11E12D" ||this.style.backgroundColor == "rgb(17, 225, 45)"){						this.style.backgroundColor = "#FFFFFF";						table.contact_points_selected[this.index].selected = false;					}					else if (this.style.backgroundColor == "" || this.style.backgroundColor == "rgb(255, 255, 255)"){						this.style.backgroundColor = "#11E12D";						table.contact_points_selected[this.index].selected = true;					}				};				tr.appendChild(td1);				tr.appendChild(td2);				table.appendChild(tr);			}			if(length == 0){				var td = document.createElement("td");				td.innerHTML = "This organization has no contact point";				td.style.fontStyle = "italic";				table.appendChild((document.createElement("tr")).appendChild(td));			}		}	}	t._addPartnerRows = function(index, tbody){		var length = t.partners[index].contact_points_selected.length;		if(length == 0){			var tr = document.createElement("tr");			var td1 = document.createElement("td");			var td_contact = document.createElement("td");			t._setRowNoContactPointSelected(tr, td_contact, td1, index);			tr.appendChild(td_contact);			tbody.appendChild(tr);		} else {			for(var i = 0; i < length; i++){				var tr = document.createElement("tr");				var td1 = document.createElement("td");				var td_name = document.createElement("td");				td_name.style.paddingRight = "10px";				td_name.style.paddingLeft = "10px";				var td_contact = document.createElement("td");				td_contact.style.paddingTop = "10px";				td_contact.style.paddingBottom = "10px";				var text = document.createElement("div");				var contact_point = t._getContactPointDataInPartners_contacts_points(t.partners[index].organization, t.partners[index].contact_points_selected[i]);				if(contact_point != null){					td_contact.style.paddingRight = "5px";					if(contact_point.people_designation != null && contact_point.people_designation != "")						text.innerHTML = contact_point.people_last_name+", "+contact_point.people_first_name+", "+contact_point.people_designation;					if(contact_point.people_designation == null ||contact_point.people_designation == "")						text.innerHTML = contact_point.people_last_name+", "+contact_point.people_first_name;					text.style.fontStyle= "italic";					td_name.appendChild(text);					if(contact_point.contacts.length != 0)						new contacts(td_contact, null, null, null, contact_point.contacts, false, false, false, null);					else{						var div = document.createElement("div");						div.innerHTML = "<i>There is no contact<br/> info for this people</i>";						td_contact.appendChild(div);						div.style.textAlign = "center";						div.style.border = "1px solid #959595";						div.style.marginTop = "10px";						div.style.marginRight = "5px";						setBorderRadius(div, 5, 5, 5, 5, 5, 5, 5, 5);					}				} else t._setRowNoContactPointSelected(tr, td_contact, td1, index);								if(i == 0 && contact_point != null){					td1.innerHTML = t.partners[index].organization_name;					td1.style.fontSize = "large";					td1.style.fontWeight = "bold";					td1.rowSpan = length;					td1.style.paddingLeft = "10px";					td1.style.paddingRight = "15px";					tr.appendChild(td1);					if(index != 0){						td1.style.borderTop = "1px solid #959595";						td_name.style.borderTop = "1px solid #959595";						td_contact.style.borderTop = "1px solid #959595";					}				}				if(contact_point != null) tr.appendChild(td_name);				tr.appendChild(td_contact);				tbody.appendChild(tr);			}		}		//Add a row for the contacts points button		if(can_manage){			var tr_button = document.createElement("tr");			var td1_button = document.createElement("td");			t._addManageContactPointsButton(td1_button,index);			tr_button.appendChild(td1_button);			var td_remove = document.createElement("td");			var remove_button = document.createElement("div");			remove_button.className = "button";			td_remove.appendChild(remove_button);			remove_button.innerHTML = "<img src = '"+theme.icons_16.remove+"'/> Remove partner";			remove_button.onmouseover = function(){				remove_button.innerHTML = "<img src = '"+theme.icons_16.remove_black+"'/> Remove partner";			};			remove_button.onmouseout = function(){				remove_button.innerHTML = "<img src = '"+theme.icons_16.remove+"'/> Remove partner";			};			remove_button.onclick = function(){				t._removePartnerManually(index);			};			tr_button.appendChild(td_remove);			tr_button.appendChild(document.createElement("td"));			tbody.appendChild(tr_button);		}	}		t._removePartnerManually = function(partner_index){		//Manage the case it was the host		var partner_id = t.partners[partner_index].organization;		if(t.partners[partner_index].host){			select_address.setCustomAddress(t.partners[partner_index].host_address);		}		//Remove from the data object		t.partners.splice(partner_index,1);		//Remove from organization_contacts		var index_in_organization_contacts = t._findPartnerIndexInOrganization_contacts(partner_id);		organization_contacts.splice(index_in_organization_contacts,1);		//Remove from partners_contacts_points		var index_in_partners_contacts_points = t._findPartnerIndexInPartners_contacts_points(partner_id);		partners_contacts_points.splice(index_in_partners_contacts_points,1);				t.resetTablePartners();	}		t._setRowNoContactPointSelected = function(tr, td_contact, td1, index){		td_contact.style.paddingTop = "20px";		td_contact.style.paddingBottom = "20px";		td_contact.innerHTML = "<center>There is no contact point selected for this partner</center>";		td_contact.style.fontStyle = "italic";		td_contact.colSpan = 2;		td1.innerHTML = t.partners[index].organization_name;		td1.style.fontSize = "large";		td1.style.fontWeight = "bold";		td1.style.paddingLeft = "10px";		td1.style.paddingRight = "15px";		tr.appendChild(td1);		if(index != 0){			td1.style.borderTop = "1px solid #959595";			td_contact.style.borderTop = "1px solid #959595";		}	}		t._matchPartnersArrays = function(new_array){		for(var i = 0; i < new_array.length; i++){			var index = t._findPartnerIndexInData(new_array[i].organization)			if(index != null){				new_array[i].contact_points_selected = t.partners[index].contact_points_selected;			}		}		return new_array;	}		t._findPartnerIndexInData = function(organization_id){		var index = null;		for(var i = 0; i < t.partners.length; i++){			if(t.partners[i].organization == organization_id){				index = i;				break;			}		}		return index;	}		t._isContactPointSelectedInData = function(partner_index, contact_point_id){		var selected = false;		for(var i = 0; i < t.partners[partner_index].contact_points_selected.length; i++){			if(t.partners[partner_index].contact_points_selected[i] == contact_point_id){				selected = true;				break;			}		}		return selected;	}		t._findPartnerIndexInOrganization_contacts = function(partner_id){		var index = null;		for(var i = 0; i < organization_contacts.length; i++){			if(organization_contacts[i].id == partner_id){				index = i;				break;			}		}		return index;	}		t._getContactPointDataInPartners_contacts_points = function(partner_id, contact_point_id){		var contact_point = null;		var partner_index = t._findPartnerIndexInPartners_contacts_points(partner_id);		if(partner_index != null){			for(var i = 0; i <  t.partners_contacts_points[partner_index].contact_points.length; i++){				if( t.partners_contacts_points[partner_index].contact_points[i].people_id == contact_point_id){					contact_point =  t.partners_contacts_points[partner_index].contact_points[i];					break;				}			}		}		return contact_point;	}		t._findPartnerIndexInPartners_contacts_points = function(partner_id){		var index = null;		for(var i = 0; i <  t.partners_contacts_points.length; i++){			if(partner_id ==  t.partners_contacts_points[i].organization){				index = i;				break;			}		}		return index;	}}