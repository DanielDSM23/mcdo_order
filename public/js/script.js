const DOMAIN_NAME = window.location.hostname;

const updateStateOfLine = () =>{
	$.get(`http://${DOMAIN_NAME}:8080/is-line-open`, function (data, status) {
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



//get actual orders info


$.get(`http://${DOMAIN_NAME}:8080/get-command`, function (ordersData, status) {
	oldOrders = ordersData;
	$.get(`http://${DOMAIN_NAME}:8080/get-command-time`, function (ordersTimeData, status) {
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
let idPreviousOrder = 0;
let hiddenCommand = 0;
let isLineOpen = null;
updateStateOfLine();
let hasBeenDisconnected = false; // TODO : if socket reconnected after cdisconnection reload.
let doThis = true;

const socket = io(`http://${DOMAIN_NAME}:8080`); 

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



const bump = () => {
	socket.emit("bump", true);
	let htmlCode =$("#selected.command").html();
	htmlCode = '<div class="stateRecall">'+htmlCode+'</div>';
	htmlCode = htmlCode.replace('class="bottom"', 'class="bottomRecall"');
	htmlCode = htmlCode.replace('</p><p class="timer"', '<svg viewBox="8.465 7.343 286.871 115.363" xmlns="http://www.w3.org/2000/svg" style="background: white; height: 43px; border-radius: 7px; margin-left: 100px;position: relative; top: 5px;"> <defs> <linearGradient gradientUnits="userSpaceOnUse" x1="240.47" y1="124.439" x2="240.47" y2="238.789" id="gradient-0" gradientTransform="matrix(1, 0, 0, 1, -88.565019, -116.591927)"> <stop offset="0" style="stop-color: rgba(121, 88, 147, 0.68)"/> <stop offset="1" style="stop-color: rgba(68, 50, 83, 0.79); stop-opacity: 0.22;"/> </linearGradient> <linearGradient gradientUnits="userSpaceOnUse" x1="240.47" y1="124.439" x2="240.47" y2="238.789" id="gradient-1" gradientTransform="matrix(1, 0, 0, 1, -88.565019, -116.591927)"> <stop offset="0" style="stop-color: rgba(0, 0, 0, 1)"/> <stop offset="1" style="stop-color: rgba(0, 0, 0, 1)"/> </linearGradient> </defs> <rect x="8.968" y="7.847" width="285.874" height="114.35" rx="21.803" ry="21.803" style="fill-rule: nonzero; paint-order: fill; fill: url(#gradient-0); stroke: url(#gradient-1);"/> <text style="fill: rgb(88, 68, 105); font-family: Verdana; font-size: 15.7px; white-space: pre;" transform="matrix(2.982788, 0, 0, 2.870968, -312.736847, -469.538177)" x="132.848" y="191.143">Recall</text> </svg></p><p class="timer"');
	htmlCode = htmlCode.replace('background-color: red;', '');
	//storing order to array
	previousOrder.push(htmlCode);
	var actualDate = new Date();
	var secondsToSubtract = $(`.command:nth-child(${orderSelected})   .timer`).text();
	previousOrderDate.push(actualDate.setSeconds(actualDate.getSeconds() - secondsToSubtract));
	//
	$("#selected.command").remove();
	$(`.command:nth-child(${orderSelected})`).removeAttr('id');//clear id actual order
	orderSelected = 1;
	$(`.command:nth-child(${orderSelected})`).attr('id', 'selected'); //select next Order
	$(`.command.hidden:first`).removeClass("hidden");
	hiddenCommand > 0 && hiddenCommand--;
	$("#pendingOrders").empty();
	$("#pendingOrders").append(`${hiddenCommand} More Pending Orders >>`);
	if(hiddenCommand == 0){
		$("#pendingOrders").css("visibility", "hidden");
	}
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
			$('#recallOrders').append(previousOrder[idPreviousOrder]);
		}
	}
}


const onOff = (isLineO) => {
	if(isLineO){
		isLineOpen = true;
		socket.emit("lineOpen", isLineOpen);
		$("#stateLine").empty();
		$("#stateLine").css("color", "green");
		$("#stateLine").append(" ON");
	}
	else{
		isLineOpen = false;
		socket.emit("lineOpen", isLineOpen);
		$("#stateLine").empty();
		$("#stateLine").removeAttr('style');
		$("#stateLine").append("OFF");
	}
}

const recall = () =>{
	if(previousOrder.length!=0){
		isRecall = !isRecall;
	}
	if(isRecall == false){
		$('#recallOrders').empty();
		$("#recallWitness").css('visibility', 'hidden');
	}
	else if(isRecall == true){
		idPreviousOrder = 0;
		$("#recallWitness").css('visibility', 'visible');
		$('#recallOrders').append(previousOrder[idPreviousOrder]);
		$('#recallOrders .timer').empty();
		let actualDate = new Date();
		$('#recallOrders .timer').append(Math.floor((actualDate - previousOrderDate[idPreviousOrder])/1000));
		$('#recallOrders').css("top", `calc(50vh - ${$('#recallOrders').height()} / 2)`)

	}
}

const addCommand = (jsonArray, timer = 0, state = "Total") => {
	numberCommand = jsonArray.order.order_number;
	//checking if order is LAD
	htmlCommand = `<div class="command" value="${numberCommand}">`;
	if(jsonArray.order.order_number.includes("@@")){
		htmlCommand += '<svg viewBox="0 0 164.799 103.699" xmlns="http://www.w3.org/2000/svg" style="height :55px; position:absolute;"><defs></defs><ellipse style="fill: rgb(216, 255, 189); stroke: rgb(75, 138, 8);" cx="82.791" cy="52.129" rx="79.877" ry="45"></ellipse><text style="white-space: pre; fill: rgb(75, 138, 8); font-family: Verdana, sans-serif; font-size: 40px;" x="43.161" y="63.779">LAD</text></svg>';
	}
	else{
		htmlCommand += '<svg viewBox="0 0 164.799 103.699" xmlns="http://www.w3.org/2000/svg" style="height :55px; position:absolute;"><defs></defs><ellipse style="fill: rgb(255, 255, 255); stroke: rgb(0, 0, 0);" cx="82.791" cy="52.129" rx="79.877" ry="45"></ellipse><text style="white-space: pre; fill: black; font-family: Verdana, sans-serif; font-size: 40px;" x="52" y="63.779">CB</text></svg>';
	}
	htmlCommand += `<p style="text-align: right; margin-right:10px;">${numberCommand}</p>`;
	//parsing command
	htmlCommand += `<div class="order">`;
	for(let i=0; i < jsonArray.order.items.length; i++){
		if(jsonArray.order.items[i].category == "Kitchen"){
			htmlCommand += `<p>${jsonArray.order.items[i].quantity} ${jsonArray.order.items[i].item_name}</p>`;
		}
	}
	htmlCommand += `</div><div class="bottom"><p style="margin :0px 5px;" class="state">${state}<p class="timer" style="text-align: right; margin-top: -55px; margin-right: 10px;">${timer}</p></p> </div></div>`;
	
	$("#actualOrders").append(htmlCommand);
	if(isCommandTouchingBottom()){
		$("div.command:last-of-type").addClass("hidden");
		hiddenCommand++;
		$("#pendingOrders").empty();
		$("#pendingOrders").append(`${hiddenCommand} More Pending Orders >>`);
		$("#pendingOrders").css({"visibility": "visible",
								 "left": `calc(100vw - ${$("#pendingOrders").width()}px)`});
	}
}

const modifyCommandState = (commandName, commandState) => {
	$(`.command[value="${commandName}"] .state`).text(commandState);
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
	modifyCommandState(commandName, "Annulé");


}
$( "document" ).ready(function() {
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
    		$(this).append(sec);
		});
    	
     }, 1000);
	
	 var hour = setInterval(function() { 
		let datetime = new Date();
		$("#hour").empty();
		$("#hour").append(("0" + datetime.getHours()).slice(-2)+':'+("0" + datetime.getMinutes()).slice(-2)+':'+("0" + datetime.getSeconds()).slice(-2));
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
			$.ajax({
				url: `http://${DOMAIN_NAME}:8080/remove-command`,
				type: 'POST', // or 'DELETE' depending on your API endpoint
				contentType: 'application/json',
				data: JSON.stringify({
					"number": orderSelected
				}),
				success: function(response) {
					// Handle success response here
					console.log(response);
				},
				error: function(error) {
					// Handle error here
					console.error(error);
				}
			});			
			$.get(`http://${DOMAIN_NAME}:8080/bump`, function (data, status) {
				console.log('Response:', data);
				console.log('Status:', status);
			})
			.done(function () {
				console.log('GET request succeeded');
			})
			.fail(function (jqXHR, textStatus, errorThrown) {
				console.error('GET request failed:', textStatus, errorThrown);
			});
			bump();
		}
		if(keyCode === 110) { 
			doThis = false;
			$.get(`http://${DOMAIN_NAME}:8080/next`, function (data, status) {
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
			$.get(`http://${DOMAIN_NAME}:8080/onoff`, function (data, status) {
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
			$.get(`http://${DOMAIN_NAME}:8080/recall`, function (data, status) {
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
