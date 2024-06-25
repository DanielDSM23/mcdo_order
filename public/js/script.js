function htmlspecialchars(str) {
	if(typeof(str) == 'string'){
		const map = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#039;'
		};
		return str.replace(/[&<>"']/g, (m) => map[m]);
	}
	else{
		return str;
	}
}




const DOMAIN_NAME = window.location.hostname;

const PORT = location.port;

const HALF_SCREEN_WIDTH = window.innerHeight / 2;

const updateStateOfLine = () =>{
	$.get(`http://${DOMAIN_NAME}:${PORT}/api/is-line-open`, function (data, status) {
	isLineOpen = data;
	onOff(isLineOpen);
	})
	.done(function () {
		console.log('GET request succeeded');
	})
	.fail(function (jqXHR, textStatus, errorThrown) {
		console.error('GET request failed:', textStatus, errorThrown);
	});
}

let oldOrders = [];
let oldOrdersTime = [];
let jsonObjectCommands = [];


//get actual orders info


$.get(`http://${DOMAIN_NAME}:${PORT}/api/get-command`, function (ordersData, status) {
	oldOrders = ordersData;
	$.get(`http://${DOMAIN_NAME}:${PORT}/api/get-command-time`, function (ordersTimeData, status) {
		oldOrdersTime = ordersTimeData;
		for(let i = 0; i<oldOrdersTime.length; i++){
			let timerCount = Math.round(Math.abs((new Date().getTime() - new Date(oldOrdersTime[i]).getTime()) / 1000));
			timerCount = timerCount < 999 ? timerCount : 999;
			addCommand(oldOrders[i], timerCount);
		}
	})
	.done(function () {
		console.log('GET request succeeded');
	})
	.fail(function (jqXHR, textStatus, errorThrown) {
		console.error('GET request failed:', textStatus, errorThrown);
	});
})
.done(function () {
	console.log('GET request succeeded');
})
.fail(function (jqXHR, textStatus, errorThrown) {
	console.error('GET request failed:', textStatus, errorThrown);
});


let sec = null;
let isOrderSelected = false;
let orderSelected = null;
let isRecall = false;
let previousOrder = [];
let previousOrderDate  = [];
let previousOrderNumber = [];
let isFullWidthOrder = [];
let idPreviousOrder = 0;
let hiddenCommand = 0;
let isLineOpen = null;
updateStateOfLine();
let hasBeenDisconnected = false; 
let doThis = true;

const socket = io(`http://${DOMAIN_NAME}:${PORT}`); 

socket.on('message', (data) => {
	console.log('message event', data);
	addCommand(data);
});

socket.on('connect', () => {
	if(!$('.blinkInfo').hasClass('hidden')){
		$('.blinkInfo').addClass('hidden')
	}
	console.log('Socket.IO connection opened');
	console.log('Connection Status:', socket.connected);
	console.log(isLineOpen);
	if(hasBeenDisconnected){
		updateStateOfLine();
	}
	//socket.emit("lineOpen", isLineOpen);
	
});

socket.on('error', (error) => {
	console.log('Socket.IO error:', error);
});

socket.on('disconnect', (reason) => {
	console.log('Socket.IO connection closed:', reason);
	hasBeenDisconnected = true;
	$('.blinkInfo').removeClass("hidden");
});

socket.on("onoff", (arg) => {
	doThis ? onOff(arg) : doThis = true;
});

socket.on("bump", (arg) => {
	doThis ? bump() : doThis = true;
});

socket.on("next", (arg) => {
	if(arg){
		doThis ? next() : doThis = true;
	}
});

socket.on("recall", (arg) => {
	if(arg){
		doThis ? recall() : doThis = true;
	}
});

socket.on("reload", (arg) => {
	if(arg){
		location.reload();
	}
});

socket.on("add-product", (arg) => {
	if(arg){
		let commandName = arg.split(",")[0];
		let article = arg.split(",")[1];
		let quantity = + arg.split(",")[2];
		let category = arg.split(",")[3];
		addArticle(commandName, article, quantity, false, category); //commandName, article, quantity
	}
});

socket.on("remove-product", (arg) => {
	if(arg){
		let commandName = arg.split(",")[0];
		let article = arg.split(",")[1];
		let quantity = + arg.split(",")[2];
		let category = arg.split(",")[3];
		removeArticle(commandName, article, quantity, false, category); //commandName, article, quantity
	}
});

socket.on("cancel-state", (commandName) => {
	if(commandName){
		cancelCommand(commandName);
	}
});

socket.on("modify-state", (details) => {
	modifyCommandState(details.split(',')[0], details.split(',')[1]);
});

function timer(number){
	
	if(number==999){
		return 999;
	}
	else{
		return number+1;
	}
}

async function fetchDateTime() {
    return new Promise((resolve, reject) => {
      $.ajax({
        url: 'http://worldtimeapi.org/api/timezone/Europe/Paris',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
          const datetime = data.datetime;
          console.log('Datetime from WorldTimeAPI:', datetime);

          // Resolve the promise with the retrieved datetime
          resolve(datetime);
        },
        error: function(xhr, status, error) {
          console.error('Error fetching datetime:', error);

          // Reject the promise with the error message
          reject(error);
        }
      });
    });
  }

  async function dateTime() {
    try {
      const datetime = await fetchDateTime();
      console.log('Datetime received:', datetime);

      // Use the datetime as needed in your application
    } catch (error) {
      console.error('Error:', error);
    }
  }


