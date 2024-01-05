// Create WebSocket connection.
const socket = await connectToServer();
socket.addEventListener("open", (event) => {
	console.log("connected");
});

if (socket.readyState === WebSocket.OPEN) {
	
	socket.addEventListener("message", (event) => {
		console.log("Message from server ", event.data);
	});

} else {
	console.error("WebSocket connection is not open.");
}


async function connectToServer() {    
	const ws = new WebSocket('ws://localhost:8081');
	return new Promise((resolve, reject) => {
		const timer = setInterval(() => {
			if(ws.readyState === 1) {
				clearInterval(timer);
				resolve(ws);
			}
		}, 10);
	});   
}
  
function timer(number){
	
	if(number==999){
		return 999;
	}
	else{
		return number+1;
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


let sec = null;
let isOrderSelected = false;
let orderSelected = null;
let isRecall = false;
let previousOrder = [];
let previousOrderDate  = [];
let idPreviousOrder = 0;
let hiddenCommand = 0;



function isCommandTouchingBottom() {
	var element = document.querySelector("div.command:last-of-type");
	var elementRect = element.getBoundingClientRect();

	return elementRect.bottom >= window.innerHeight;
}



const bump = () => {
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


const onOff = () => {
	let stateLine = $("#stateLine").text();
	if(stateLine == "OFF"){
		$("#stateLine").empty();
		$("#stateLine").css("color", "green");
		$("#stateLine").append(" ON");
	}
	else{
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

	}
}

const addCommand = (jsonText) => {
	console.log(jsonText);
	jsonArray = JSON.parse(jsonText);
	//checking if order is LAD
	htmlCommand = '<div class="command">';
	if(jsonArray.order.order_number.includes("@@")){
		htmlCommand += '<svg viewBox="0 0 164.799 103.699" xmlns="http://www.w3.org/2000/svg" style="height :55px; position:absolute;"><defs></defs><ellipse style="fill: rgb(216, 255, 189); stroke: rgb(75, 138, 8);" cx="82.791" cy="52.129" rx="79.877" ry="45"></ellipse><text style="white-space: pre; fill: rgb(75, 138, 8); font-family: Verdana, sans-serif; font-size: 40px;" x="43.161" y="63.779">LAD</text></svg>';
	}
	else{
		htmlCommand += '<svg viewBox="0 0 164.799 103.699" xmlns="http://www.w3.org/2000/svg" style="height :55px; position:absolute;"><defs></defs><ellipse style="fill: rgb(255, 255, 255); stroke: rgb(0, 0, 0);" cx="82.791" cy="52.129" rx="79.877" ry="45"></ellipse><text style="white-space: pre; fill: black; font-family: Verdana, sans-serif; font-size: 40px;" x="52" y="63.779">CB</text></svg>';
	}
	numberCommand = jsonArray.order.order_number;
	htmlCommand += `<p style="text-align: right; margin-right:10px;">${numberCommand}</p>`;
	//parsing command
	htmlCommand += `<div class="order">`;
	for(let i=0; i < jsonArray.order.items.length; i++){
		if(jsonArray.order.items[i].category == "Kitchen"){
			htmlCommand += `<p>${jsonArray.order.items[i].quantity} ${jsonArray.order.items[i].item_name}</p>`;
		}
	}
	htmlCommand += `</div><div class="bottom"><p style="margin :0px 5px;">payé<p class="timer" style="text-align: right; margin-top: -55px; margin-right: 10px;">0</p></p> </div></div>`;
	
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

$( "document" ).ready(function() {
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
		if($('div').hasClass('command') && isOrderSelected == false){
			$('.command:first').attr('id', 'selected');
			isOrderSelected = true;
			orderSelected = 1;
		}
		if(!$('div').hasClass('command')){
			isOrderSelected == false;
		}
     }, 500);
	 
	 document.addEventListener('keypress', (event)=>{
		let keyCode = event.keyCode ? event.keyCode : event.which;
		console.log(keyCode);
		if(keyCode === 13) { 
			bump();
		}
		if(keyCode === 110) { 
			next();
		}
		if(keyCode === 111) { //open/close line
			onOff();
		}
		if(keyCode === 114) { 
			recall();
		}
	  });

});
