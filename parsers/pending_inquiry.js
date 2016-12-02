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
		var listingNameEl = $('div.header-banner p.row-space-top-1', html)
		if (listingNameEl.length == 0) return new Error("GetListingInfo: failed to extract listing name");
		result.listing = listingNameEl.text().trim().split(" at ")[1]

		// get checkin info
		var checkInDateEl = $('table.row.row-space-top-4 tr td:first-child.column div:nth-child(2)', html)
		if (checkInDateEl.length == 0) return new Error("GetListingInfo: failed to extract checkin date info");
		var rx = new RegExp("^([a-z]+), ([a-z]+) ([0-9]+)$", "i")
		var date = checkInDateEl.text().trim()
		var m = date.match(rx)
		if (!m) {
			return new Error("GetListingInfo: failed to extract listing checkin date");
		}

		checkIn.day = m[1]
		checkIn.month = m[2]
		checkIn.date = m[3]

		// get checkin info
		var checkOutDateEl = $('table.row.row-space-top-4 tr td:nth-child(2).column div:nth-child(2)', html)
		if (checkOutDateEl.length == 0) return new Error("GetListingInfo: failed to extract check out date info");
		rx = new RegExp("^([a-z]+), ([a-z]+) ([0-9]+)$", "i")
		date = checkOutDateEl.text().trim()
		m = date.match(rx)
		if (!m) {
			return new Error("GetListingInfo: failed to extract listing check out date");
		}

		checkOut.day = m[1]
		checkOut.month = m[2]
		checkOut.date = m[3]

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
		var guestNumEl = $('body table.row tr td.container div table.row.row-space-2.row-space-top-4.text-large tr:nth-child(2) td span', html)
		if (guestNumEl.length == 0) return new Error("GetGuestInfo: failed to extract guest number");
		result.num_guest = $(guestNumEl).text().trim();
		
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