function numberNextOrder(){
	if(orderSelected < $('.command').length){
		orderSelected++;
	}
	else{
		orderSelected = 1;
	}
	
}



function isCommandTouchingBottom() {
	var element = document.querySelector("div.command:last-of-type");
	var elementRect = element.getBoundingClientRect();

	return elementRect.bottom >= window.innerHeight - 31;
}


const nextPort = () =>{
	if(PORT == 8080){
		return 8082;
	}
	else if(PORT == 8082){
		return 8083;
	}

}


const bump = () => {
	socket.emit("bump", true);
	//let commandNumber = $(`.command:nth-child(${orderSelected})`).attr('value');
	//check if user has command selected
	if($('#selected').length == 0 || $('#selected .state').text() == "Total"){
		return;
	}
	//queries

	$.ajax({
		url: `http://${DOMAIN_NAME}:${PORT}/api/remove-command`,
		type: 'POST', 
		contentType: 'application/json',
		data: JSON.stringify({
			"number": orderSelected
		}),
		success: function(response) {
			console.log(response);
		},
		error: function(error) {
			console.error(error);
		}
	});			
	$.get(`http://${DOMAIN_NAME}:${PORT}/api/bump`, function (data, status) {
		console.log('Response:', data);
		console.log('Status:', status);
	})
	.done(function () {
		console.log('GET request succeeded');
	})
	.fail(function (jqXHR, textStatus, errorThrown) {
		console.error('GET request failed:', textStatus, errorThrown);
	});

	////
	let htmlCode =$("#selected.command").html();
	let width = $("#selected.command .order").width()
	let height = $("#selected.command .order").height()
	htmlCode = `<div class="stateRecall">`+htmlCode+'</div>';
	htmlCode = htmlCode.replace('class="bottom"', 'class="bottomRecall"');
	htmlCode = htmlCode.replace('class="order"', `class="order" w="${width}" h="${height}"`);
	htmlCode = htmlCode.replace('</p><p class="timer"', '<svg viewBox="8.465 7.343 286.871 115.363" xmlns="http://www.w3.org/2000/svg" style="background: white; height: 43px; border-radius: 7px; margin-left: 100px;position: relative; top: 5px;"> <defs> <linearGradient gradientUnits="userSpaceOnUse" x1="240.47" y1="124.439" x2="240.47" y2="238.789" id="gradient-0" gradientTransform="matrix(1, 0, 0, 1, -88.565019, -116.591927)"> <stop offset="0" style="stop-color: rgba(121, 88, 147, 0.68)"/> <stop offset="1" style="stop-color: rgba(68, 50, 83, 0.79); stop-opacity: 0.22;"/> </linearGradient> <linearGradient gradientUnits="userSpaceOnUse" x1="240.47" y1="124.439" x2="240.47" y2="238.789" id="gradient-1" gradientTransform="matrix(1, 0, 0, 1, -88.565019, -116.591927)"> <stop offset="0" style="stop-color: rgba(0, 0, 0, 1)"/> <stop offset="1" style="stop-color: rgba(0, 0, 0, 1)"/> </linearGradient> </defs> <rect x="8.968" y="7.847" width="285.874" height="114.35" rx="21.803" ry="21.803" style="fill-rule: nonzero; paint-order: fill; fill: url(#gradient-0); stroke: url(#gradient-1);"/> <text style="fill: rgb(88, 68, 105); font-family: Verdana; font-size: 15.7px; white-space: pre;" transform="matrix(2.982788, 0, 0, 2.870968, -312.736847, -469.538177)" x="132.848" y="191.143">Recall</text> </svg></p><p class="timer"');
	htmlCode = htmlCode.replace('background-color: red;', '');
	//storing order to array
	previousOrder.unshift(htmlCode);
	var actualDate = new Date();
	var secondsToSubtract = $(`.command:nth-child(${orderSelected})   .timer`).text();
	previousOrderDate.unshift(actualDate.setSeconds(actualDate.getSeconds() - secondsToSubtract));
	previousOrderNumber.unshift( $(`.command:nth-child(${orderSelected})`).attr('value') );
	//
	$('#selected.command').attr('style') === 'width: 100%;' ? isFullWidthOrder.unshift(true) : isFullWidthOrder.unshift(false);
	$("#selected.command").remove();
	$(`.command:nth-child(${orderSelected})`).removeAttr('id');//clear id actual order
	orderSelected = 1;
	$(`.command:nth-child(${orderSelected})`).attr('id', 'selected'); //select next Order
	$(`.command.hidden:first`).removeClass("hidden");
	hiddenCommand > 0 && hiddenCommand--;
	$("#pendingOrders").empty();
	$("#pendingOrders").append(`${htmlspecialchars(hiddenCommand)} More Pending Orders >>`);
	if(hiddenCommand == 0){
		$("#pendingOrders").css("visibility", "hidden");
	}
	//recover json code and send to the OAT
	console.log(jsonObjectCommands);
	jsonToSend = jsonObjectCommands[orderSelected - 1]
	console.log(jsonToSend);
	jsonObjectCommands.splice(orderSelected - 1, 1);
	
	//Send JSON //TODO
	var settings = {
		"url": `http://localhost:${nextPort()}/api/send-message`,
		"method": "POST",
		"timeout": 0,
		"headers": {
		  "Content-Type": "application/json"
		},
		"data": JSON.stringify(jsonToSend),
	  };
	  
	  $.ajax(settings).done(function (response) {
		console.log(response);
		setTimeout(() => {
			var settings = {
				"url": `http://localhost:${nextPort()}/api/modify-state`,
				"method": "POST",
				"timeout": 0,
				"headers": {
				  "Content-Type": "application/json"
				},
				"data": JSON.stringify({
				  "commandName": jsonToSend.order.order_number,
				  "newState": "Payé"
				}),
			  };
			  
			  $.ajax(settings).done(function (response) {
				console.log(response);
			  });
		}, 300);

	  });
	
	console.log("impression ticket");
}


