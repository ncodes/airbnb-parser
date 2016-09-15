var Promise = require("bluebird"),
	$ 		= require('cheerio'),
	_ 		= require("lodash");

function parseDate(d) { 
	var rx = new RegExp("^([a-z]+), ([a-z]+) ([0-9]+), ([0-9]{4})$", "i")
	var m = d.match(rx)
	if (m) {
		return {
			day: m[1],
			month: m[2],
			date: m[3],
			year: m[4]
		}
	}
}

/**
 * Parse inquiry message
 * @param  {Object} msgObj message object
 */
module.exports = { 

	/**
	 * Get listing name, check in and check out time
	 * @param  {String} subject message subject
	 * @param  {String} rx      regular expression to use to extract data
	 * @return {Object}         extracted data.
	 *                          data.listing   			Name of listing
	 *                          data.check_in  			Object
	 *                          data.check_in.date		Date of month
	 *                          data.check_in.month 	Month
	 *                          data.check_in.year 		Year
	 *                          data.check_out 			Object
	 *                          data.check_out.date		Date of month
	 *                          data.check_out.month 	Month
	 *                          data.check_out.year		Year
	 */
	ParseSubject: function (subject, rx) {
		var result = {}
		var m = subject.match(new RegExp(rx, "i"))
		if (m) {
			result.listing = m[1]
			
			result.check_in = {}
			result.check_out = {}
			result.check_in.month = m[3]
			result.check_in.date = m[4]
			result.check_in.year = m[5]
			result.check_out.month = m[7]
			result.check_out.date = m[8]
			result.check_out.year = m[9]

			return result
		}
		return new Error("ParseSubject: failed to parse subject")
	},

	/**
	 * Given the message (html), it will attempt to
	 * get the guest's name, image and message.
	 * 
	 * @param  {String} html the message
	 * @return {Object}      data.guest_name    		Guest name
	 *                       data.guest_image 			Guest image           
	 *                       data.guest_message 		Guest message
	 */
	GetGuestInfo: function (html) {
		
		var result = {}

		// get guest name
		var guestNameEl = $('td.user-details-box > div > h2', html)
		if (guestNameEl.length == 0) return new Error("GetGuestInfo: failed to extract guest name tag");
		result.guest_name = $(guestNameEl[0]).text()

		// get guest photo
		var photoEl = $('td.profile-image-box img', html)
		if (photoEl.length == 0) return new Error("GetGuestInfo: failed to extract photo url");
		result.guest_image = $(photoEl[0]).attr("src")

		// get message
		var messageEl = $('div.user-inquiry td.container div div', html)
		if (messageEl.length == 0) return new Error("GetGuestInfo: failed to extract message");
		result.guest_message = $(messageEl[0]).text().trim()

		// get number of guest
		var numGuestEl = $('body div.user-inquiry p.details-list span:first-child', html)	
		if (numGuestEl.length == 0) return new Error("GetGuestInfo: failed to extract number of guest");
		result.num_guest = $(numGuestEl).text().trim().split(" ")[0]

		// get number of nights
		var numNightEl = $('body div.user-inquiry p.details-list span:nth-child(2)', html)	
		if (numNightEl.length == 0) return new Error("GetGuestInfo: failed to extract number of nights");
		result.num_nights = $(numNightEl).text().trim().split(" ")[0]

		return result
	},

	/**
	 * Get reply link
	 * @param {String} html the html content
	 */
	GetReplyLink: function (html) {
		var value = ""
		var m = html.match(new RegExp('"(https://www.airbnb.com/z/q/([0-9]+).*)(?="([ ]{1}|,"))', "i"))
		if (!m) return new Error("GetReplyLink: failed to extract reply link")
		value = m[1]
		return value
	},


	/**
	 * Parse an inquiry message
	 * @param {Object} rxCollection regular expression collection
	 */
	Parse: function (rxCollection) {
		var self = this
		var result = {};
		return function(msgType, msgObj) {
			return new Promise(function (resolve, reject){
				
				// parse subject
				var subjectData = self.ParseSubject(msgObj.subject, rxCollection.subject[msgType])
				if (subjectData instanceof Error) {
					reject(new Error(msgType + "/Parse: " + subjectData.message))
					return
				}

				// get guest message
				var guestInfo = self.GetGuestInfo(msgObj.html)
				if (guestInfo instanceof Error) {
					reject(new Error(msgType + "/Parse: " + guestInfo.message))
					return
				}

				// get reply link
				var replyLink = self.GetReplyLink(msgObj.html)
				if (replyLink instanceof Error) {
					reject(new Error(msgType + "/Parse: " + replyLink.message))
					return
				} else {
					guestInfo.reply_link = replyLink
				}

				result[msgType] = _.extend( subjectData, guestInfo, { reply_to: msgObj.replyTo })
				resolve(result)
			});
		}
	}
}