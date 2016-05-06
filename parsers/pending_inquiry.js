var Promise = require("bluebird"),
	$ 		= require('cheerio'),
	_ 		= require("lodash");


/**
 * Parse inquiry message
 * @param  {Object} msgObj message object
 */
module.exports = { 

	/**
	 * Get listing information
	 * @param  {String} html message subject
 	 * @return {Object}         extracted data.
	 *                          data.listing   			Name of listing
	 *                          data.check_in  			Object
	 *                          data.check_in.date		Date of month
	 *                          data.check_in.day		Day of month
	 *                          data.check_in.month 	Month
	 *                          data.check_out 			Object
	 *                          data.check_in.date		Date of month
	 *                          data.check_in.day		Day of month
	 *                          data.check_out.month 	Month
	 */
	GetListingInfo: function (html) {

		var result = {}
		var checkIn = {}
		var checkOut = {}

		// get listing name
		var listingNameEl = $('div.from-user-inquiry h3:first-child', html)
		if (listingNameEl.length == 0) return new Error("GetListingInfo: failed to extract listing name");
		result.listing = $(listingNameEl[0]).text()

		// get check in and check out times
		var listingDateEl = $('table.trip-summary', html)
		if (listingDateEl.length == 0) return new Error("GetListingInfo: failed to extract date info");
		var date = $(listingDateEl).text().trim().replace(new RegExp("[ ]+", "mg"), " ")
		date = date.replace(new RegExp("[\\n]{1,}", "gm"), "-", 1)
		var rx = new RegExp("^(([a-z]+), ([a-z]+) ([0-9]+))[\- ]+(([a-z]+), ([a-z]+) ([0-9]+))$", "i")
		var m = date.match(rx)
		if (!m) {
			return new Error("GetListingInfo: failed to extract listing date");
		}
	
		checkIn.day = m[2]
		checkIn.month = m[3]
		checkIn.date = m[4]
		checkOut.day = m[6]
		checkOut.month = m[7]
		checkOut.date = m[8]
		result.check_in = checkIn
		result.check_out = checkOut		

		return result
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
		var guestNameEl = $('div.user-details h2', html)
		if (guestNameEl.length == 0) return new Error("GetGuestInfo: failed to extract guest name tag");
		result.guest_name = $(guestNameEl[0]).text()

		// get guest image
		var guestImageEl = $('td.profile-image-box img[src^="https://a2.muscache.com/im/pictures/"]', html)
		if (guestImageEl.length == 0) return new Error("GetGuestInfo: failed to extract guest image");
		result.guest_image = $(guestImageEl).attr('src')

		// get guest number
		var guestNumEl = $('p.details-list span:first-child', html)
		if (guestNumEl.length == 0) return new Error("GetGuestInfo: failed to extract guest number");
		result.num_guest = $(guestNumEl).text().trim().split(" ")[0];

		// get user city
		var guestCityEl = $('div.user-details span.user_city', html)
		if (guestCityEl.length == 0) return new Error("GetGuestInfo: failed to extract guest city");
		result.guest_city = $(guestCityEl).text().trim();

		return result
	},

	/**
	 * Parse an inquiry message
	 * @param {Object} rxCollection regular expression collection
	 */
	Parse: function (rxCollection) {
		var self = this
		return function(msgType, msgObj) {
			return new Promise(function (resolve, reject){

				var result = {}

				// get guest
				var guestInfo = self.GetGuestInfo(msgObj.html)
				if (guestInfo instanceof Error) {
					reject(new Error(msgType + "/Parse: " + guestInfo.message))
					return
				}

				// get listing info
				var listingInfo = self.GetListingInfo(msgObj.html)
				if (listingInfo instanceof Error) {
					reject(new Error(msgType + "/Parse: " + listingInfo.message))
					return
				}

				result[msgType] = _.extend(guestInfo, listingInfo, { reply_to: msgObj.replyTo })
				resolve(result)
			});
		}
	}
}