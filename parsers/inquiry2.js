var Promise = require("bluebird"),
	$ 		= require('cheerio'),
	_ 		= require("lodash");


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
		var guestNameEl = $('a p.body-text:first-child', html)
		if (guestNameEl.length == 0) return new Error("GetGuestInfo: failed to extract guest name tag");
		result.guest_name = $(guestNameEl[0]).text().trim()
		
		// get guest photo
		var photoEl = $('img[src^="https://a2.muscache.com/im/pictures"].profile-img', html)
		if (photoEl.length == 0) return new Error("GetGuestInfo: failed to extract photo url");
		result.guest_image = $(photoEl[0]).attr("src")

		// get message
		var messageEl = $('p.body-text.message-card.message-card-gray', html)
		if (messageEl.length == 0) return new Error("GetGuestInfo: failed to extract message");
		result.guest_message = $(messageEl[0]).text().trim()
		
		return result
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
		var numGuestEl = $('table.container tr td div:nth-child(8) th p:nth-child(2)', html)
		if ($(numGuestEl[0]).text().trim() == "") return new Error("GetListingInfo: failed to extract number of guest info");
		result.num_guest = $(numGuestEl[0]).text().trim()
		
		// get listing name and url
		var listingUrlEl = $('table.container tr td div:nth-child(6) a[href^="https://www.airbnb.com/rooms"]', html)
		if (listingUrlEl.length == 0) return new Error("GetListingInfo: failed to extract listing link")
		result.listing_url = $(listingUrlEl[0]).attr("href").replace(new RegExp("\\?.*$"), "")
		
		// // get listing name
		var listingTitleParts = $(listingUrlEl[1]).text().split("›")
		if (listingTitleParts.length == 0) return new Error("GetListingInfo: failed to extract listing name");
		result.listing = listingTitleParts[0].trim()
		
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

				// get listing info
				var listingInfo = self.GetListingInfo(msgObj.html)
				if (listingInfo instanceof Error) {
					reject(new Error(msgType + "/Parse: " + listingInfo.message))
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

                result["inquiry"] = _.extend(subjectData, guestInfo, listingInfo, { reply_to: msgObj.replyTo })
				resolve(result)
			});
		}
	}
}