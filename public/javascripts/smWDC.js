

var config = {
	redirect_uri: 'http://localhost:8080/redirect',
	client_id: 'sm_jhuang8598', 
	response_type: 'code',
	api_key: '5c4x5n79vbfqr95pc2x5u87y'
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
	//console.log("hello");
	var accessToken = Cookies.get("accessToken");
	$('#login').click(function(){
		var SM_API_BASE = "https://api.surveymonkey.net";
		var AUTH_CODE_ENDPOINT = "/oauth/authorize"; 
		url_params = {
			redirect_uri: 'http://localhost:8080/redirect',
			client_id: 'sm_jhuang8598', 
			response_type: 'code',
			api_key: '5c4x5n79vbfqr95pc2x5u87y'
		}
		var url = SM_API_BASE + AUTH_CODE_ENDPOINT + '?' + jQuery.param(url_params);
		window.location = url; 
	});
	
	$("#getDataButton").click(function() {

	//	tableau.connectionName = "Survey Monkey Data";
	// 	tableau.submit();
		var survey_id = $('#surveys').val().trim();
		if (survey_id == '-1') {
			alert('Error: no surveys found on this account'); 
		} else {
			_getColumnHeaders(survey_id, accessToken); 
		}

	});

	var hasAuth = accessToken && accessToken.length > 0;

	if (hasAuth){
		//console.log('authenticated');
		request_survey_list(accessToken);
	}
	update_Auth_displays(hasAuth);
});

function update_Auth_displays(hasAuth){
	if (hasAuth) {
		$("#notsignedin").css('display', 'none');
		$("#signedin").css('display', 'inline');
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

function parse_survey_list(surveys){
	surveys.sort(date_compare); //sort by date modified

	console.log(surveys);
	if(surveys.length == 0) {
		$('#surveys').append('<option value=-1>No Surveys Found </option>'); 
		return; 
	}
	$('#surveys').empty(); 
	for (i = 0; i<surveys.length; i++){
		$('#surveys').append('<option ' + 'value=' + surveys[i].survey_id + '>' + surveys[i].title + '</option>'); 
	}
};

function date_compare(survey1, survey2){
	console.log(survey1.date_modified);
	var date1 = new Date(survey1.date_modified);
	var date2 = new Date(survey2.date_modified); 
	return -(date1-date2); 
}

var data;
function _getColumnHeaders(survey_id, accessToken){
	var req_url = api_url.base + api_url.survey_details + api_url.api_key;
	console.log(req_url);
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
			console.log("hi");
			if (textStatus != 'success' || jqXHR.responseJSON.errmsg ) {
				alert('survey details api failed'); 
			}
			console.log(jqXHR.responseJSON.data);
			data = jqXHR.responseJSON.data;
			parse_survey_details(data); 
        }

	});
};

function parse_survey_details(data){
	var page, question, type, answer; 
	var headers = []; 
	var fieldTypes = [];
	var id_to_question_name = {}; 
	var id_to_answer_name = {}; 
	for (i = 0; i < data.pages.length; i++){
		page = data.pages[i];
		for (j = 0; j < page.questions.length; j++){
			question = page.questions[j]; 
			type = question.type.family;
			if (type === 'single_choice'){
				headers.push(question.heading); 
				fieldTypes.push('string');
				id_to_question_name[question.question_id] = question.heading; 
				for  (k = 0; k < question.answers.length; k++){
					answer = question.answers[k];
					id_to_answer_name[answer.answer_id] = answer.text;
				}
			} else if (type === 'multiple_choice'){
				headers.push(question.heading);
				fieldTypes.push('string');
				id_to_question_name[question.question_id] = question.heading; 
				for  (k = 0; k < question.answers.length; k++){
					answer = question.answers[k];
					id_to_answer_name[answer.answer_id] = answer.text;
				}
			} else if (type === 'open_ended'){
				//do a if text when parsing
				if (question.answers.length === 0){
					//essay/comment style: 
					headers.push(question.heading); 
					id_to_question_name[question.question_id] = question.heading;
				} else {
					for  (k = 0; k < question.answers.length; k++){
						answer = question.answers[k];
						var header = question.heading + ' - ' + answer.text; 
						headers.push(header); 
						id_to_question_name[answer.answer_id] = header; 
					}
				}
				fieldTypes.push('string');
			} else if ( type === 'datetime'){
				headers.push(question.heading);
				fieldTypes.push('string');
				id_to_question_name[question.question_id] = question.heading; 
				for  (k = 0; k < question.answers.length; k++){
					answer = question.answers[k];
					id_to_answer_name[answer.answer_id] = answer.text;
				}
				fieldTypes.push('datetime');
			} else if (type === 'demographic'){
				//do a if text when parsing
				for  (k = 0; k < question.answers.length; k++){
					answer = question.answers[k];
					var header = question.heading + ' - ' + answer.text.trim(); 
					headers.push(header); 
					id_to_question_name[answer.answer_id] = header; 
				}
				fieldTypes.push('string');
			} else if (type === 'matrix'){
				for (k = 0; k < question.answers.length; k++){
					answer = question.answers[k]; 
					if (answer.type === 'col'){
						id_to_answer_name[answer.answer_id] = answer.text; 
					} else if (answer.type === 'row') {
						var header = question.heading + ' - ' + answer.text; 
						id_to_question_name[answer.answer_id] = header;
						headers.push(header);
						fieldTypes.push('string');
					} else {
						console.log('unsupported answer type in matrix');
					}
				}
			} else {
				console.log('unsupported type detected');
			}

		}
	}
	console.log(headers); 
	console.log(fieldTypes);
	console.log(id_to_question_name); 
	console.log(id_to_answer_name);
}



//-------------------------------------------------- //
//WDC-specific things
//-------------------------------------------------- //
var myConnector = tableau.makeConnector();

myConnector.init = function() {
	var accessToken = Cookies.get("accessToken");

	var hasAuth = (accessToken && accessToken.length > 0) || tableau.password.length > 0;
	hasAuth = null;
	update_Auth_displays(hasAuth); 

	if (tableau.phase == tableau.phaseEnum.interactivePhase || tableau.phase == tableau.phaseEnum.authPhase) {
		if (hasAuth) {	
			tableau.initCallback();
			tableau.password = accessToken;

			return;
		}
	} else {
		if (!hasAuth) {
			tableau.abortWithError("Don't have an access token. Giving up");
		}
	}

	tableau.initCallback();
};


myConnector.getColumnHeaders = function() {
	var fieldNames = ['activityType', 'activityID', 'activityCaloriesBurned', 'activityDistance', 'activityDuration', 'activityStart', 'activityEnd', 'activityHRAvg', 'activityHRPeak', 'activityHRLow', 'activityHREnding'];
    var fieldTypes = ['string', 'string', 'int', 'int', 'datetime', 'datetime', 'datetime', 'int', 'int', 'int', 'int'];	
	
  tableau.headersCallback(fieldNames, fieldTypes);
};


myConnector.getTableData = function(lastRecordToken) {
	if (lastRecordToken && lastRecordToken.length > 0) {
		requestMSHProfileByUrl(lastRecordToken);
	} else {
	    var accessToken = tableau.password;
	    requestMSHProfile(accessToken);	
	}
};


tableau.registerConnector(myConnector);

