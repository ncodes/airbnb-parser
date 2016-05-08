var Promise = require("bluebird"),
	$ 		= require('cheerio'),
	_ 		= require("lodash");


function parseDate(d) { 
	var rx = new RegExp("^([a-z]+) ([0-9]+), ([0-9]{4})$", "i")
	var m = d.match(rx)
	if (m) {
		return {
			date: m[2],
			month: m[1],
			year: m[3]
		}
	}
}

/**
 * Parse inquiry message
 * @param  {Object} msgObj message object
 */
module.exports = { 



	/**
	 * Get the amount paid from the subject
	 * @param {[type]} subject [description]
	 * @param {[type]} rx      [description]
	 */
	GetAmountPaid: function (subject, rx) {
		var result = {}
		var m = subject.match(new RegExp(rx, "i"))
		if (m) {
			result.amount_paid = m[1]
			return result
		}
		return new Error("GetAmountPaid: failed to get amount")
	},

	/**
	 * Get basic info like payment method, expected
	 * payment date.
	 * @param {[type]} html [description]
	 */
	GetBasicInfo: function (html) {
		var result = {}
		
		var contentEl = $('table', html)
		var content = contentEl.text().replace(/[\n ]+/ig, " ")
		if (content.length == 0) return new Error("GetBasicInfo: failed to extract basic info");
		
		// get payment method
		var m = content.match(/\bWe’ve sent you a payout of (.*) via (.*?)[.]{1}/im)
		if (!m) return new Error("GetBasicInfo: failed to get payment method");
		result.amount_paid = m[1]
		result.payment_method = m[2]

		// get confirmation code
		var rxConfirmationCode = new RegExp(".*([A-Z0-9]{6}).*", "m")
		m = content.match(rxConfirmationCode)
		if (!m) return new Error("GetBasicInfo: failed to get confirmation code");
		result.confirmation_code = m[1];

		// get date to expect payment
		m = content.match(/.*((jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec) [0-9]{1,2}, [0-9]{4}).*/im)
		if (!m) return new Error("GetBasicInfo: failed to get expected date of payment");
		result.expected_payment_date = parseDate(m[1])

		// get guest name
		m = content.match(new RegExp("([A-Z]{1}[a-zA-Z0-9 ]+){2,3}(?= [A-Z0-9]{6}.*)"))
		if (!m) return new Error("GetBasicInfo: failed to get guest name");
		result.guest_name = m[0]
		
		return result
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
				var amountData = self.GetAmountPaid(msgObj.subject, rxCollection.subject[msgType])
				if (amountData instanceof Error) {
					reject(new Error(msgType + "/Parse: " + amountData.message))
					return
				}

				// get basic info
				var basicInfoData = self.GetBasicInfo(msgObj.html)
				if (basicInfoData instanceof Error) {
					reject(new Error(msgType + "/Parse: " + basicInfoData.message))
					return
				}

				// get listing info
				// var listingInfo = self.GetListingInfo(msgObj.html)
				// if (listingInfo instanceof Error) {
				// 	reject(new Error(msgType + "/Parse: " + listingInfo.message))
				// 	return
				// }

				result[msgType] = _.extend(amountData, basicInfoData, { reply_to: msgObj.replyTo })
				resolve(result)
			});
		}
	}
}