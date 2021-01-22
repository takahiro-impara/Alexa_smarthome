const make_devices_response = require("./make_device_response.js");
const request = require('request');
const DEBUG_MON =  [
            {
                "endpointId": "demo_id",
                "manufacturerName": "オトヒメ",
                "friendlyName": "二階のトイレ",
                "description": "ダッシュボタン",
                "displayCategories": [
                    "SWITCH"
                ],
                "cookie": {
                    "key1": "このエンドポイントを参照するためのスキルの任意のキー／値のペアです。",
                    "key2": "複数のエントリーがある場合があります。",
                    "key3": "ただし、参照のためだけに使用してください。",
                    "key4": "現在のエンドポイントの状態を維持するのに適切な所ではありません。"
                },
                "capabilities": [
                    {
                        "type": "AlexaInterface",
                        "interface": "Alexa",
                        "version": "3"
                    },
                    {
                        "interface": "Alexa.MotionSensor",
                        "version": "3",
                        "type": "AlexaInterface",
                        "properties": {
                            "supported": [
                                {
                                    "name": "detectionState"
                                }
                            ],
                            "proactivelyReported": true,
                            "retrievable": true
                        }
                    }
                ]
            }
        ];
    
function getSampleDate(){
  const dt = new Date(Date.now());
  return dt.toISOString();
}

function log(message, message1, message2) {
    console.log(message + message1 + message2);
}

