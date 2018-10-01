function verification(ecaLists){
	var result = true

	var flatecaLists = makeFlat(ecaLists)
	var face = generatingFace(flatecaLists)
	var ruleflow = generatingRuleFlows(face)

	var message =""
	
	if(ruleflow != "circularity"){
		message = inconsistency_redundancy(flatecaLists, ruleflow)
	}
	else if(ruleflow == "circularity"){
		message = "There is a circularity between rules!"
	}

	if(message.length > 0){
		alert_verification(message);
		result = false
	}
	return result
}

function alert_verification(message){
	var windowObj = window.open("support/verification.html?val=test", 'myWindow', 'scrollbars=no,toolbar=no,resizable=no,width=430px,height=450px,left=400,top=100');
	alert(message)	
}

function makeFlat(ecaLists){
	var result = new Array()

	for( eca of ecaLists){

		var actionList = eca.actionList
		for(action of actionList){

			var neweca = new ECA(eca.event, eca.condition, action);
			result.push(neweca)
		}
	}

	return result

}

function generatingFace(flatecaLists){

	var face = new Array;
	for(var index = 0; index < flatecaLists.length; index++){
		var action =  flatecaLists[index].actionList	

		for(var sub = 0; sub < flatecaLists.length; sub++){
			var event_sub = flatecaLists[sub].event	
			if(verificationMap.influence(action, event_sub)){
				/*fac[action.command] = {"event" : event_sub,
										"action" : action,
										"pair" : [index, sub]
										}*/
				face.push([index, sub])
				
			}
		}
	}
	return face
}


function generatingRuleFlows(face){
	var ruleflow = new Array()
	var flows = face
	var loop = true

	while(loop){
		loop = false
		var newflow = new Array()
		for(flow of flows){
			for(pair of face){
				var last_index = flow.length-1
				if(flow[last_index] == pair[0]){
					if(flow[0] != pair[1]){
						newflow.push(flow.concat(pair[1]))
						loop = true
					}else if(flow[0] == pair[1]){
						return "circularity"
					}
				}
			}
		}
		flows = newflow
		ruleflow = ruleflow.concat(newflow)
	}

	return ruleflow
}

function inconsistency_redundancy(flatecaLists, flowsList){
	
	var alert = ""
	//eca vs eca
	for(var index = 0; index < flatecaLists.length; index++){ 
		var flatecaList = flatecaLists[index]
		
		for(var sub = index+1; sub < flatecaLists.length; sub++){
			var action = flatecaLists[index].actionList	
			var action_sub = flatecaLists[sub].actionList	
			
			if(conflict(action, action_sub)){//Check Conflict
				var event = flatecaLists[index].event	
				var event_sub = flatecaLists[sub].event	
				var condition = flatecaLists[index].condition	
				var condition_sub = flatecaLists[sub].condition	
				if(same_event(event, event_sub) && same_condition(condition, condition_sub))
					alert = alert+ "case 1 inconsistency\n"
			}
			else if(action.command == action_sub.command){//Check Redundancy
				var event = flatecaLists[index].event	
				var event_sub = flatecaLists[sub].event	
				var condition = flatecaLists[index].condition	
				var condition_sub = flatecaLists[sub].condition	
				if(same_event(event, event_sub)){
					if(same_condition(condition, condition_sub) || opposite_condition(condition, condition_sub))
						alert = alert+ "case 1 redundancy\n"
				}
			}
		}
	}
	
	for(var index = 0; index < flowsList.length; index++){
		var flow = flowsList[index]
		var action = flatecaLists[flow[flow.length-1]].actionList

		// eca vs flow
		for(ecaList_sub of flatecaLists){  
			var action_sub = ecaList_sub.actionList	
			if(conflict(action, action_sub)){//Check the Actions has Conflict
				var event = flatecaLists[flow[0]].event	
				var event_sub = ecaList_sub.event	
				if(same_event(event, event_sub)){
					//if(same_condition(condition, condition_sub) || opposite_condition(condition, condition_sub))\
					alert = alert+ "case 2 inconsistency\n"
				}
			}
			else if(action.command == action_sub.command){//Check the Actions has redundancy
				var event = flatecaLists[flow[0]].event	
				var event_sub = ecaList_sub.event	
				if(same_event(event, event_sub)){
					//if(same_condition(condition, condition_sub) || opposite_condition(condition, condition_sub))
						alert = alert+ "case 2 redundancy\n"
				}
			}
		}

		// flow vs flow
		for(var sub = index+1; sub < flowsList.length; sub++){
			var flow_sub = flowsList[sub]
			var action_sub = flatecaLists[flow_sub[flow_sub.length-1]].actionList	
			if(conflict(action, action_sub)){//Check the Actions has Conflict
				var event = flatecaLists[flow[0]].event		
				var event_sub = flatecaLists[flow_sub[0]].event		
				if(same_event(event, event_sub)){
					//if(same_condition(condition, condition_sub) || opposite_condition(condition, condition_sub))
						alert = alert+ "case 3 inconsistency\n"
				}
			}
			else if(action.command == action_sub.command){//Check the Actions has redundancy
				var event = flatecaLists[flow[0]].event		
				var event_sub = flatecaLists[flow_sub[0]].event	
				if(same_event(event, event_sub)){
					//if(same_condition(condition, condition_sub) || opposite_condition(condition, condition_sub))
						alert = alert+ "case 3 redundancy\n"
				}
			}
		}
	}

	return alert

}



