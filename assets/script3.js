$(function() {
	//REPLACE DEVICE UNIQUE IDENTIFIER / SERIAL NUMBER HERE
	var myDevice = 'B4:21:8A:F0:2E:CE'; //default unique device identifier  B4:21:8A:F0:36:58
	//REPLACE WITH FULL APP DOMAIN IF RUNNING LOCALLY, OTHEWISE LEAVE AS "/"
	var app_domain = '/';
	var data = [];
	var graphPick="all";
	var updateInterval = 1000; //milliseconds
	var timeWindow = 10; //minutes
	var red_color = '#6B0023';
	var graphType = "pressure";

    var graph_options = {
        series: {
            lines: { show: true, lineWidth: 1.5, fill: 0.1},
            points: { show: true, radius: 0.7, fillColor: "#41C4DC" }
        },
		legend: {
			position: "sw",
			backgroundColor: "#111111",
			backgroundOpacity: 0.8
		},
        yaxis: {
			min: 0,
			max: 400
        },
        xaxis: {
			mode: "time",
			timeformat: "%I:%M %p",
			timezone:  "browser",
			ticks: 10
        },
        colors: ["#2C9DB6","#FF921E","#FF5847","#FFC647", "#5D409C", "#BF427B","#D5E04D" ]
	};

	$("#specificdevice3").text(myDevice);
	$("#currentdevice3").text(myDevice);
	$("#appstatus3").text('Running');
	$("#appstatus3").css('color', '555555');
	$("#appconsole3").text('starting...');
	$("#appconsole3").css('color', '#555555');
	$("#placeholder3").text('Graph: Retrieving Data Now....');

    function fetchData() {
		
		console.log('fetching data from Murano');
        $("#appconsole3").text('Fetching Data For '+myDevice+' From Server...');
		$("#appconsole3").css('color', '#555555');

        // recent data is grabbed as newdata
        function onDataReceived(newdata) {
			$("#appstatus3").text('Running');
			$("#appstatus3").css('color', '555555');
			$("#appconsole3").text('Processing Data');
			$("#appconsole3").css('color', '#555555');
			var data_to_plot = [];
			//Load all the data in one pass; if we only got partial
			// data we could merge it with what we already have.
            //console.log(series)
			console.log(newdata);

			//check if newdata has data
			if (jQuery.isEmptyObject(newdata.timeseries.values)){
            //newdata has no data
            //Database error
            console.log('no data in selected window, check device')
            $("#appconsole3").text('No data found in window for this device');
            $("#placeholder3").text('Graph: Data Not Found for: '+myDevice);
			}else{
				//newdata has data
				console.log('valid data return for: '+myDevice);
				//for each column in the newdata from timeseries 
				for (j = 1; j < newdata.timeseries.columns.length; j++){
					var data = [];
					//set data from newdata to raw_data
					var raw_data = newdata.timeseries.values
					var friendly = newdata.timeseries.columns[j];
					var units = "";
					var last_val;
					//check name of column and use correct unit
					if (friendly == "temperature"){
						units = "F";
						friendly = "Temperature";
				
					}else if (friendly == "flow"){
						units = "GPM";
						friendly = "Flow";
						
					}else if(friendly == "pressure"){
						units = "PSI";
						friendly = "Pressure";
						
					}

					console.log(raw_data, j);

					// reformat data for flot
					for (var i = raw_data.length - 1; i >= 0; i--) {
						if (raw_data[i][j] != null)
						data.unshift([raw_data[i][0],raw_data[i][j]])
					}
					
					//var currentArray = data[data.length-1];
					//var currentval = currentArray[1];
					//changeCurrentValue(currentVal, friendly);
					
					// only push if data returned
					if(graphType == "all"||(graphType=="temper" && friendly == "Temperature")||(graphType=="press" && friendly == "Pressure")||(graphType == "flow"&& friendly == "Flow")){
						
						if (data.length > 0) {
							last_val = data[data.length-1]
							// put data into data_to_plot
							data_to_plot.push({
								label: friendly + ' - '+ last_val[1] + ' ' +units,
								data: data,
								units: units
							});
							
                            changeCurrentValue(last_val[1],friendly);
                            
						}
					}
				}
				$("#placeholder3").text('');
				$.plot("#placeholder3", data_to_plot, graph_options);
				$("#appconsole3").text('Data Plotted');
				$("#appconsole3").css('color', '#555555');
			}
			
			if (updateInterval != 0){
				setTimeout(fetchData, updateInterval);
			}
		}

        function onError( jqXHR, textStatus, errorThrown) {
			console.log('error: ' + textStatus + ',' + errorThrown);
			$("#appconsole3").text('No Server Response');
			$("#appstatus3").text('Server Offline');
			$("#appstatus3").css('color', red_color);
			if (updateInterval != 0){
				setTimeout(fetchData, updateInterval+3000);
			}
        }

		$.ajax({
			url: app_domain+"development/device/data?identifier="+myDevice+"&window="+timeWindow,
			type: "GET",
			dataType: "json",
			success: onDataReceived,
			crossDomain: true,
			error: onError,
			statusCode: {
				504: function() {
					console.log( "server not responding" );
					$("#appstatus3").text('Server Not Responding 504');
					$("#appstatus3").css('color', red_color);
				}
			}
			,timeout: 10000
        });

	}
	
	function changeCurrentValue(valueChange, valueColumn){
		
		if (valueColumn == "Temperature"){
			$("#currTemp3").text(valueChange);
			
		}else if(valueColumn == "Pressure"){
			$("#currPres3").text(valueChange);
			
		}else if(valueColumn == "Flow"){
			$("#currFlow3").text(valueChange);
		}	
	}
	
	$("#graphPick3").val(graphPick).change(function () {
		selectedValue = $("#graphPick3").val();
		if (selectedValue == "temperature"){
			graphType = "temper";
			
		}else if(selectedValue == "all"){
			graphType = "all";
			
		}else if(selectedValue == "pressure"){
			graphType = "press";
			
		}else if(selectedValue == "flow"){
			graphType = "flow";
			
		}else if(selectedValue == "humidity"){
			graphType = "humid"
		}
	});

	// Set up the control widget
	// get update interval from html
	$("#updateInterval3").val(updateInterval).change(function () {
		var v = $(this).val();
		if (v && !isNaN(+v)) {
			if(updateInterval == 0)
				{setTimeout(fetchData, 1000);} //updates were turned off, start again
			updateInterval = +v;
			if (updateInterval > 20000) {
				updateInterval = 20000;
			}
			$(this).val("" + updateInterval);

		}
	});
	//get timewindow from html
	$("#timeWindow3").val(timeWindow).change(function () {
		var v = $(this).val();
		if (v && !isNaN(+v)) {
			timeWindow = +v;
			if (timeWindow < 1) {
				timeWindow = 1;
			} else if (timeWindow > 360) {
				timeWindow = 360;
			}
			$(this).val("" + timeWindow);
		}
	});
	//change specific device to current device
	$("#specificdevice3").val(myDevice).change(function () {
		var v = $(this).val();
		if (v) {
			myDevice = v;
			console.log('new device identity:' + myDevice);
			$(this).val("" + myDevice);
			$("#currentdevice3").text(myDevice);
			$("#placeholder3").text('Graph: Retrieving New Device Data Now....');
		}
	});

	fetchData();

	$("#footer").prepend("Exosite Murano Example");
});