const next = () => {
	if(isOrderSelected && !isRecall){
		$(`.command:nth-child(${orderSelected})`).removeAttr('id');//clear id actual order
		numberNextOrder();
		$(`.command:nth-child(${orderSelected})`).attr('id', 'selected'); //select next Order
	}
	else if(isRecall){
		//console.log(previousOrder+1 + "-----" +previousOrder)
		if(idPreviousOrder+1 < previousOrder.length){
			idPreviousOrder++;
			$('#recallOrders').empty();
			$('#recallOrders').push(previousOrder[idPreviousOrder]);
			$('#recallOrders .timer').empty();
			let actualDate = new Date();
			let timerCount = (Math.floor((actualDate - previousOrderDate[idPreviousOrder])/1000)) < 999 ? Math.floor((actualDate - previousOrderDate[idPreviousOrder])/1000) : 999;
			$('#recallOrders .timer').text(timerCount);
			let recalibration = $('#recallOrders').height() > 500 ? `-` : `+`; 
			$('#recallOrders').css("top", `calc(50vh  ${ recalibration + " " + $('#recallOrders').height() }px / 2)`);
			isFullWidthOrder[idPreviousOrder] ? $('.stateRecall').css("width", "100%") : $('.stateRecall').removeAttr('style'); 
		}
	}
}


const onOff = (isLineO) => {
	if(isLineO){
		isLineOpen = true;
		socket.emit("lineOpen", isLineOpen);
		$("#stateLine").empty();
		$("#stateLine").css("color", "green");
		$("#stateLine").text(" ON");
	}
	else{
		isLineOpen = false;
		socket.emit("lineOpen", isLineOpen);
		$("#stateLine").empty();
		$("#stateLine").removeAttr('style');
		$("#stateLine").text("OFF");
	}
}

