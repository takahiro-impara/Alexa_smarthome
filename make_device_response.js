const fs = require('fs');
const uuid = require('node-uuid');

const test = require("./make_device_response.js");
const FILENAME = './device.txt'

function log(message) {
    console.log(message);
}
function generateMessageID() {
    return uuid.v1();
}
function read_text(){
    let text = fs.readFileSync(FILENAME, 'utf-8');
    return text;
}

exports.make_device_response = function() {
    let devices_info = [];
    let devices = read_text().toString().split('\n');
    let endpointId = 0;
    for (let device of devices) {
        let device_info = {};
        endpointId += 1;
        device_info = {
            "endpointId": endpointId,
            "manufacturerName": "Double Confirmation Co., Ltd.",
            "description": "確認用モックデバイスの応答",
            "displayCategories": ["OTHER"],
            "cookie": {},
            "friendlyName": "",
            "capabilities": [
                {
                	"type": "AlexaInterface",
                	"interface": "Alexa.ToggleController",
                	"instance": "KOICHI." + String(endpointId),
                	"version": "3",
                 	"properties": {
                     	"supported": [
                        	{
                        		"name": "toggleState"
                        	}
                    ],
                    "proactivelyReported": true,
                    "retrievable": true
                  },
                 	"capabilityResources": {
                 	"friendlyNames": []
                  }
                },
                {
                  "type": "AlexaInterface",
                  "interface": "Alexa.PowerController",
                  "version": "3",
                  "properties": {
                    "supported": [
                      {
                        "name": "powerState"
                      }
                    ],
                    "proactivelyReported": true,
                    "retrievable": true
                  }
                },
                /*
                {
                  "type": "AlexaInterface",
                  "interface": "Alexa",
                  "version": "3"
                },
                {
                    "type": "AlexaInterface",
                    "interface": "Alexa.EndpointHealth",
                    "version": "3",
                    "properties": {
                        "supported":[
                            {
                                "name": "connectivity"
                            }    
                        ],
                        "proactivelyReported": true,
                        "retrievable": true
                    }
                },
                */
            ]
        }
        let device_block = device.toString().split(',');
        let friendlyNames = [];
        
        for(let count=0; count < device_block.length; count++){
            if(count === 0){
                var friendlyName = device_block[count];
            }else{
                let add_friendlynames_info = {
                 	"@type": "text",
                 	"value": {
                      "text": device_block[count],
                      "locale": "ja-JP"
                    }
                }
            friendlyNames.push(add_friendlynames_info);
            }
        }
        device_info.friendlyName = friendlyName;
        device_info.capabilities[0].capabilityResources.friendlyNames = friendlyNames;
        devices_info.push(device_info);
        device_info.capabilities[0].verificationsRequired = [
                    {
                        "directive": "TurnOn",
                        "methods": [
                            {
                                "@type": "Confirmation"
                            }
                        ]
                    },
                    {
                        "directive": "TurnOff",
                        "methods": [
                            {
                                "@type": "Confirmation"
                            }
                        ]
                    }
                ];
    }
    return devices_info;
}

log(test.make_device_response());