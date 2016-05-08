var Promise = require("bluebird"),
	$ 		= require('cheerio'),
	_ 		= require("lodash");


/**
 * Parse inquiry message
 * @param  {Object} msgObj message object
 */
module.exports = { 



	/**
	 * Get guest name from subject
	 * @param {[type]} subject [description]
	 * @param {[type]} rx      [description]
	 */
	ParseSubject: function (subject, rx) {
		var result = {}
		var m = subject.match(new RegExp(rx, "i"))
		if (m) {
			result.guest_name = m[2]
			return result
		}
		return new Error("ParseSubject: failed to parse subject")
	},

	/**
	 * Get reviews
	 * @param {[type]} html [description]
	 */
	GetReviews: function (html) {

		var result = {}

		// get listing name
		var reviewsEl = $('em', html)
		if (reviewsEl.length !== 2) return new Error("GetReviews: failed to extract reviews");
		
		// public review
		var publicReview = $(reviewsEl[0]).text().trim().replace(/^[^a-zA-Z0-1]{1}|[^a-zA-Z0-1]{1}$/, "")
		result.public_review = publicReview;

		// private review
		var privateReview = $(reviewsEl[1]).text().trim().replace(/^[^a-zA-Z0-1]{1}|[^a-zA-Z0-1]{1}$/, "")
		result.private_review = privateReview;

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

				// get reviews
				var reviewData = self.GetReviews(msgObj.html)
				if (reviewData instanceof Error) {
					reject(new Error(msgType + "/Parse: " + reviewData.message))
					return
				}

				result[msgType] = _.extend(subjectData, reviewData,  { reply_to: msgObj.replyTo })
				resolve(result)
			});
		}
	}
}