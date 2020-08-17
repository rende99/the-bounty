const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const dotenv = require("dotenv");
const rateLimit = require("express-rate-limit");
var MongoStore = require('rate-limit-mongo');
var qs = require('qs');
const MongoClient = require('mongodb').MongoClient
var ObjectId = require('mongodb').ObjectId; 
const Paypal = require('paypal-nvp-api');
const paypalPayout = require('@paypal/payouts-sdk');
const paypalSDK = require('@paypal/checkout-server-sdk');

const app = express();
const port = process.env.PORT || 5000;
dotenv.config();


app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

console.log("STARTING SERVER...")

const config = {
    mode: 'live', // or 'live'
    username: process.env.bountyUSER,
    password: process.env.bountyPASS,
    signature: process.env.bountySIG
}
const paypal = Paypal(config);

MongoClient.connect(process.env.mongoURL, { useUnifiedTopology: true })
    .then(client => {
        console.log('Connected to Database')
        const db = client.db('bountyDatabase')
        app.listen(port, () => console.log(`Listening on port ${port}`));

        app.set('views', './');
        app.set('view engine', 'jade');



        app.get('/currentBounty', async (req, res) => {
            var gameInfo = {}
            var b = db.collection('bounties').find({isActive: {$eq: true}}).toArray().then(async results => {
                console.log(results)
                //results[0].gameID holds game ID, etc. etc.
                await axios.get('https://www.speedrun.com/api/v1/categories/' + results[0].categoryID + '/records?embed=players,game,category&top=1').then(async function (data) {
                    await axios.get('https://www.speedrun.com/api/v1/runs/' + data.data.data[0].runs[0].run.id + '?embed=players').then(function (data2) {
                        gameInfo = {
                            'name': data.data.data[0].game.data.names.twitch,
                            'categoryName': data.data.data[0].category.data.name,
                            'imgSrc': data.data.data[0].game.data.assets['cover-large'].uri,
                            'link': data.data.data[0].category.data.weblink,
                            'WRRun': {
                                'id': data.data.data[0].runs[0].run.id,
                                'link': data.data.data[0].runs[0].run.weblink,
                                'time': data.data.data[0].runs[0].run.times.primary_t
                            },
                            'runner': {
                                'runnerID': data2.data.data.players.data[0].id,
                                'runnerName':data2.data.data.players.data[0].names.international,
                                'link': data2.data.data.players.data[0].weblink,
                                'colorFrom': data2.data.data.players.data[0]['name-style'].style == 'gradient' ? data2.data.data.players.data[0]['name-style']['color-from'].dark : data2.data.data.players.data[0]['name-style'].color.dark,
                                'colorTo': data2.data.data.players.data[0]['name-style'].style == 'gradient' ? data2.data.data.players.data[0]['name-style']['color-to'].dark : data2.data.data.players.data[0]['name-style'].color.dark,
                            }
                        }
                    }, function (err) {
                        console.error(err);
                    });
                    
                }, function (err) {
                    console.error(err);
                });
                res.send( {bountyInfo: results[0], gameInfo: gameInfo} )
            });
        })



        app.get('/votingGames', async (req, res) => {
            var gamesInfo = []
            var b = db.collection('voteGames').find({}).toArray().then(async results => {
                console.log(results)
                for(var i = 0; i < results.length; i++){
                    await axios.get('https://www.speedrun.com/api/v1/categories/' + results[i].categoryID + '?embed=game').then(function (data) {
                        gamesInfo.push({
                            'name': data.data.data.game.data.names.twitch,
                            'categoryName': data.data.data.name,
                            'categoryID': results[i].categoryID,
                            'imgSrc': data.data.data.game.data.assets['cover-small'].uri,
                            'link': data.data.data.weblink,
                            'votes': results[i].numVotes
                        })
                    }, function (err) {
                        console.error(err);
                    });
                }
            
                res.send( {games: gamesInfo} )
            });
        })



        app.get('/prevBounties', async (req, res) => {
            var gamesInfo = []
            var b = db.collection('bounties').find({isActive: {$eq: false}}).toArray().then(async results => {
                for(var i = 0; i < results.length; i++){
                    await axios.get('https://www.speedrun.com/api/v1/runs/' + results[i].runID + '?embed=players,game,category').then(function (data) {
                        gamesInfo.push({
                            'name': data.data.data.game.data.names.twitch,
                            'categoryName': data.data.data.category.data.name,
                            'runnerName': data.data.data.players.data[0].names.international,
                            'link': data.data.data.weblink,
                            'imgSrc': data.data.data.game.data.assets['icon'].uri,
                            'bounty': results[i].bounty
                        })
                    }, function (err) {
                        console.error(err);
                    });
                }
            
                res.send( {data: gamesInfo} )
            });
        })



        app.get('/twitch', async (req, res) => {
            //get if there is a cookie currently for twitch Auth
            var b = db.collection('tokens').find({service: {$eq: "twitch"}}).toArray().then(async results => {
                //validate token
                var validToken = results[0].token
                await axios.get('https://id.twitch.tv/oauth2/validate', {
                    headers: {
                        'Authorization': 'OAuth ' + results[0].token
                    }
                }).then(async function (response) {
                    if(response.data.expires_in <= 0){
                        //app token has expired.
                        await axios.post('https://id.twitch.tv/oauth2/token?client_id=' + process.env.twitchClientID + '&client_secret=' + process.env.twitchClientSecret + '&grant_type=client_credentials', null, null).then(async response2 => {
                            console.log(response2.data.access_token)
                            validToken = response2.data.access_token
                            await db.collection('tokens').updateOne({service: "twitch"}, {
                                $set: {"token": response2.data.access_token}})
                        })
                    }
                }).catch(async function (err){ 
                    //something went wrong with validating
                    await axios.post('https://id.twitch.tv/oauth2/token?client_id=' + process.env.twitchClientID + '&client_secret=' + process.env.twitchClientSecret + '&grant_type=client_credentials', null, null).then(async response2 => {
                        console.log(response2.data.access_token)
                        validToken = response2.data.access_token
                        await db.collection('tokens').updateOne({service: "twitch"}, {
                            $set: {"token": response2.data.access_token}})
                    })
                });
                // validToken will now hold a proper token, can continue with request.
                var b = db.collection('bounties').find({isActive: {$eq: true}}).toArray().then(async bountyResult => {
                    bountyResult[0].gameName;
                    await axios.get('https://api.twitch.tv/helix/games?name=' + bountyResult[0].gameName, {
                        headers: {
                            'Client-ID': process.env.twitchClientID,
                            'Authorization': 'Bearer ' + validToken
                        }
                    }).then(async function (response){
                        console.log(response.data)
                        var twitchGameID = response.data.data[0].id
                        await axios.get('https://api.twitch.tv/helix/streams?game_id=' + twitchGameID, {
                            headers: {
                                'Client-ID': process.env.twitchClientID,
                                'Authorization': 'Bearer ' + validToken
                            } 
                        }).then(function(r2) {
                            //we now have an array of stream objects
                            var responseObject = []
                            for(var i = 0; i < r2.data.data.length; i++){
                                responseObject.push({
                                    'channelName': r2.data.data[i].user_name,
                                    'streamTitle': r2.data.data[i].title,
                                    'thumbnailURL': r2.data.data[i].thumbnail_url.replace('{width}', 400).replace('{height}', 225),
                                    'streamURL': 'https://www.twitch.tv/'+r2.data.data[i].user_name,
                                    'viewerCount': r2.data.data[i].viewer_count
                                })
                            }
                            res.send( {streams: responseObject} )

                        })
                    }).catch(function (err) {
                        console.error(err)
                    })
                })
            }) 
        })



        app.post('/vote', async (req, res) => {
            console.log(req.body.gameObj)
            await db.collection('voteGames').updateOne( {"categoryID": req.body.gameObj.categoryID}, {
				$inc: {"numVotes": 1}
			}).catch(function(err){
				console.log(err);
				res.send( {status: false} );
            })
            res.send( {status: true} );
        })



        app.get('/getBalance', async (req, res) => {
            //first, get api token from DB.
            var b = db.collection('tokens').find({service: {$eq: "paypal"}}).toArray().then(async results => {
                // results[0].token holds access token now.

            })
            paypal.request('GetBalance', {}).then((result) => {
                res.send( {amt: result.L_AMT0} )
            }).catch((err) => {
                console.trace(err);
            });
        })



        app.get('/bountyOver', async (req,res) => {
            //1. verify that the bounty timer is indeed over
            var bountyEnded = verifyBountyEnded();
            console.log("bounty ended?", bountyEnded)
            if(!bountyEnded){res.send( {err: true} )}

            //2. send reward email to the first place email.
            paypal.request('GetBalance', {}).then(async (result) => {
                console.log(result);
                //result.L_AMT0 holds total amount in paypal acct
                let environment = new paypalSDK.core.SandboxEnvironment(process.env.paypalClientID, process.env.paypalClientSecret);
                let client = new paypalSDK.core.PayPalHttpClient(environment);


                // 3. Call PayPal to set up a transaction with payee
                const request = new paypalSDK.orders.OrdersCreateRequest();
                request.prefer("return=representation");
                request.requestBody({
                    intent: 'CAPTURE',
                    purchase_units: [{
                    amount: {
                        currency_code: 'USD',
                        value: '0.04'
                    },
                    payee: {
                        email_address: 'rende99@gmail.com'
                    }
                    }]
                });
                
                let order;
                try {
                    order = await paypal.client().execute(request);
                } catch (err) {
                
                    // 4. Handle any errors from the call
                    console.error(err);
                }
                  
                
                
            }).catch((err) => {
                console.trace(err);
            });
            

            //3. set the bounty on the currently active, set it to inactive, set the top run ID.

            //4. choose the voteGame with the largest number of votes, add it to the bounty and make it active/initialize

            //5. pick 3 new votegames

        })

        function verifyBountyEnded() {
            var b = db.collection('bounties').find({isActive: {$eq: true}}).toArray().then(async results => {
                console.log()
                if(results[0].startDate + 864000000 >= (new Date().getTime())){
                    //verified.
                    return true;
                }else{
                    return false;
                }
            }).catch(function(err) {
                return false;
            })
            return false;
        }

        const getPaypalToken = async () =>  {
            

        }

    })

    




