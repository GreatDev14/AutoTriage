import urllib.request, json, ssl

# Test the live Netlify function endpoint directly
url = 'https://autotriage.app/.netlify/functions/send-email'

data = json.dumps({
    'to': 'greatogah14@gmail.com',
    'name': 'AutoTriage Test',
    'phone': '08012345678',
    'spec': 'General Mechanic',
    'city': 'Lagos'
}).encode('utf-8')

req = urllib.request.Request(url, data=data, method='POST')
req.add_header('Content-Type', 'application/json')
req.add_header('Accept', 'application/json')

ctx = ssl.create_default_context()
try:
    with urllib.request.urlopen(req, context=ctx, timeout=20) as resp:
        result = json.loads(resp.read().decode())
        print('SUCCESS! Function response:', result)
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print('HTTP ERROR', e.code, ':', body)
except Exception as ex:
    print('EXCEPTION:', type(ex).__name__, '-', ex)
