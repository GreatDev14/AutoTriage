import os

def fix_stray(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    bad_str = '<div id="homeDashWidgets" style="padding:0 24px;"></div>\n    </div>\n  </div>'
    good_str = '<div id="homeDashWidgets" style="padding:0 24px;"></div>'
    
    if bad_str in content:
        content = content.replace(bad_str, good_str)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print('Fixed in', filepath)
    else:
        print('Not found in', filepath)

fix_stray(r'c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\simple.html')
fix_stray(r'c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\simple.html')
fix_stray(r'c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\app.html')
fix_stray(r'c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\app.html')