const recall = (orderToDisplay = null) => {
	if(orderToDisplay != null){
		$('#recallOrders').empty();
	}
	if(previousOrder.length!=0 && orderToDisplay == null){
		isRecall = !isRecall; 
	}
	if(isRecall == false){
		$('#recallOrders').empty();
		$("#recallWitness").css('visibility', 'hidden');
	}
	else if(isRecall == true){
		orderToDisplay == null ? idPreviousOrder=0 : idPreviousOrder=orderToDisplay;
		$("#recallWitness").css('visibility', 'visible');
		$('#recallOrders').append(previousOrder[idPreviousOrder]);
		isFullWidthOrder[idPreviousOrder] ? $('.stateRecall').css("width", "100%") : $('.stateRecall').removeAttr('style'); 
		$('#recallOrders .timer').empty();
		let actualDate = new Date();
		let timerCount = (Math.floor((actualDate - previousOrderDate[idPreviousOrder])/1000)) < 999 ? Math.floor((actualDate - previousOrderDate[idPreviousOrder])/1000) : 999;
		$('#recallOrders .timer').text(timerCount);
		let recalibration = $('#recallOrders').height() > 500 ? `-` : `+`; 
		$('#recallOrders').css("top", `calc(50vh  ${ recalibration + " " + $('#recallOrders').height() }px / 2)`);

	}
}