function same_event(event, event_sub){
	if(event.devname == event_sub.devname){
		var handler1 = [".", "."]
		var handler2 = [".", "."]
		
		if(event.attr)
			handler1[1] = event.attr
		else{
			handler1[0] = event.event_handler.from
			handler1[1] = event.event_handler.to
		}
		
		
		if(event_sub.attr)
			handler2[1] = event_sub.attr
		else{
			handler2[0] = event_sub.event_handler.from
			handler2[1] = event_sub.event_handler.to
		}


		if(handler1[1] == handler2[1] && handler1[0] == handler2[0])
			return true
		else
			return false
	}
}

function same_condition(condition, condition_sub){
	var result = 0


	if(condition.constructor == Grouping && condition_sub.constructor == Grouping){

		
	}else if(condition.constructor != Grouping && condition_sub.constructor != Grouping){

		if(condition.result && condition_sub.result){ //true, false
			if(condition.result == condition_sub.result){
				if(condition.result == 'true' || condition.result == 'false'){
					result = 1
				}
			}
		}else if( !condition.result && !condition_sub.result){  // p&&p, p||p, !p, f <= fn, m <= n, fϵd  
			var operator = condition.operator;
			var right = condition.right;
			var left = condition.left;
			
			var operator_sub = condition_sub.operator;
			var right_sub = condition_sub.right;
			var left_sub = condition_sub.left;

			if(operator == operator_sub){
				if(operator == '&&' || operator == '||'){
					var right = same_condition(condition.right, condition_sub.right)
					var left = same_condition(condition.left, condition_sub.left)
					if(right == 1 && left == 1){
						result = 1	
					}else{ // swap
						right = same_condition(condition.right, condition_sub.left)
						left = same_condition(condition.left, condition_sub.right)
						if(right == 1 && left == 1)
							result = 1
					}
				
				}else if(operator == '!'){
					result = same_condition(condition.right, condition_sub.right)
					
				}else if(operator == '==' || operator == '!='){
					if(right.devname == right_sub.devname && left.attr == left_sub.attr)
						result = 1

				}else if(operator == '<'|| operator == '>' ){
					result = 1

				}
			}
		}
	}
	return result
}


function opposite_condition(condition, condition_sub){
	var result = false
	condition
	condition_sub
	return result
}

function conflict(action, action_sub){
	//check same name
	//for(a of action){
	//	for(a2 of action_sub){
			if(action.devname == action_sub.devname){
				if(verificationMap.conflict(action.command_part, action_sub.command_part))
					return true
			}
	///	}
	//}
	return false
}
