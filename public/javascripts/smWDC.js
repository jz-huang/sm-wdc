

var config = {
	redirect_uri: 'http://localhost:8080/redirect',
	client_id: 'sm_jhuang8598', 
	response_type: 'code',
	api_key: '5c4x5n79vbfqr95pc2x5u87y'
}


$(document).ready(function() {
	//console.log("hello");
	var accessToken = Cookies.get("accessToken");
	$('#login').click(function(){
		console.log("hello world");
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
	
	// $("#getDataButton").click(function() {
	// 	tableau.connectionName = "Survey Monkey Data";
	// 	tableau.submit();
	// });

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
	} else {
		$("#notsignedin").css('display', 'inline');
		$("#signedin").css('display', 'none');
		$("#getDataButton").css('display', 'none');
		$("#login").css('display', 'inline'); 
	}
};

function request_survey_list(accessToken){

	var param = {api_key: config.api_key};
	var SM_API_BASE = 'https://api.surveymonkey.net';
	var SURVEY_LIST_ENDPOINT = '/v2/surveys/get_survey_list';
	var req_url = SM_API_BASE + SURVEY_LIST_ENDPOINT + "?" + jQuery.param(param);
	var xhr = $.ajax({
		url: req_url,
		type: 'POST',
		data: '{}',
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
			//alert(textStatus);
            //alert(jqXHR.responseJSON.data.surveys[0].survey_id);
        }

	});

};



//-------------------------------------------------- //
//WDC-specific things
//-------------------------------------------------- //
// var myConnector = tableau.makeConnector();

// myConnector.init = function() {
// 	var accessToken = Cookies.get("accessToken");

// 	var hasAuth = (accessToken && accessToken.length > 0) || tableau.password.length > 0;
// 	hasAuth = null;
// 	update_Auth_displays(hasAuth); 

// 	if (tableau.phase == tableau.phaseEnum.interactivePhase || tableau.phase == tableau.phaseEnum.authPhase) {
// 		if (hasAuth) {	
// 			tableau.initCallback();
// 			tableau.password = accessToken;

// 			return;
// 		}
// 	} else {
// 		if (!hasAuth) {
// 			tableau.abortWithError("Don't have an access token. Giving up");
// 		}
// 	}

// 	tableau.initCallback();
// };


// myConnector.getColumnHeaders = function() {
// 	var fieldNames = ['activityType', 'activityID', 'activityCaloriesBurned', 'activityDistance', 'activityDuration', 'activityStart', 'activityEnd', 'activityHRAvg', 'activityHRPeak', 'activityHRLow', 'activityHREnding'];
//     var fieldTypes = ['string', 'string', 'int', 'int', 'datetime', 'datetime', 'datetime', 'int', 'int', 'int', 'int'];	
	
//   tableau.headersCallback(fieldNames, fieldTypes);
// };


// myConnector.getTableData = function(lastRecordToken) {
// 	if (lastRecordToken && lastRecordToken.length > 0) {
// 		requestMSHProfileByUrl(lastRecordToken);
// 	} else {
// 	    var accessToken = tableau.password;
// 	    requestMSHProfile(accessToken);	
// 	}
// };


// tableau.registerConnector(myConnector);


// MS Health Data Properties (available)

// Run
/*
PerformanceSummary
DistanceSummary
PausedDuration
SplitDistance
Id 
UserId
DeviceId
StartTime
EndTime
DayId
CreatedTime
CreatedBy
Name
Duration
ActivityType
CaloriesBurnedSummary
HeartRateSummary
ActivitySegments
MinuteSummary
MapPoints
*/


// Bike (same as Run)
/*
PerformanceSummary
DistanceSummary
PausedDuration
SplitDistance
Id 
UserId
DeviceId
StartTime
EndTime
DayId
CreatedTime
CreatedBy
Name
Duration
ActivityType
CaloriesBurnedSummary
HeartRateSummary
ActivitySegments
MinuteSummary
MapPoints
*/


// FreePlay (same as Run/Bike but missing two)
/*
PerformanceSummary		xxx not in FreePlay
DistanceSummary			xxx not in FreePlay
PausedDuration
SplitDistance
Id 
UserId
DeviceId
StartTime
EndTime
DayId
CreatedTime
CreatedBy
Name
Duration
ActivityType
CaloriesBurnedSummary
HeartRateSummary
ActivitySegments
MinuteSummary
MapPoints
*/