const addCommand = (jsonArray, timer = 0, state = "Total") => {
	jsonObjectCommands.push(jsonArray);
	//formattedTime = new Date().toLocaleTimeString('fr-FR', { hour12: false });
	numberCommand = `${htmlspecialchars(jsonArray.order.order_number)}`;
	//checking if order is LAD
	htmlCommand = `<div class="command" value="${numberCommand}">`;
	if(jsonArray.order.order_number.includes("@@")){
		htmlCommand += '<svg viewBox="0 0 164.799 103.699" xmlns="http://www.w3.org/2000/svg" style="height :55px; position:absolute;"><defs></defs><ellipse style="fill: rgb(216, 255, 189); stroke: rgb(75, 138, 8);" cx="82.791" cy="52.129" rx="79.877" ry="45"></ellipse><text style="white-space: pre; fill: rgb(75, 138, 8); font-family: Verdana, sans-serif; font-size: 40px;" x="43.161" y="63.779">LAD</text></svg>';
	}
	else if(jsonArray.order.order_number.includes("ESP")){
		htmlCommand += '<svg viewBox="0 0 164.799 103.699" xmlns="http://www.w3.org/2000/svg" style="height :55px; position:absolute;"><defs></defs><ellipse style="fill: rgb(255, 255, 255); stroke: rgb(0, 0, 0);" cx="82.791" cy="52.129" rx="79.877" ry="45"></ellipse><text style="white-space: pre; fill: black; font-family: Verdana, sans-serif; font-size: 40px;" x="45" y="63.779">ESP</text></svg>';
	}
	else{
		htmlCommand += '<svg viewBox="0 0 164.799 103.699" xmlns="http://www.w3.org/2000/svg" style="height :55px; position:absolute;"><defs></defs><ellipse style="fill: rgb(255, 255, 255); stroke: rgb(0, 0, 0);" cx="82.791" cy="52.129" rx="79.877" ry="45"></ellipse><text style="white-space: pre; fill: black; font-family: Verdana, sans-serif; font-size: 40px;" x="52" y="63.779">CB</text></svg>';
	}
	htmlCommand += `<p style="text-align: right; margin-right:10px;">${htmlspecialchars(numberCommand.split("|")[0].replace('ESP', ''))}</p>`;
	htmlCommand += `<div class="order" >`;
	//making divs for parsing
	let parsingHtml = `<div class="kitchen"></div>`; //red
	parsingHtml += `<div class="beverage"></div>`; //green
	parsingHtml += `<div class="fries"></div>`; //yellow
	parsingHtml += `<div class="dessert"></div>`; //blue
	parsingHtml += `<div class="sauce"></div>`; //blue

	let $tempParsingHtml = $('<div>').html(parsingHtml);
	//parsing command
	for(let i=0; i < jsonArray.order.items.length; i++){
		if(PORT != 8081){
			if(jsonArray.order.items[i].category == "kitchen"){
				$tempParsingHtml.find('.kitchen').append(`<p>${htmlspecialchars(jsonArray.order.items[i].quantity)} ${htmlspecialchars(jsonArray.order.items[i].item_name)}</p>`);
				
				for(let k=0; k < jsonArray.order.items[i].addons.length; k++){
					
					$tempParsingHtml.find('.kitchen').append(`<p class="indent"> <img src="svg/with.svg" style="width:75px;"/>    ${htmlspecialchars(jsonArray.order.items[i].addons[k])}</p>`);
				}
				for(let k=0; k < jsonArray.order.items[i].remove.length; k++){
					
					$tempParsingHtml.find('.kitchen').append(`<p class="indent"> <img src="svg/without.svg" style="width:75px;"/>    ${htmlspecialchars(jsonArray.order.items[i].remove[k])}</p>`);
				}
			}
		}
		if(PORT != 8080){
			if(PORT > 8081){
				if(jsonArray.order.items[i].category == "fries"){
					
					$tempParsingHtml.find('.fries').append(`<p>${htmlspecialchars(jsonArray.order.items[i].quantity)} ${htmlspecialchars(jsonArray.order.items[i].item_name)}</p>`);
					for(let k=0; k < jsonArray.order.items[i].remove.length; k++){
						$tempParsingHtml.find('.fries').append(`<p class="indent"> <img src="svg/without.svg" style="width:75px;"/>    ${htmlspecialchars(jsonArray.order.items[i].remove[k])}</p>`);
						
					}
				}
				if(jsonArray.order.items[i].category == "sauce"){
				
					$tempParsingHtml.find('.sauce').append(`<p>${htmlspecialchars(jsonArray.order.items[i].quantity)} ${htmlspecialchars(jsonArray.order.items[i].item_name)}</p>`);
				}
			}
			if(PORT == 8081 || PORT == 8083){
				if(jsonArray.order.items[i].category == "beverage"){
					
					$tempParsingHtml.find('.beverage').append(`<p>${htmlspecialchars(jsonArray.order.items[i].quantity)} ${htmlspecialchars(jsonArray.order.items[i].item_name)}</p>`);
						for(let k=0; k < jsonArray.order.items[i].remove.length; k++){
							$tempParsingHtml.find('.beverage').append(`<p class="indent"> <img src="svg/without.svg" style="width:75px;"/>    ${htmlspecialchars(jsonArray.order.items[i].remove[k])}</p>`);
							
						}
				}
				if(jsonArray.order.items[i].category == "dessert"){
					
					$tempParsingHtml.find('.dessert').append(`<p>${htmlspecialchars(jsonArray.order.items[i].quantity)} ${htmlspecialchars(jsonArray.order.items[i].item_name)}</p>`);
					for(let k=0; k < jsonArray.order.items[i].remove.length; k++){
						$tempParsingHtml.find('.dessert').append(`<p class="indent"> <img src="svg/without.svg" style="width:75px;"/>    ${htmlspecialchars(jsonArray.order.items[i].remove[k])}</p>`);
						
					}
				}
			}
	
			
		}
	}
	htmlCommand += $tempParsingHtml.html();
	htmlCommand += `</div><div class="bottom"><p style="margin :0px 5px;" class="state">${htmlspecialchars(state)}<p class="timer" style="text-align: right; margin-top: -55px; margin-right: 10px;">${htmlspecialchars(timer)}</p></p> </div></div>`;
	
	$("#actualOrders").append(htmlCommand);
	// resizing when too large 
	if($(`.command[value="${numberCommand}"]`).height() > HALF_SCREEN_WIDTH){
		$(`.command[value="${numberCommand}"]`).css('width', '100%')
		$(`.command[value="${numberCommand}"] .order`).css({
			'display': 'flex',
			'flex-flow': 'column wrap',
			'max-height': 'calc(50vh - 31px - 55px)'
		});

		$(`.command[value="${numberCommand}"] .kitchen, .command[value="${numberCommand}"] .fries, .command[value="${numberCommand}"] .beverage, .command[value="${numberCommand}"] .dessert, .command[value="${numberCommand}"] .sauce`).each(function() {
			$(this).css({
				'display': 'flex',
				'flex-flow': 'column wrap',
				'max-height': 'calc(50vh - 31px - 55px)'
			});
		});
		
	}

	// pending orders
	if(isCommandTouchingBottom()){
		$("div.command:last-of-type").addClass("hidden");
		hiddenCommand++;
		$("#pendingOrders").empty();
		$("#pendingOrders").append(`${htmlspecialchars(hiddenCommand)} More Pending Orders >>`);
		$("#pendingOrders").css({"visibility": "visible",
								 "left": `calc(100vw - ${$("#pendingOrders").width()}px)`});
	}

	
}

