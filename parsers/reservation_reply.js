var Promise = require("bluebird"),
	$ 		= require('cheerio'),
	_ 		= require("lodash");


/**
 * Parse inquiry message
 * @param  {Object} msgObj message object
 */
module.exports = { 

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
		var guestNameEl = $('a[href^="https://www.airbnb.com/users/show/"] span', html)
		if (guestNameEl.length == 0) return new Error("GetGuestInfo: failed to extract guest name tag");
		result.guest_name = $(guestNameEl[0]).text()

		// get guest photo
		var photoEl = $('td.photo img[src^="https://a2.muscache.com/im/pictures"]', html)
		if (photoEl.length == 0) return new Error("GetGuestInfo: failed to extract photo url");
		result.guest_image = $(photoEl[0]).attr("src")

		// get message
		var messageEl = $('div.section.inquiry div.panel-first div:first-child', html)
		if (messageEl.length == 0) return new Error("GetGuestInfo: failed to extract message");
		result.guest_message = $(messageEl[0]).text().trim()

		return result
	},

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
		var m = subject.match(new RegExp(rx, "i"))
		if (m) {
			
			if (m.length === 6) {
				// remove captured 'RE:' group 
				m = _.filter(m, function(v, i){
					if (i != 1) return true
				})
			}

			var listing = m[1];
			var year = m[4];
			var checkIn = {}
			var checkOut = {}

			if (m[2].split(" ").length > 1) {
				checkIn.date = m[2].split(" ")[1]
				checkIn.month = m[2].split(" ")[0]
				checkIn.year = year
			}

			if (m[3].split(" ").length == 1) {
				checkOut.month = checkIn.month;
				checkOut.date = m[3];
				checkOut.year = year;
			}

			return {
				listing: listing,
				check_in: checkIn,
				check_out: checkOut,
			}
		}
		return new Error("ParseSubject: failed to parse subject")
	},

	/**
	 * Get listing information
	 * @param 	{String} 	html [description]
	 * @return 	{Object}	result
	 *          			result.num_guest Number of guest to host
	 *          			result.listing_url  URL of the listing
	 *          			result.listing 		Listing name 
	 */
	GetListingInfo: function (html) {

		var result = {}

		// get number of guest
		var numGuestEl = $('div.listing-subtitle strong:nth-child(2)', html)
		if ($(numGuestEl[0]).text().trim() == "") return new Error("GetListingInfo: failed to extract number of guest info");
		result.num_guest = $(numGuestEl[0]).text().trim()
		
		// get listing name and url
		var listingUrlEl = $('td.listing-info a[href^="https://www.airbnb.com/rooms"]', html)
		if (listingUrlEl.length == 0) return new Error("GetListingInfo: failed to extract listing link")
		result.listing_url = $(listingUrlEl[0]).attr("href").replace(new RegExp("\\?.*$"), "")

		// get listing name
		var listingNameEl = $('td.listing-info a[href^="https://www.airbnb.com/rooms"] strong:first-child', html)
		if (listingNameEl.length == 0) return new Error("GetListingInfo: failed to extract listing name")
		result.listing = $(listingNameEl[0]).text().trim()

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

				// get guest message
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

				result[msgType] = _.extend(subjectData, guestInfo, listingInfo, { reply_to: msgObj.replyTo })
				resolve(result)
			});
		}
	}
}