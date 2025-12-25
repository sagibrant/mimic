@echo. Generate new ID for chrome extension.

@call openssl genrsa 2048 | openssl pkcs8 -topk8 -nocrypt -out agentExt.pem

@call openssl rsa -in agentExt.pem -pubout -outform DER | openssl base64 -A -out agentKey.txt