const modifyCommandState = (commandName, commandState) => {
	$(`.command[value="${commandName}"] .state`).text(commandState);
	//for recall
	let element = previousOrderNumber.indexOf(commandName);
	if(element != -1){
		previousOrderJQuery = $(previousOrder[element]);
		previousOrderJQuery.find(`.state`).empty().append(`${commandState} <svg viewBox="8.465 7.343 286.871 115.363" xmlns="http://www.w3.org/2000/svg" style="background: white; height: 43px; border-radius: 7px; margin-left: 100px;position: relative; top: 5px;"> <defs> <linearGradient gradientUnits="userSpaceOnUse" x1="240.47" y1="124.439" x2="240.47" y2="238.789" id="gradient-0" gradientTransform="matrix(1, 0, 0, 1, -88.565019, -116.591927)"> <stop offset="0" style="stop-color: rgba(121, 88, 147, 0.68)"></stop> <stop offset="1" style="stop-color: rgba(68, 50, 83, 0.79); stop-opacity: 0.22;"></stop> </linearGradient> <linearGradient gradientUnits="userSpaceOnUse" x1="240.47" y1="124.439" x2="240.47" y2="238.789" id="gradient-1" gradientTransform="matrix(1, 0, 0, 1, -88.565019, -116.591927)"> <stop offset="0" style="stop-color: rgba(0, 0, 0, 1)"></stop> <stop offset="1" style="stop-color: rgba(0, 0, 0, 1)"></stop> </linearGradient> </defs> <rect x="8.968" y="7.847" width="285.874" height="114.35" rx="21.803" ry="21.803" style="fill-rule: nonzero; paint-order: fill; fill: url(#gradient-0); stroke: url(#gradient-1);"></rect> <text style="fill: rgb(88, 68, 105); font-family: Verdana; font-size: 15.7px; white-space: pre;" transform="matrix(2.982788, 0, 0, 2.870968, -312.736847, -469.538177)" x="132.848" y="191.143">Recall</text> </svg>`);
		previousOrder[element] = `<div class="stateRecall">`+previousOrderJQuery.html()+`</div>`;
		if(idPreviousOrder == element && isRecall){
			recall(element);
		}
	}
}

const cancelCommand = (commandName) => {
	let width = $(`.command[value="${commandName}"] .order`).width();
	let height = $(`.command[value="${commandName}"] .order`).height();
	$(`.command[value="${commandName}"] .order`).css("background-color", "purple");
	$(`.command[value="${commandName}"] .order`).prepend(
		`<svg height="${height}" width="${width}" style="position: absolute;">
  			<line x1="0" y1="0" x2="${width}" y2="${height}" stroke="red" stroke-width="1"></line>
  			<line x1="0" y1="${height}" x2="${width}" y2="0" stroke="red" stroke-width="1"></line>
		</svg>`);
	//for recall
	let element = previousOrderNumber.indexOf(commandName);
	if(element != -1){
		previousOrderJQuery = $(previousOrder[element]);
		width = previousOrderJQuery.find(`.order`).attr("w");
		height = previousOrderJQuery.find(`.order`).attr("h");
		previousOrderJQuery.find(`.order`).css("background-color", "purple");
		previousOrderJQuery.find(`.order`).prepend(
			`<svg height="${height}" width="${width}" style="position: absolute;">
  				<line x1="0" y1="0" x2="${width}" y2="${height}" stroke="red" stroke-width="1"></line>
  				<line x1="0" y1="${height}" x2="${width}" y2="0" stroke="red" stroke-width="1"></line>
			</svg>`
		);
		previousOrder[element] = `<div class="stateRecall">`+previousOrderJQuery.html()+`</div>`;
		if(idPreviousOrder == element && isRecall){
			recall(element);
		}
	}
	modifyCommandState(commandName, "Annulé");

}

const isDisplayable = (category) => {
	if(category == "kitchen" && PORT != 8081){ return true; }
	else if(category == "fries" && PORT >= 8082){ return true; }
	else if(category == "sauce" && PORT >= 8082){ return true; }
	else if(category == "beverage" && ( PORT == 8081 || PORT == 8083 )){ return true; }
	else{ return false; }
}

