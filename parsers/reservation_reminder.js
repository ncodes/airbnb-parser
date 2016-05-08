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
	 * Get guest name and message
	 * @param {[type]} html [description]
	 */
	GetNameAndMessage: function (html) {

		var result = {}

		// get guest name
		var contentEl = $('div.content div.section div.p', html)
		if ($(contentEl).length == 0) return new Error("GetNameAndMessage: failed to extract listing name");
		var m = $(contentEl[1]).text().trim().match(/\breminder that (.*) has a \b/im)
		if (!m) return new Error("GetNameAndMessage: failed to find name in content");
		result.guest_name = m[1]
		
		// get message
		var contentEl = $('div.content div.section', html)
		if (contentEl.length == 0) return new Error("GetNameAndMessage: failed to extract message");
		var msg = $(contentEl[0]).text().trim().replace(/([0-9]{4})-([0-9]+)-([0-9]+) .* \+(([0-9:]+))$/igm, "").trim()
		msg = msg.replace(/[\n ]+/mg, " ")
		result.guest_message = msg;

		return result;
	},

	/**
	 * Get listing information
	 * @param 	{String} 	html [description]
	 * @return 	{Object}	result
	 *          			result.num_guest Number of guest to host
	 *          			result.check_in  			Check in date
	 *          			result.check_in.day   		Check in day
	 *          			result.check_in.date 		Check in date
	 *          			result.check_in.month 		Check in month
	 *          			result.listing 				Listing name 
	 *          			result.confirmation_code 	Confirmation code
	 */
	GetListingInfo: function (html) {

		var result = {}

		// get listing name
		var listingNameEl = $('td.listing-info > div > a > strong', html)
		if ($(listingNameEl[0]).text().trim() == "") return new Error("GetListingInfo: failed to extract listing name");
		result.listing = $(listingNameEl[0]).text().trim()

		// get check in and out dates
		var datesEl = $('table.checkin-widget span.h3 a.link-reset', html)
		if (datesEl.length != 2) return new Error("GetListingInfo: failed to extract dates");
		
		var checkInDate = $(datesEl[0]).text().trim()
		result.check_in = parseDate(checkInDate)

		var checkOutDate = $(datesEl[1]).text().trim()
		result.check_out = parseDate(checkOutDate)


		// get guest number
		var guestNumEl = $('td.listing-info > div > a > div > strong', html)
		if ($(guestNumEl[0]).text().trim() == "") return new Error("GetListingInfo: failed to extract number of guest");
		result.num_guest = guestNumEl.text().trim()

		// get listing url
		var contentEl = $('div.content div.section div.p a', html)
		if (contentEl.length === 0) return new Error("GetListingInfo: failed to extract listing url");
		result.listing_url = $(contentEl[0]).attr("href").trim()

		return result
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
				var nameData = self.GetNameAndMessage(msgObj.html)
				if (nameData instanceof Error) {
					reject(new Error(msgType + "/Parse: " + nameData.message))
					return
				}

				// get listing info
				var listingInfo = self.GetListingInfo(msgObj.html)
				if (listingInfo instanceof Error) {
					reject(new Error(msgType + "/Parse: " + listingInfo.message))
					return
				}

				result[msgType] = _.extend(listingInfo, nameData, { reply_to: msgObj.replyTo })
				resolve(result)
			});
		}
	}
}