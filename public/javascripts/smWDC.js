(function(){

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


		var survey_id = $('#surveys').val().trim();
		if (survey_id == '-1') {
			alert('Error: no surveys found on this account'); 
		} else {
			//_getRespondentList(survey_id, accessToken);

			tableau.connectionName = 'Survey Monkey Data' + $('#surveys option:selected').text();
			tableau.connectionData = survey_id; 
			tableau.alwaysShowAuthUI = true;
			tableau.submit();
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

	//console.log(surveys);
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
	//console.log(survey1.date_modified);
	var date1 = new Date(survey1.date_modified);
	var date2 = new Date(survey2.date_modified); 
	return -(date1-date2); 
}

var data, h, f;
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
			if (textStatus != 'success' || jqXHR.responseJSON.errmsg ) {
				alert('survey details api failed'); 
			}
			//console.log(jqXHR.responseJSON.data);
			//data = jqXHR.responseJSON.data;
			parse_survey_details(jqXHR.responseJSON.data); 
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
					fieldTypes.push('string');
				} else {
					for  (k = 0; k < question.answers.length; k++){
						answer = question.answers[k];
						var header = question.heading + ' - ' + answer.text; 
						headers.push(header); 
						id_to_question_name[answer.answer_id] = header; 
						fieldTypes.push('string');
					}
				}
			} else if ( type === 'datetime'){
				for  (k = 0; k < question.answers.length; k++){
					answer = question.answers[k];
					var header = question.heading + ' - ' + answer.text.trim(); 
					headers.push(header); 
					id_to_question_name[answer.answer_id] = header; 
					fieldTypes.push('datetime');
				}
			} else if (type === 'demographic'){
				//do a if text when parsing
				for  (k = 0; k < question.answers.length; k++){
					answer = question.answers[k];
					var header = question.heading + ' - ' + answer.text.trim(); 
					headers.push(header); 
					id_to_question_name[answer.answer_id] = header; 
					fieldTypes.push('string');
				}
				
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
	var transfer_data = []; 
	transfer_data.push(tableau.connectionData); 
	transfer_data.push(id_to_question_name);
	transfer_data.push(id_to_answer_name); 
	tableau.connectionData = JSON.stringify(transfer_data);
	tableau.headersCallback(headers, fieldTypes);
	// h = headers;
	// f = fieldTypes;
	// console.log(headers.length); 
	// console.log(fieldTypes.length);
	// console.log(id_to_question_name); 
	// console.log(id_to_answer_name);
};

function _getData(survey_id, accessToken){
	_getRespondentList(survey_id, accessToken);
};

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
				alert('respondents api failed'); 
			}
			//alert("respondent list api worked!");
			data = jqXHR.responseJSON.data;
			respondents = jqXHR.responseJSON.data.respondents; 
			for (i = 0; i < respondents.length; i++){
				respondent_ids.push(respondents[i].respondent_id); 
			}
			//console.log(JSON.stringify(respondent_ids));
			//console.log(respondents.length)
			setTimeout(_getResponses, 1000, survey_id, accessToken, respondent_ids, 0, 2, []);
			//_getResponses(survey_id, accessToken, respondent_ids);
        }
	});
};

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
	//console.log(JSON.stringify(request_body));
	var req_url = api_url.base + api_url.responses + api_url.api_key;
	console.log(req_url);
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

function parse_responses(data_array){
	//console.log(data_array[0][0].questions);
	var data_transferred = JSON.parse(tableau.connectionData);
	var id_to_question_name = data_transferred[1]; 
	var id_to_answer_name = data_transferred[2];
	console.log("parsing responses");
	console.log(id_to_question_name);
	data = data_array; 
	var questions; 
	for (i = 0; i < data_array.length; i++){
		questions = data_array[i][0].questions; 
		for (j = 0; j < questions.length; j++){
			
		}
	}
	tableau.dataCallback([], '0', false);
};


//-------------------------------------------------- //
//WDC-specific things
//-------------------------------------------------- //
var myConnector = tableau.makeConnector();

myConnector.init = function() {
	console.log('inside init');
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
	console.log("inside getColumn");
	var accessToken = tableau.password; 
	var survey_id = tableau.connectionData;
	_getColumnHeaders(survey_id, accessToken);

  	//tableau.headersCallback(fieldNames, fieldTypes);
  	// var fieldNames = ['Ticker', 'Day', 'Close'];
   //  var fieldTypes = ['string', 'string', 'string'];
   //  tableau.headersCallback(fieldNames, fieldTypes);
};


myConnector.getTableData = function(lastRecordToken) {
	var accessToken = tableau.password;
	var data_transferred = JSON.parse(tableau.connectionData);
	var survey_id = data_transferred[0]; 
	console.log(survey_id);
	setTimeout(_getRespondentList, 1000, survey_id, accessToken);
	//_getRespondentList(survey_id, accessToken);

	// var entry = {'Do you have any other comments, questions, or concerns?': 'HELL YES'
	// 			};
	// var datatoreturn = []; 
	// datatoreturn.push(entry);
	// tableau.dataCallback(datatoreturn, datatoreturn.length.toString(), false);
	// if (lastRecordToken && lastRecordToken.length > 0) {
	// 	requestMSHProfileByUrl(lastRecordToken);
	// } else {
	//     var accessToken = tableau.password;
	//     requestMSHProfile(accessToken);	
	// }
};


tableau.registerConnector(myConnector);

})();