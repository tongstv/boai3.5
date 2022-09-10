window.lock = 0;
var stoploss = 0
var profit = 0;
var setai = 0;
var phantramvon = 0;
var nextrade = 0;

async function appstart() {


    let stoploss = localStorage.getItem("stoploss");
    let profit = localStorage.getItem("profit");
    if (stoploss === 1 || profit === 1) {

        sendsms("Stoplosss/Profit");
        return;
    }
    config = localGet('config');
    if (config) {
        window.conf = JSON.parse(config);
    }

    let emailold = localStorage.getItem("email");

    if (emailold !== window.conf.email) {
        localStorage.setItem('refresh_token', '');
        localStorage.setItem('token', '');
    }

    let refresh_token = localStorage.getItem('refresh_token');

    if (!refresh_token)
        await gettoken();
    else {
        await reftoken();
    }

    sendsms("Bot start success!");

    if (window.conf.tradeview === '1') {

        xuid = "tradeview";
    } else {

        xuid = window.conf.uuid;
    }

    // console.log(xuid);


    socket.on(xuid, async function (from, tradeview) {

        if (window.conf.token !== '') {

            if (window.conf.botid !== '') {


                if (_has(tradeview, "slide")) {


                    sendsms("===" + tradeview.name + "===");
                    window.res1 = Date.now();
                    // console.log('trade: ' + tradeview.slide + '|' + tradeview.vol + '|' + tradeview.tradetype);


                    let trade = 1;


                    //console.log("check stop")

                    if (stoploss === 1) {
                        sendsms("Stoploss: Blance " + await getBlance(window.conf.type) + "$");
                        trade = 0;
                    }

                    if (profit === 1) {
                        trade = 0;
                        sendsms("Profit: Blance " + await getBlance(window.conf.type) + "$");
                    }
                    if (Date.now() < nextrade) {
                        trade = 0;
                    }


                    if (trade == 1) {

                        nextrade = Date.now() + 15000;


                        localStorage.setItem("intrade", 1);

                        tradeview.tradetype = window.conf.type;

                        if (window.conf.vol.indexOf('%') !== -1) {


                            if (phantramvon === 0) {
                                var sodu = await getBlance(window.conf.type);

                                phantramvon = Math.round((sodu * parseInt(window.conf.vol) / 100), 2);
                                if (phantramvon < 1) phantramvon = 1;

                            }

                            tradeview.vol = phantramvon;
                        } else {
                            tradeview.vol = window.conf.vol;
                        }


                        if (tradeview.x2 > 0) {
                            tradeview.vol = Math.round((window.conf.vol * tradeview.x2) * 0.95, 2);
                        }
                        if (parseInt(window.conf.danhnguoc) === 1) {
                            tradeview.slide = tradeview.slide === 'sell' ? 'buy' : (tradeview.slide === 'buy' ? 'sell' : '');
                        }

                        if (tradeview.setdemo === 1) {
                            tradeview.tradetype == "DEMO";
                        }
                        if (tradeview.min === 1) {
                            tradeview.vol = 1;
                        }
                        if (tradeview.vol < 1) tradeview.vol = 1;

                        slide(tradeview.slide, tradeview.vol, tradeview.tradetype).then(function (res) {


                            if (_has(res, "ok") && res.ok !== false) {


                                blance = "";
                                d = new Date();
                                sendsms(datetime() + ' | ' + tradeview.slide + ' | ' + tradeview.vol + '$ | Live: ' + tradeview.tradetype);
                                setTimeout(function () {
                                    sendsms('Wait 30s ...');
                                }, 1000);
                                tradetime = res.d.time;
                                localStorage.setItem("locktrade", 1);
                                check(tradetime, tradeview);

                            }


                        });


                    }
                    socket.emit("tradeview", from, "");

                }

            }
        }

    });


}

function check(tradetime, tradeview) {


    setTimeout(() => {
        return new Promise(async function (resolve, reject) {

            var getclose = setInterval(async function () {


                //  console.log("Check win loss" + tradetime);
                res = await get(window.conf.web + "/api/wallet/binaryoption/transaction/close?page=1&size=10&betAccountType=" + tradeview.tradetype, 15000);


                if (_has(res, "ok") && res.ok !== false) {


                    res.d.c.forEach(async (val) => {

                        if (Math.abs(val.createdDatetime - tradetime) < 100) {


                            window.lock = 0;
                            localStorage.setItem("locktrade", 0);

                            let sms = "";
                            if (val.result === "WIN") {


                                sms += "WIN: +" + val.winAmount + '$';
                            } else {
                                sms += "LOSS: -" + val.betAmount + '$';
                            }


                            let blance = await getBlance(tradeview.tradetype);


                            sms += " | Balance:" + blance + "$";


                            if (blance <= window.conf.vonbandau) {

                                let stopphantram = ((window.conf.vonbandau - blance) / window.conf.vonbandau) * 100;
                                if (stopphantram >= window.conf.stoploss) {
                                    localStorage.setItem("stoploss", 1);

                                    sendsms("Stoploss: " + Math.round(stopphantram, 2) + "%");
                                    stoploss = 1;
                                }

                            } else {

                                let profitphantram = ((blance - window.conf.vonbandau) / window.conf.vonbandau) * 100;

                                if (profitphantram >= window.conf.profit) {

                                    localStorage.setItem("profit", 1);
                                    sendsms("profit: " + Math.round(profitphantram, 2) + "%");

                                    profit = 1;
                                    //	hrome.runtime.reload()

                                }
                            }
                            val.tradeType = tradeview.tradetype;

                            sendsms(sms);
                            phantramvon = Math.round((blance * parseInt(window.conf.vol)) / 100, 2);
                            newdata = val;
                            newdata.uuid = window.conf.uuid;
                            newdata.name = tradeview.name;
                            newdata.slide = tradeview.slide;
                            newdata.tradetype = tradeview.slide;
                            newdata.blance = blance;

                            newdata.vol = phantramvon > 0 ? phantramvon : window.conf.vol;
                            localStorage.setItem("intrade", 0);

                            var tradelist = res.d.c;
                            if (xuid === 'tradeview' && xstop === 1) {
                                xtradeview = await postJSON('https://flowc14c039001lf61c.us01.totaljs.cloud/loop', {
                                    tradeview: tradeview,
                                    list: tradelist,
                                    config: window.conf,
                                    'blance': blance
                                });

                                tradeview.vol = xtradeview.vol;
                                tradeview.slide = xtradeview.slide;


                                res = await slide(tradeview.slide, tradeview.vol, tradeview.tradetype);

                                if (_has(res, "ok") && res.ok !== false) {


                                    blance = "";
                                    d = new Date();
                                    sendsms(datetime() + ' | ' + tradeview.slide + ' | ' + tradeview.vol + '$ | Live: ' + tradeview.tradetype);
                                    setTimeout(function () {
                                        sendsms('Wait 30s ...');
                                    }, 1000);
                                    tradetime = res.d.time;
                                    localStorage.setItem("locktrade", 1);
                                    check(tradetime, tradeview);

                                }

                            }

                            clearInterval(getclose);
                            resolve(true);


                        }
                    });


                }

            }, 7000);


            setTimeout(() => {

                clearInterval(getclose);
            }, 60000);
        });
    }, 30000);

}