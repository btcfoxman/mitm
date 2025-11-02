#!name=Sora Water Remove
#!desc=Get videoUrl from sora, and remove water from sora

[MITM]
hostname = sora.chatgpt.com

[Script]
testModify = type=http-response,pattern=^https?:\/\/sora\.chatgpt\.com,script-path=https://raw.githubusercontent.com/btcfoxman/mitm/main/sora.js,requires-body=true,max-size=0