const addArticle = (commandName, article, quantity, displayPlus = false, category = "") => {
	firstProductBeverage = false;
	if(PORT == 8081){
		if($(`.command[value="${commandName}"]`).length == 0){
			if(category == "beverage"  || category == "dessert"){
				console.log("quantity : ", quantity);
				const orderJson = {
					order: {
					  order_number: commandName,
					  items: [
						{
						  item_name: article,
						  quantity: quantity,
						  addons: [],
						  remove: [],
						  category: category
						}
					  ]
					}
				  };
				addCommand(orderJson);
				firstProductBeverage = true;
			}
		}
	}
	// add to client side array
	let elementIndexCommand = null;
	for(let i=0; i<jsonObjectCommands.length; i++){
		if(jsonObjectCommands[i]['order']['order_number'] == commandName){
		elementIndexCommand = i;
		console.log(i);
		break;
		}
	}
	let elementProduct = null;
	for(let i=0; i<jsonObjectCommands[elementIndexCommand]['order']['items'].length; i++){
		if (jsonObjectCommands[elementIndexCommand]['order']['items'][i]["item_name"] == article){
		elementProduct = i;
		} 
	}
	console.log(elementProduct);
	if(elementProduct == null){ //not same product
		if(elementIndexCommand != null){
		let newItem={
			item_name: article,
			quantity: quantity,
			addons: [],
			remove: [],
			category: category
		};
		jsonObjectCommands[elementIndexCommand].order.items.push(newItem);
		console.log("added");
		}
	}
	else{ //same product
		actualQuantity = jsonObjectCommands[elementIndexCommand]['order']['items'][elementProduct]["quantity"];
		newQuantity = actualQuantity + quantity;
		jsonObjectCommands[elementIndexCommand]['order']['items'][elementProduct]["quantity"] = newQuantity;
	}
	if(!isDisplayable(category) || firstProductBeverage){
		console.log("nope");
		return;
	}
	let commandArray = [];
	let commandArrayQuantity = [];
	$(`.command[value="${commandName}"] .order .${category} p`).each(function() {
		var textParts = $(this).text().split(' '); 
		var quantity = textParts[0]; 
		var itemName = textParts.slice(1).join(' '); 
		commandArrayQuantity.push(quantity); 
		commandArray.push(itemName); 
	});
	console.log(commandArray);
	if(commandArray.indexOf(article)!=-1){
		let index = commandArray.indexOf(article);
		let outQuantity = +commandArrayQuantity[index] + quantity;
		console.log(`.command[value="${commandName}"] .order .${category} p:nth-child(${index + 1})`);
		$(`.command[value="${commandName}"] .order .${category} p:nth-child(${index + 1})`).empty();
		let plusImage = displayPlus ? `<img src="svg/add.svg" alt="add" style="width:70px;" class="blinkGradualy"/>` : ``;
		if($(`.command[value="${commandName}"] .order .${category} p:nth-child(${index + 1})`).hasClass('text-strikethrough')){
			$(`.command[value="${commandName}"] .order .${category} p:nth-child(${index + 1})`).removeClass('text-strikethrough');
			outQuantity = quantity;
		}
		$(`.command[value="${commandName}"] .order .${category} p:nth-child(${index + 1})`).append(`${plusImage}${htmlspecialchars(outQuantity)} ${htmlspecialchars(article)}`);
		$(`.command[value="${commandName}"] .order .${category} p:nth-child(${index + 1})`).css({"display": "flex", 
																					"align-items": "center"});
	}
	else{
		$(`.command[value="${commandName}"] .order .${category}`).append(`<p>${htmlspecialchars(quantity)} ${htmlspecialchars(article)}</p>`);
	}

}

