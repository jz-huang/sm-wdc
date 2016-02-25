(function(){

var config = {
	redirect_uri: '',
	client_id: '', 
	response_type: 'code',
	api_key: ''
}

var api_url = {
	survey_list : '/v2/surveys/get_survey_list?',
	survey_details : '/v2/surveys/get_survey_details?',
	respondent_list : '/v2/surveys/get_respondent_list?',
	responses : '/v2/surveys/get_responses?',
	oath : '/oauth/authorize?',
	api_key : jQuery.param({api_key: config.api_key}),
	base : 'https://api.surveymonkey.net'
}

$(document).ready(function() {
	var accessToken = Cookies.get("accessToken");
	$('#login').click(function(){
		var SM_API_BASE = "https://api.surveymonkey.net";
		var AUTH_CODE_ENDPOINT = "/oauth/authorize"; 
		url_params = {
			redirect_uri: '',
			client_id: '', 
			response_type: 'code',
			api_key: ''
		}
		var url = SM_API_BASE + AUTH_CODE_ENDPOINT + '?' + jQuery.param(url_params);
		window.location = url; 
	});
	
	$("#getDataButton").click(function() {
		var survey_id = $('#surveys').val().trim();
		if (survey_id == '-1') {
			alert('Error: no surveys found on this account'); 
		} else {
			tableau.connectionName = 'Survey Monkey Data' + $('#surveys option:selected').text();
			tableau.connectionData = survey_id; 
			tableau.alwaysShowAuthUI = true;
			tableau.submit();
		}
	});

	var hasAuth = accessToken && accessToken.length > 0;

	if (hasAuth){
		request_survey_list(accessToken);
	}
	update_Auth_displays(hasAuth);
});

/*
update_Auth_displays is called upon initiation of the page
to display appropriate UI elements.
*/
function update_Auth_displays(hasAuth){
	if (hasAuth) {
		$("#notsignedin").css('display', 'none');
		$("#signedin").css('display', 'none');
		$("#getDataButton").prop('disabled',false);
		$("#getDataButton").css('display', 'inline');
		$("#login").css('display', 'none'); 
		$('#surveylist').css('display', 'inline');
	} else {
		$("#notsignedin").css('display', 'inline');
		$("#signedin").css('display', 'none');
		$("#getDataButton").css('display', 'none');
		$("#login").css('display', 'inline'); 
		$('#surveylist').css('display','none');
	}
};

/*
Once the user is authenticated, request_survey_list is called
to request the list of surveys on the users account. 
The returned list is sorted by date-modified
*/
function request_survey_list(accessToken){

	var param = {api_key: config.api_key};
	var SM_API_BASE = 'https://api.surveymonkey.net';
	var SURVEY_LIST_ENDPOINT = '/v2/surveys/get_survey_list';
	var req_url = api_url.base + api_url.survey_list + api_url.api_key;
	var xhr = $.ajax({
		url: req_url,
		type: 'POST',
		data: '{"fields": ["title", "date_modified"]}',
		dataType: 'json',
		contentType: 'application/json',
		headers: {
			'Authorization': 'bearer ' + accessToken,
			'Content-Type': 'application/json'
		},
		sucess: function(data, textStatus, jqXHR){
			alert(textStatus);
			
		},
		error: function(xhr, ajaxOptions, thrownError){
			alert('error!');
		},
		complete:function(jqXHR, textStatus){
			if (textStatus != 'success' || jqXHR.responseJSON.errmsg ) {
				alert('surveylist api failed'); 
			}
			parse_survey_list(jqXHR.responseJSON.data.surveys); 		
        }
	});


};

/* 
parse_survey_list turns the list of surveys into 
html elements. 
*/
function parse_survey_list(surveys){
	surveys.sort(date_compare); //sort by date modified
	if(surveys.length == 0) {
		$('#surveys').append('<option value=-1>No Surveys Found </option>'); 
		return; 
	}
	$('#surveys').empty(); 
	for (i = 0; i<surveys.length; i++){
		$('#surveys').append('<option ' + 'value=' + surveys[i].survey_id + '>' + surveys[i].title + '</option>'); 
	}
};

/*
helper function for sorting by date-modified
*/
function date_compare(survey1, survey2){
	var date1 = new Date(survey1.date_modified);
	var date2 = new Date(survey2.date_modified); 
	return -(date1-date2); 
}

/*
_getColumnHeaders calls the get_survey_details api
*/
function _getColumnHeaders(survey_id, accessToken){
	var req_url = api_url.base + api_url.survey_details + api_url.api_key;
	//console.log(req_url);
	var xhr = $.ajax({
		url: req_url,
		type: 'POST',
		data: '{"survey_id": "' + survey_id + '"}',
		dataType: 'json',
		contentType: 'application/json',
		headers: {
			'Authorization': 'bearer ' + accessToken,
			'Content-Type': 'application/json'
		},
		complete:function(jqXHR, textStatus){
			if (textStatus != 'success' || jqXHR.responseJSON.errmsg ) {
				alert('survey details api failed'); 
			}
			parse_survey_details(jqXHR.responseJSON.data); 
        }

	});
};

/*
respondent_info_headers is used to prefill the headers
*/
function respondent_info_headers(){
	headers = []; 
	fieldTypes = [];
	headers.push('respondent_id'); 
	headers.push('question_name'); 
	headers.push('question_response');
	fieldTypes.push('string');
	fieldTypes.push('string');
	fieldTypes.push('string');
	return [headers, fieldTypes];
}

/*
parse_survey_details takes the result from get_survey_details api
and parses for the question names and responses.
(hashtables from id to question name and id to answer is needed because 
the get_responses api returns question_ids and answer_ids)
*/
function parse_survey_details(data){
	var page, question, type, answer; 
	var headers = respondent_info_headers()[0]; 
	var fieldTypes = respondent_info_headers()[1];
	var id_to_question_name = {}; 
	var id_to_answer_name = {}; 
	for (i = 0; i < data.pages.length; i++){
		page = data.pages[i];
		for (j = 0; j < page.questions.length; j++){
			question = page.questions[j]; 
			type = question.type.family;
			if (type === 'single_choice'){
				id_to_question_name[question.question_id] = clean_name(question.heading); 
				for  (k = 0; k < question.answers.length; k++){
					answer = question.answers[k];
					if (answer.type === 'other'){ //extra comment box or custom option
						var header = question.heading + ' - ' + answer.text + '(comment)'; 
						header = clean_name(header); 
						id_to_question_name[question.question_id + '0'] = header;
					} else {
						id_to_answer_name[answer.answer_id] = answer.text;
					}
				}
			} else if (type === 'multiple_choice'){
				id_to_question_name[question.question_id] = clean_name(question.heading); 
				for  (k = 0; k < question.answers.length; k++){
					answer = question.answers[k];
					if (answer.type === 'other'){ //extra comment box or custom option 
						var header = question.heading + ' - ' + answer.text + '(comment)'; 
						header = clean_name(header); 
						id_to_question_name[question.question_id + '0'] = header;
					} else {
						id_to_answer_name[answer.answer_id] = answer.text;
					}
				}
			} else if (type === 'open_ended'){
				//do a if text when parsing
				if (question.answers.length === 0){
					id_to_question_name[question.question_id] = clean_name(question.heading);
				} else {
					for  (k = 0; k < question.answers.length; k++){
						answer = question.answers[k];
						var header = question.heading + ' - ' + answer.text; 
						header = clean_name(header);
						id_to_question_name[answer.answer_id] = header; 
					}
				}
			} else if ( type === 'datetime'){
				for  (k = 0; k < question.answers.length; k++){
					answer = question.answers[k];
					var header = question.heading + ' - ' + answer.text.trim(); 
					header = clean_name(header);
					id_to_question_name[answer.answer_id] = header; 
				}
			} else if (type === 'demographic'){
				//do a if text when parsing
				for  (k = 0; k < question.answers.length; k++){
					answer = question.answers[k];
					var header = question.heading + ' - ' + answer.text.trim(); 
					header = clean_name(header);
					id_to_question_name[answer.answer_id] = header; 
				}
				
			} else if (type === 'matrix'){
				for (k = 0; k < question.answers.length; k++){
					answer = question.answers[k]; 
					if (answer.type === 'col'){
						id_to_answer_name[answer.answer_id] = answer.text; 
					} else if (answer.type === 'row') {
						var header = question.heading + ' - ' + answer.text; 
						header = clean_name(header);
						id_to_question_name[answer.answer_id] = header;
					} else if (answer.type === 'other'){ 
						var header = question.heading + ' - ' + answer.text + '(comment)'; 
						header = clean_name(header); 
						id_to_question_name[question.question_id + '0'] = header;
					} else {
						console.log('unsupported answer type in matrix');
					}
				}
			} else {
				console.log('unsupported type detected');
			}

		}
	}
	var transfer_data = []; 
	transfer_data.push(tableau.connectionData); 
	transfer_data.push(id_to_question_name);
	transfer_data.push(id_to_answer_name); 
	tableau.connectionData = JSON.stringify(transfer_data);
	tableau.headersCallback(headers, fieldTypes);
};

/*
clean_name function is just a backup utility incase there exists 
characters that are uncompatiable with Tableau Data Engine. 
*/
function clean_name(name){
	//name = name.replace(/[`~!@#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
	return name;
};

/*
_getRespondentList gets a list of respondent_ids for a survey.
After _getRespondentList is finished calling it passes the 
array of respondent_ids into the get_responses api call to 
get the actual resposnes.
*/
function _getRespondentList(survey_id, accessToken){
	var respondent_ids = []; 
	var req_url = api_url.base + api_url.respondent_list + api_url.api_key;
	var respondents;
	var xhr = $.ajax({
		url: req_url,
		type: 'POST',
		data: '{"survey_id": "' + survey_id + '"}',
		dataType: 'json',
		contentType: 'application/json',
		headers: {
			'Authorization': 'bearer ' + accessToken,
			'Content-Type': 'application/json'
		},
		complete:function(jqXHR, textStatus){
			if (textStatus != 'success' || jqXHR.responseJSON.errmsg ) {
				alert('respondents api failed, your survey probably has not been taken by anyone'); 
			}
			data = jqXHR.responseJSON.data;
			respondents = jqXHR.responseJSON.data.respondents; 
			for (i = 0; i < respondents.length; i++){
				respondent_ids.push(respondents[i].respondent_id); 
			}
			setTimeout(_getResponses, 1000, survey_id, accessToken, respondent_ids, 0, 2, []);
        }
	});
};

/*
_getResponses calls the get_responses api since we are limited to 
100 respondents' responses per api call, the function recursively calls
itself until all the responses are obtained. 
The function that passes in the responses to parsing function.
*/
function _getResponses(survey_id, accessToken, respondents, index, api_limit, data_array){
	var respondents_to_query = []; 
	var limit; 
	if ((index+1)*100 > respondents.length){
		limit = respondents.length; 
	} else {
		limit = (index+1)*100; 
	}
	for (var i = index*100; i < limit; i++){
		respondents_to_query.push(respondents[i]); 
	}
	var request_body = {
		"respondent_ids": respondents_to_query,
		"survey_id": survey_id
	};

	var req_url = api_url.base + api_url.responses + api_url.api_key;

	var xhr = $.ajax({
		url: req_url,
		type: 'POST',
		data: JSON.stringify(request_body),
		dataType: 'json',
		contentType: 'application/json',
		headers: {
			'Authorization': 'bearer ' + accessToken,
			'Content-Type': 'application/json'
		},
		complete:function(jqXHR, textStatus){
			if (textStatus != 'success' || jqXHR.responseJSON.errmsg ) {
				console.log(textStatus);
				console.log(jqXHR.responseJSON.errmsg);
				alert('reponses api failed'); 
			}
			data_array.push(jqXHR.responseJSON.data);
			if (limit === respondents.length){
				parse_responses(data_array); 
			} else if (index % api_limit === 1){
				setTimeout(_getResponses, 1000, survey_id, accessToken, respondents, index+1, api_limit, data_array);
			} else {
				_getResponses(survey_id, accessToken, respondents, index+1, api_limit, data_array);
			}
        }
	});
};

/*
parse_responses parses the responses from get_responses api and fills
the rows in the data table
*/
function parse_responses(data_array){
	var data_transferred = JSON.parse(tableau.connectionData);
	var id_to_question_name = data_transferred[1]; 
	var id_to_answer_name = data_transferred[2];
	data = data_array; 
	var question, answers, entry, respondents, respondent; 
	var toReturnData = []; 
	var entry;

	for (i = 0; i < data_array.length; i++){
		respondents = data_array[i]; 
		for (j = 0; j < respondents.length; j++){
			respondent = respondents[j]; 
			for (k = 0; k < respondent.questions.length; k++){
				question = respondent.questions[k]; 
				answers = question.answers; 
				if (answers[0].text){ 
					if (answers[0].row ==='0') { //single comment box; 
						entry = fill_entry(respondent.respondent_id, id_to_question_name[question.question_id], answers[0].text); 
						toReturnData.push(entry);
					} else { //multiple comment boxes 
						for (l = 0; l < answers.length; l++){
							entry = fill_entry(respondent.respondent_id, id_to_question_name[answers[l].row], answers[l].text); 
							toReturnData.push(entry);
						}
					}
				} else if (question.answers[0].col){ //matrix 
					for (l = 0; l < answers.length; l++){
						if (answers[l].row === '0'){
							entry = fill_entry(respondent.respondent_id, id_to_question_name[question.question_id + '0'], answers[l].text);
						} else {
							entry = fill_entry(respondent.respondent_id, id_to_question_name[answers[l].row], id_to_answer_name[answers[l].col]); 
						}
						toReturnData.push(entry);
					} 
				} else { //single choice or multiple choice questions 
					for (l = 0; l < answers.length; l++){
						var response; 
						if (answers[l].row === '0') { //this is a comment not a choice
							entry = fill_entry(respondent.respondent_id, id_to_question_name[question.question_id + '0'], answers[l].text);
						} else {
							if (answers[l].text){
								response = answers[l].text; // when user is given the option to enter custom choice
							} else {
								response = id_to_answer_name[answers[l].row];
							}
							entry = fill_entry(respondent.respondent_id, id_to_question_name[question.question_id], response);
						}
						toReturnData.push(entry);
					}
				}
			}
		}
	}
	tableau.dataCallback(toReturnData, toReturnData.length.toString(), false);
};

/*
fill_entry is a helper function to create entries
*/
function fill_entry(respondent_id, question, answer){
	var entry = {}; 
	entry['respondent_id'] = respondent_id; 
	entry['question_name'] = question; 
	entry['question_response'] = answer;
	return entry;
}

/*
helper function to convert dates to the right format for tableau 
*/
function check_if_date(dateToConvert){
	var moDate = moment(dateToConvert).format("YYYY-MM-DD HH:mm:ss.SSS");
	if (moDate === 'Invalid date'){
		return dateToConvert; 
	} else {
		return moDate;
	}
}

//-------------------------------------------------- //
//WDC-specific things
//-------------------------------------------------- //
var myConnector = tableau.makeConnector();

myConnector.init = function() {
	
	var accessToken = Cookies.get("accessToken");

	var hasAuth = (accessToken && accessToken.length > 0) || tableau.password.length > 0;

	if (tableau.phase == tableau.phaseEnum.interactivePhase || tableau.phase == tableau.phaseEnum.authPhase) {
		if (hasAuth) {	
			tableau.password = accessToken;
		}
	} else {
		if (!hasAuth) {
			tableau.abortWithError("Don't have an access token. Giving up");
		}
	}
	update_Auth_displays(hasAuth); 

	tableau.initCallback();
};


myConnector.getColumnHeaders = function() {
	var accessToken = tableau.password; 
	var survey_id = tableau.connectionData;
	_getColumnHeaders(survey_id, accessToken);
};


myConnector.getTableData = function(lastRecordToken) {
	var accessToken = tableau.password;
	var data_transferred = JSON.parse(tableau.connectionData);
	var survey_id = data_transferred[0]; 
	setTimeout(_getRespondentList, 1000, survey_id, accessToken);
};


tableau.registerConnector(myConnector);

})();
