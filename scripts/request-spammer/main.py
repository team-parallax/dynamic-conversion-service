import requests
import time

conv_url = 'http://localhost:3000/conversion/v2'

multipart_body = {
        'originalFormat' : (None, '.jpg'),
        'targetFormat' : (None, '.png'),
        'conversionFile' : ('corgi.jpg', open('corgi.jpg', 'rb'))
}

conv_reqs = []
for i in range(5):
    resp = requests.post(conv_url, files=multipart_body)
    js = resp.json()
    req = js['conversionId']
    conv_reqs.append({
        'status' : '',
        'id': req
    })
    time.sleep(1)


time.sleep(5)

while True:
    for req in conv_reqs:
        resp = requests.get('http://localhost:3000/conversion/' + req['id'])
        status = resp.json()['status']
        req['status'] = status
        print(req)
    print('==============================================')
    time.sleep(5)
        