const removeArticle = (commandName, article, quantity, displayLess = false, category = "") => {
	//remove in jsonObjectCommand client side array.
	let order = jsonObjectCommands.find(order => order.order.order_number === commandName);
	if (order) {
		const itemIndex = order.order.items.findIndex(item => item.item_name === article && item.category === category);
		if (itemIndex > -1) {
			const item = order.order.items[itemIndex];
			if (item.quantity > quantity) {
				item.quantity -= quantity;
			}
			else {
				order.order.items.splice(itemIndex, 1);
			}
		}
	}
	console.log(category);
	let commandArray = [];
	let commandArrayQuantity = [];
	$(`.command[value="${commandName}"] .order .${category} p`).each(function() {
		var textParts = $(this).text().split(' '); 
		var quantity = textParts[0]; 
		var itemName = textParts.slice(1).join(' '); 
		commandArrayQuantity.push(quantity); 
		commandArray.push(itemName); 
	});
	console.log(commandArray);
	let index = commandArray.indexOf(article);
	let outQuantity = +commandArrayQuantity[index] - quantity;
	if(outQuantity <= 0){
		outQuantity = +commandArrayQuantity[index];
		$(`.command[value="${commandName}"] .order .${category} p:nth-child(${index + 1}) > img`).remove();
		$(`.command[value="${commandName}"] .order .${category} p:nth-child(${index + 1})`).addClass('text-strikethrough');
		displayLess = false;
		
	}
	$(`.command[value="${commandName}"] .order .${category} p:nth-child(${index + 1})`).empty();
	let lessImage = displayLess ? `<img src="svg/remove.svg" alt="add" style="width:70px;" class="blinkGradualy"/>` : ``;
	$(`.command[value="${commandName}"] .order .${category} p:nth-child(${index + 1})`).append(`${lessImage}${htmlspecialchars(outQuantity)} ${htmlspecialchars(article)}`);
	if(displayLess) $(`.command[value="${commandName}"] .order .${category} p:nth-child(${index + 1})`).css({"display": "flex", 
																								"align-items": "center"});
	

}

const defineNameLine = () => {
	const arrayNameLines = ["Kitchen", "Beverage", "OAT", "Verif"];
	$('title').text(arrayNameLines[PORT - 8080]);
	$('#line').contents().filter(function() {
		return this.nodeType === 3; // Node type 3 is a text node
	  }).first().replaceWith(arrayNameLines[PORT - 8080]);
}

$( "document" ).ready(function() {
	if(PORT == 8080){
		$(".buttons-layout").css({
			"display":"none"
		})
	}
	defineNameLine();
	onOff(isLineOpen);
	//readTextFile();
    var x = setInterval(function() { 
    	$( ".timer" ).each(function() {
	  		sec = parseInt($(this).text());
    		sec = timer(sec);
			if(sec > 59){
				$( this ).parent( ".bottom" ).css({
					"background-color": "red",
					"transition": "background-color 1s"
				  });
			}
    		$(this).empty();
    		$(this).text(sec);
		});
    	
     }, 1000);
	
	 var hour = setInterval(function() { 
		let datetime = new Date();
		$("#hour").empty();
		$("#hour").text(("0" + datetime.getHours()).slice(-2)+':'+("0" + datetime.getMinutes()).slice(-2)+':'+("0" + datetime.getSeconds()).slice(-2));
		if($('div').hasClass('command') && !isOrderSelected){
			$('.command:first').attr('id', 'selected');
			isOrderSelected = true;
			orderSelected = 1;
		}
		if(!$('div').hasClass('command')){
			isOrderSelected = false;
		}
     }, 500);
	 
	document.addEventListener('keypress', (event)=>{
		let keyCode = event.keyCode ? event.keyCode : event.which;
		console.log(keyCode);
		if(keyCode === 13) { 
			doThis = false;
			bump();
		}
		if(keyCode === 110) { 
			doThis = false;
			$.get(`http://${DOMAIN_NAME}:${PORT}/api/next`, function (data, status) {
				console.log('Response:', data);
				console.log('Status:', status);
			})
			.done(function () {
				console.log('GET request succeeded');
			})
			.fail(function (jqXHR, textStatus, errorThrown) {
				console.error('GET request failed:', textStatus, errorThrown);
			});
			next();
		}
		if(keyCode === 111) { //open/close line
			doThis = false;
			$.get(`http://${DOMAIN_NAME}:${PORT}/api/onoff`, function (data, status) {
				console.log('Response:', data);
				console.log('Status:', status);
			})
			.done(function () {
				console.log('GET request succeeded');
			})
			.fail(function (jqXHR, textStatus, errorThrown) {
				console.error('GET request failed:', textStatus, errorThrown);
			});
			onOff(!isLineOpen);
		}
		if(keyCode === 114) { 
			doThis = false;
			$.get(`http://${DOMAIN_NAME}:${PORT}/api/recall`, function (data, status) {
				console.log('Response:', data);
				console.log('Status:', status);
			})
			.done(function () {
				console.log('GET request succeeded');
			})
			.fail(function (jqXHR, textStatus, errorThrown) {
				console.error('GET request failed:', textStatus, errorThrown);
			});
			recall();
		}
	});

	


});
