import zipfile, os
root = 'apiproxy'
out = 'oauth-demo.zip'
if os.path.exists(out):
    os.remove(out)
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    for dp, _, fs in os.walk(root):
        for f in fs:
            full = os.path.join(dp, f)
            z.write(full, full.replace(os.sep, '/'))
with zipfile.ZipFile(out) as z:
    print('\n'.join(z.namelist()))
