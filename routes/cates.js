var Crawler = require("crawler");
var express = require('express');
var router = express.Router();
/*
const Agent = require('socks5-https-client/lib/Agent');
*/

var c = new Crawler({
  skipEventRequest: false,
  maxConnections: 30,
  method: 'GET',
  /*
  agentClass: Agent, //adding socks5 https agent
  agentOptions: {
    socksHost: '103.214.41.98',
    socksPort: 4145
  },
  */
});

/* GET home page. */
router.get('/:cate/:node', function (req, res, next) {
  if (parseInt(req.params.node) == 2) {
    var server = 'https://papers.gceguide.xyz/';
  } else {
    var server = 'https://papers.gceguide.com/';
  }
  c.queue([{
    uri: server + req.params.cate,
    callback: function (error, resC, done) {
      if (error) {
        console.log(error);
      } else {
        let $ = resC.$;
        let returnArray = {
          cates: new Array,
          count: 0
        };
        if (parseInt(req.params.node) == 2) {
          $("tr>td>a").each(function () {
            if ($(this).text() !== 'error_log') {
              returnArray.cates.push({
                'name': $(this).text()
              });
            }
          });
        } else {
          $(".dir>a").each(function () {
            if ($(this).text() !== 'error_log') {
              returnArray.cates.push({
                'name': $(this).text()
              });
            }
          });
        }
        returnArray.count = returnArray.cates.length;
        console.log(server + req.params.cate)
        res.send(JSON.stringify(returnArray));
      }
      done();
    }
  }]);
});

module.exports = router;