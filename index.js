var AirbnbParser = {}
module.exports = AirbnbParser;



var rx = {
	subject: {
		inquiry: "^(RE: )?Inquiry at (.*) for ([a-z0-9 ]+) - ([a-z0-9 ]+), ([0-9]+)$",
		booking_inquiry: "^Booking inquiry for (.*) for (([a-z]+) ([0-9]+), ([0-9]{4})) - (([a-z]+) ([0-9]+), ([0-9]{4}))$",
		pending_inquiry: "^Pending: Reservation Request - (.*)$",
		reservation_request: "^Reservation Request - (.*)$",
		reservation_reply: "^(RE: )?Reservation request at (.*) for ([a-z0-9 ]+) - ([a-z0-9 ]+), ([0-9]+)$",
		reservation_confirmed: "^Reservation Confirmed - ([a-z0-9]+)$",
		reservation_canceled: "Reservation ([a-z0-9]+) on (([a-z]+) ([0-9]+), ([0-9]{4})) Canceled",
		reservation_reminder: "^Reservation Reminder - (.*)$",
		payout_received: "^Payout of (.*) sent$",
		read_review: "^Read ((.*)’s) review$",
		write_review: "^Write a review for (.*)$"
	}
}

var parserFuncs = {
	"inquiry": require("./parsers/inquiry").Parse(rx),
	"booking_inquiry": require("./parsers/booking_inquiry").Parse(rx),
	"pending_inquiry": require("./parsers/pending_inquiry").Parse(rx),
	"reservation_request": require("./parsers/reservation_request").Parse(rx),
	"reservation_reply": require("./parsers/reservation_reply").Parse(rx),
	"reservation_confirmed": require("./parsers/reservation_confirmed").Parse(rx),
	"reservation_canceled": require("./parsers/reservation_canceled").Parse(rx),
	"reservation_reminder": require("./parsers/reservation_reminder").Parse(rx),
	"payout_received": require("./parsers/payout_received").Parse(rx),
	"read_review": require("./parsers/read_review").Parse(rx),
	"write_review": require("./parsers/write_review").Parse(rx)
}

/**
 * Given a subject, it attempts to determine the message
 * type.
 * @param  {String} subject message subject
 * @return {[type]}         [description]
 */
function determineMsgType(subject) {
	var subjectRxKeys = Object.keys(rx.subject)
	for (var i = 0; i < subjectRxKeys.length; i++) {
		if (subject.match(new RegExp(rx.subject[subjectRxKeys[i]], "i"))) {
			return subjectRxKeys[i]
		}
	}
}

/**
 * Given an object describing an message from
 * airbnb, it attempts to parse the content using 
 * the information provided.
 * 
 * @param  {Object} message Message information
 *                          message.html 		HTML message from airbnb
 *                          message.subject 	Message subject
 *                          message.replyTo 	(Optional) ReplyTo email
 *
 * @param  {Func}   cb 		callback function
 */
AirbnbParser.parse = function (message, cb) {
	var msgType = determineMsgType(message.subject)
	if (msgType) {
		parserFuncs[msgType](msgType, message).then(function(data){
			cb(null, data)
		}).catch(function(err){
			cb(err)
		})
		return
	}
	cb(new Error("unknown message type"))
}

