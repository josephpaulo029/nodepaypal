var express = require('express');
var router = express.Router();

var cors = require('cors');
var bodyParser = require('body-parser');
var paypal = require('paypal-rest-sdk');
var fs = require('fs');
/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('PAYMENT');
});

router.use(cors());
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

paypal.configure({
    'host': 'sandbox', //sandbox or live //add your own credentials
    'client_id': 'AbkXxCQUa1ZGqzyPjSV8GBh4_REYRyEO-br_XBDEXwjZ2fFO-E3zxVKAmQ-WON3BKnBh0LMh0XqUnpql',
    'client_secret': 'ENKdvLfCdC432soL5cbI1KGWEJtfHnc3uoSSUOMDiv5PJC-u4dSo-df6myL-iaIdcANa9ZSmcQbCzIAG'
});

router.globalAmount = 0;
router.paymentLink = "";

router.post('/createPayment', (req, res, next) => {
    router.globalAmount = req.body.amount;
    console.log('Amount' + router.globalAmount);
    // res.send(req.body.amount + '');

    //setting up a json with all the payment details

    var create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "http://04984512.ngrok.io/payment/executepay/",
            "cancel_url": "http://04984512.ngrok.io/payment/cancelPayment/"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": "item",
                    "sku": "item",
                    "price": req.body.amount,
                    "currency": "PHP",
                    "quantity": 1
                }]
            },
            "amount": {
                "currency": "PHP",
                "total": req.body.amount
            },
            "description": "This is the payment description."
        }]
    };

    // // calling the paypal create function to create the payment, this should return a payment confirmation
    // // that is passed to executePay function if confirmed.
    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            throw error;
        } else {
            console.log("Create Payment Response");
            console.log(payment);
            router.paymentLink = payment.links[1].href;
            res.send(payment);
        };
    });
});

//execute payment after redirect
router.get('/executepay/', function (req, res) {
    var payment_Id = req.query.paymentId;
    var payer_id = req.query.PayerID;
    console.log(payment_Id + ' ' + payer_id);

    var execute_payment_json = {
        "payer_id": payer_id,
        "transactions": [{
            "amount": {
                "currency": "PHP",
                "total": router.globalAmount
            }
        }]
    };

    paypal.payment.execute(payment_Id, execute_payment_json, function (error, payment) {
        if (error) {
            console.log(error.response);
            throw error;
        } else {
            console.log("Get Payment Response");
            console.log(JSON.stringify(payment));
            if(payment.state == "approved"){

                // res.redirec('http://04984512.ngrok.io/payment/cancelPayment/')
                // res.redirect('/routes/sample.html');
                res.redirect(router.paymentLink);
            }
            // res.send(payment);
        }
    });
});

router.get('/cancelPayment', function (req, res) {
    res.send('Transaction cancelled');
});

module.exports = router;