exports.handler = function (request, context) {
    if (request.directive.header.namespace === 'Alexa.Discovery' && request.directive.header.name === 'Discover') {
        log("DEBUG:", "Alexa.Discovery:",  JSON.stringify(request));
        handleDiscovery(request, context);
    }
    else if (request.directive.header.namespace === 'Alexa.ToggleController') {
        log("DEBUG:", "Alexa.ToggleController:", JSON.stringify(request));
        let powerResult = handleToggleControl(request, context);
        //handleChengeReport(request, context, powerResult);
    }
    else if (request.directive.header.namespace === 'Alexa.PowerController') {
        log("DEBUG:", "Alexa.PowerController:", JSON.stringify(request));
        handlePowerControl(request, context);
    }
    else if (request.directive.header.name === 'ReportState'){
      return handleReportState(request, context);
    }
    else if (request.directive.header.name === 'AcceptGrant') {
        log("DEBUG:", "AcceptGrant:", JSON.stringify(request));    // AcceptGrantの内容をlogに出力
        var response = {
            "event": {
              "header": {
                "namespace": "Alexa.Authorization",
                "name": "AcceptGrant.Response",
                "messageId": request.directive.header.messageId,
                "payloadVersion": "3"
              },
              "payload": {}
           }
        };
        context.succeed(response);
        return response;
    }
    
    else {
      log("DEBUG:", "Other request:", JSON.stringify(request));
      log("DEBUG:", "Other context:", JSON.stringify(context));
    }
    function handleReportState(request, context){
      var correlationToken = request.directive.header.correlationToken;
      var endpointId = request.directive.endpoint.endpointId;
      var messageId = request.directive.header.messageId;
      var requestToken = request.directive.endpoint.scope.token;
      var instance = request.directive.header.instance;
      var response = {
          "event": {
            "header": {
              "namespace": "Alexa",
              "name": "StateReport",
              "messageId": messageId,
              "correlationToken": correlationToken,
              "payloadVersion": "3"
            },
            "endpoint": {
              "scope": {
                "type": "BearerToken",
                "token":  requestToken,
              },
              "endpointId": endpointId
            },
            "payload": {}
          },
          "context": {
            "properties": []
          }
        };
        let add_properties = [
          {
            "namespace": "Alexa.EndpointHealth",
            "name": "connectivity",
            "value": {
              "value": "OK"
            },
            "timeOfSample": getSampleDate(),
            "uncertaintyInMilliseconds": 0
          }  
        ];
        for(let count=1; count <= 20; count++){
            let add_property = {
                "namespace": "Alexa.ToggleController",
                "instance": "KOICHI." + String(count),
                "name": "toggleState",
                "value": "ON",
                "timeOfSample": getSampleDate(),
                "uncertaintyInMilliseconds": 500
              }
            add_properties.push(add_property);
        }
        response.context.properties = add_properties;
        log("DEBUG", " Alexa StateReport ", JSON.stringify(response));
        context.succeed(response);
        //return response;
    }
    function handleChengeReport(request, context, powerResult){
      var requestToken = request.directive.endpoint.scope.token;
      var endpointId = request.directive.endpoint.endpointId;
      var instance = request.directive.header.instance;
      var requestMethod = request.directive.header.name;
      var response = {
        "event": {
          "header": {
            "namespace": "Alexa",
            "name": "ChangeReport",
            "messageId": request.directive.header.messageId,
            "payloadVersion": "3"
          },
          "endpoint": {
            "scope": {
              "type": "BearerToken",
              "token": requestToken
            },
            "endpointId": endpointId
          },
          "payload": {
            "change": {
              "cause": {
                "type": "PHYSICAL_INTERACTION"
              },
              "properties": [
                {
                  "namespace": "Alexa.ToggleController",
                  "instance": instance,
                  "name": "toggleState",
                  "value": powerResult,
                  "timeOfSample": getSampleDate(),
                  "uncertaintyInMilliseconds": 500
                },
                {
                  "namespace": "Alexa.EndpointHealth",
                  "name": "connectivity",
                  "value": {
                    "value": "OK"
                  },
                  "timeOfSample": getSampleDate(),
                  "uncertaintyInMilliseconds": 500
                }
              ]
            }
          }
        },
        "context": {}
      };
      const ALEXA_URI = "https://api.fe.amazonalexa.com/v3/events";
      const ALEXA_HEADERS = {
          "Content-Type": "application/json;charset=UTF-8",
          "Authorization": "Bearer " + requestToken
      };
      log("DEBUG", "Alexa ChangeReport ", JSON.stringify(response));
      let options = {
        url: ALEXA_URI,
        headers: ALEXA_HEADERS,
        form: response,
        method: 'POST'
      };
      console.log("request DEBUG");
      request(options, function (error, res, body) {
        if(error){
          console.log(error);
          return;
        }
        console.log(res);
        console.log(body);
      });
    }
    function handlePowerControl(request, context){
      var requestMethod = request.directive.header.name;
      var responseHeader = request.directive.header;
      var endpointId = request.directive.endpoint.endpointId;
      responseHeader.namespace = "Alexa";
      responseHeader.name = "Response";
      responseHeader.messageId = responseHeader.messageId + "-R";
      
      var requestToken = request.directive.endpoint.scope.token;
      var powerResult;
      
      if(requestMethod === "TurnOn"){
        powerResult = "ON";
      }else{
        powerResult = "OFF";
      }
      
      var contextResult = {
        "properties": [{
          "namespace":"Alexa.PowerController",
          "name": "powerState",
          "value": powerResult,
          "timeOfSample": getSampleDate(),
          "uncertaintyInMilliseconds": 500
        }]
      };
      var response = {
        context: contextResult,
        event: {
          header: responseHeader,
          endpoint: {
            scope: {
              type: "BearerToken",
              token: requestToken
            },
            endpointId: endpointId
          },
          payload: {}
        }
      };
      log("DEBUG", "Alexa.PowerController ", JSON.stringify(response));
      context.succeed(response);
    }
    function handleToggleControl(request, context){
      var requestMethod = request.directive.header.name;
      var responseHeader = request.directive.header;
      var endpointId = request.directive.endpoint.endpointId;
      responseHeader.namespace = "Alexa";
      responseHeader.name = "Response";
      responseHeader.messageId = responseHeader.messageId + "-R";
      
      var requestToken = request.directive.endpoint.scope.token;
      var instance = request.directive.header.instance;
      var powerResult;
      
      if(requestMethod === "TurnOn"){
        powerResult = "ON";
      }else{
        powerResult = "OFF";
      }
      
      var contextResult = {
        "properties": [{
          "namespace":"Alexa.ToggleController",
          "instance": instance,
          "name": "toggleState",
          "value": powerResult,
          "timeOfSample": getSampleDate(),
          "uncertaintyInMilliseconds": 500
        }]
      };
      var response = {
        context: contextResult,
        event: {
          header: responseHeader,
          endpoint: {
            scope: {
              type: "BearerToken",
              token: requestToken
            },
            endpointId: endpointId
          },
          payload: {}
        }
      };
      log("DEBUG FUNC2", "Alexa.ToggleController ", JSON.stringify(response));
      context.succeed(response);
      return powerResult;
    }
    function handleDiscovery(request, context) {
        const payload = {
            "endpoints": make_devices_response.make_device_response()
            //endpoints: DEBUG_MON
            /*
            "endpoints": [
              RES
            ]
            */
            
        };
        const header = request.directive.header;
        header.name = "Discover.Response";
        log("DEBUG", "Discovery Response:", JSON.stringify({ header: header, payload: payload }));
        context.succeed({ event: { header: header, payload: payload } });
    }
};