var Promise = require("bluebird"),
	$ 		= require('cheerio'),
	_ 		= require("lodash");


function parseDate(d) {
	var rx = new RegExp("^([a-z]+), ([a-z]+) ([0-9]+)$", "i")
	var m = d.match(rx)
	if (m) {
		return {
			day: m[1],
			month: m[2],
			date: m[3]
		}
	}
}

/**
 * Parse inquiry message
 * @param  {Object} msgObj message object
 */
module.exports = { 



	/**
	 * Get name of guest from subject
	 * @param  {String} subject message subject
	 * @param  {String} rx      regular expression to use to extract data
	 * @return {Object}         extracted data.
	 *                          data.guest_name 		Guest name
	 */
	ParseSubject: function (subject, rx) {
		var result = {}
		var m = subject.match(new RegExp(rx, "i"))
		if (m) {
			result.guest_name = m[1]
			return result
		}
		return new Error("ParseSubject: failed to parse subject")
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
		var listingNameEl = $('td.container span.large', html)
		if ($(listingNameEl[0]).text().trim() == "") return new Error("GetListingInfo: failed to extract listing name");
		result.listing = $(listingNameEl[0]).text().trim()

		// get check in date
		var checkInDateEl = $('div > table:nth-child(10) > tbody > tr > td:nth-child(1) > div.strong.text-left', html)
		if ($(checkInDateEl[0]).text().trim() == "") return new Error("GetListingInfo: failed to extract listing check-in date");
		var checkInDate = checkInDateEl.text().trim()
		result.check_in = parseDate(checkInDate)

		// get check out date
		var checkOutDateEl = $('div > table:nth-child(10) > tbody > tr > td.column.text-left > div.strong.text-left', html)
		if ($(checkInDateEl[0]).text().trim() == "") return new Error("GetListingInfo: failed to extract listing check-out date");
		var checkOutDate = checkOutDateEl.text().trim()
		result.check_out = parseDate(checkOutDate)

		// get guest number
		var guestNumEl = $('table:nth-child(11) > tbody > tr:nth-child(2)', html)
		if ($(checkInDateEl[0]).text().trim() == "") return new Error("GetListingInfo: failed to extract number of guest");
		result.num_guest = guestNumEl.text().trim()

		// get confirmation code
		var confirmationCodeEl = $('table:nth-child(12) > tbody > tr:nth-child(2) > td > span', html)
		if ($(confirmationCodeEl[0]).text().trim() == "") return new Error("GetListingInfo: failed to extract confirmation code");
		result.confirmation_code = confirmationCodeEl.text().trim()

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
				var subjectData = self.ParseSubject(msgObj.subject, rxCollection.subject[msgType])
				if (subjectData instanceof Error) {
					reject(new Error(msgType + "/Parse: " + subjectData.message))
					return
				}

				// get listing info
				var listingInfo = self.GetListingInfo(msgObj.html)
				if (listingInfo instanceof Error) {
					reject(new Error(msgType + "/Parse: " + listingInfo.message))
					return
				}

				result[msgType] = _.extend(subjectData, listingInfo, { reply_to: msgObj.replyTo })
				resolve(result)
			});
		}
	}
}