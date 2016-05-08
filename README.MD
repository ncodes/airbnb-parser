### AirBNB Message Parsing

Parse and extract relevant information from Airbnb email messages. 

### Install

```txt
npm install airbnb-parser
```

### Examples


```js
var AirbnbParser = require("airbnb-parser")
var fs 			 = require("fs");
var path 		 = require("path")

var reservationMsg = {
	html: fs.readFileSync(path.join(__dirname, "msgs/reservation_reply.html")).toString("utf-8"),
	subject: "RE: Reservation request at Ajegunle House for May 9 - 10, 2016",
	replyTo: null
}

AirbnbParser.parse(reservationMsg, function(err, result){
	console.log(err, result)
})
```

Returns:

```js
{ 
   reservation_reply: { 
      listing: 'Ajegunle House',
      check_in: { date: '9', month: 'May', year: '2016' },
      check_out: { month: 'May', date: '10', year: '2016' },
      guest_name: 'Odion',
      guest_image: 'https://a2.muscache.com/im/pictures/48f2094e-13f0-4793-b38e-5136413826ef.jpg?aki_policy=profile_medium',
      guest_message: 'Waiting',
      num_guest: '2',
      listing_url: 'https://www.airbnb.com/rooms/12896709',
      reply_to: null 
   } 
}
```

This library currently parses the following types of notifications:

#### inquiry

Parse message sent by guests. The response object content is:

```js
{
   inquiry:{ 
      listing: 'My Home Listing',
      check_in: { date: '6', month: 'May', year: '2016' },
      check_out: { month: 'May', date: '7', year: '2016' },
      guest_name: 'Odion',
      guest_image: 'https://a2.muscache.com/im/pictures/48f2094e-13f0-4793-b38e-5136413826ef.jpg?aki_policy=profile_medium',
      guest_message: 'How is the weather in your location sir',
      num_guest: '2',
      listing_url: 'https://www.airbnb.com/rooms/12609090',
      reply_to: null 
   }
}
```

#### pending_inquiry

Parse a pending reservation inquiry

```js
{
   pending_inquiry:{
      guest_name: 'Odion',
      guest_image: 'https://a2.muscache.com/im/pictures/48f2094e-13f0-4793-b38e-5136413826ef.jpg?aki_policy=profile_x_medium',
      num_guest: '2',
      guest_city: 'Lagos, Nigeria',
      listing: 'Ajegunle House',
      check_in: { day: 'Fri', month: 'May', date: '6' },
      check_out: { day: 'Sat', month: 'May', date: '7' },
      reply_to: null
   }
}
```
### reservation_request

Parse message about a reservation request

```js
{
   reservation_request: {
      guest_name: 'Odion Olumhense',
      listing: 'Almost Comfortable Treehouse',
      check_in: { day: 'Tue', month: 'March', date: '01', year: '2016' },
      check_out: { day: 'Wed', month: 'March', date: '02', year: '2016' },
      num_guest: '1',
      reply_to: null
   }
}
```

### reservation_reminder

Parse message about a reservation that has been made 

```js
{
   reservation_reminder:{
      listing: 'My Home Listing',
      check_in: { day: 'Sat', month: 'April', date: '30', year: '2016' },
      check_out: { day: 'Sun', month: 'May', date: '01', year: '2016' },
      num_guest: '1',
      listing_url: 'http://airbnb.com/roooms/82365255',
      guest_name: 'Odion Olumhense',
      guest_message: 'Hi James, This is a reminder that...',
      reply_to: null
   }
}
``` 

#### reservation_reply

Parse message sent by guests about a reservation request.

```js
{
   reservation_reply: { 
      listing: 'Ajegunle House',
      check_in: { date: '9', month: 'May', year: '2016' },
      check_out: { month: 'May', date: '10', year: '2016' },
      guest_name: 'Odion',
      guest_image: 'https://a2.muscache.com/im/pictures/48f2094e-13f0-4793-b38e-5136413826ef.jpg?aki_policy=profile_medium',
      guest_message: 'Waiting',
      num_guest: '2',
      listing_url: 'https://www.airbnb.com/rooms/12896709',
      reply_to: null
   } 
}
```

#### reservation_confirmed

Parse message that confirms a reservation that has been paid for.

```js
{
   reservation_confirmed: {
      guest_name: 'Odion',
      listing: 'Ajegunle House',
      check_in: { day: 'Mon', month: 'May', date: '9' },
      check_out: { day: 'Tue', month: 'May', date: '10' },
      num_guest: '2',
      confirmation_code: 'DDYUTM',
      reply_to: null 
   }
}
```

#### reservation_canceled

Parse a reservation cancelation message

```js
{
   reservation_canceled: { 
      confirmation_code: 'DDYUTM',
      month: 'May',
      date: '09',
      year: '2016',
      reply_to: null 
   } 
}
```

#### payout_received

Parse a payout notification message

```js
{
   payout_received: {
      amount_paid: '$10',
      payment_method: 'PayPal',
      confirmation_code: 'PDMKQ',
      guest_name: 'Sarah Jackson',
      expected_payment_date: { date: '11', month: 'Mar', year: '2016' },
      reply_to: null
   }
}
```

#### read_review

Parse a message about reading guest reviews

```js
{
   read_review: {
      guest_name: 'Sarah',
      public_review: 'Awesome place to stay. Would definitely recommend it. ”',
      private_review: 'Great location!”',
      reply_to: null
   }
}
```

#### write_review

Parse a message about writing a review about a guest

```js
{
   write_review: {
      guest_name: 'Sarah',
      reply_to: null
   }
}
```

