#!/usr/bin/env python3
"""
1. Remove orphaned static modal HTML from netlify_deploy/index.html and index.html
2. Add a 6-second auto-dismiss timer to the inline mechanic form greeting card
"""

import os, re

def fix_file(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Delete orphaned static modal HTML block (around line 2736)
    # Pattern starts with <!-- mechSuccessModal created dynamically ... or the orphaned div content up to <!-- ADMIN DASHBOARD MODAL -->
    orphan_pattern = r'<!-- mechSuccessModal created dynamically by submitMechForm\(\) -->\s*<div style="font-size:58px; margin-bottom:8px;">.*?</div>\s*</div>'
    
    new_content, count = re.subn(orphan_pattern, '<!-- Static mechSuccessModal removed -->', content, flags=re.DOTALL)
    if count == 0:
        # Try alternate match if comment isn't exact
        orphan_pattern2 = r'<div style="font-size:58px; margin-bottom:8px;">\s*🎉\s*</div>.*?🔥 WELCOME TO AUTOTRIAGE NETWORK.*?closeSuccessModal\(\).*?</div>\s*</div>'
        new_content, count = re.subn(orphan_pattern2, '<!-- Static mechSuccessModal removed -->', content, flags=re.DOTALL)

    print(f"Orphaned static modal removal count in {filepath}: {count}")

    # 2. Add 6-second auto-restore timer to submitMechForm
    old_restore_code = """        var db = document.getElementById('mechDoneBtn');
        if (db) {
          db.onmouseover = function(){this.style.transform='translateY(-2px)';};
          db.onmouseout  = function(){this.style.transform='translateY(0)';};
          db.onclick = function(){
            formBox.style.opacity='0';
            setTimeout(function(){formBox.innerHTML=originalHTML;formBox.style.opacity='1';},250);
          };
        }"""

    new_restore_code = """        var restoreForm = function() {
          formBox.style.opacity = '0';
          setTimeout(function() {
            formBox.innerHTML = originalHTML;
            formBox.style.opacity = '1';
          }, 250);
        };

        // Auto-remove after 6 seconds (as requested by user)
        var autoTimer = setTimeout(function() {
          restoreForm();
        }, 6000);

        var db = document.getElementById('mechDoneBtn');
        if (db) {
          db.onmouseover = function(){this.style.transform='translateY(-2px)';};
          db.onmouseout  = function(){this.style.transform='translateY(0)';};
          db.onclick = function(){
            clearTimeout(autoTimer);
            restoreForm();
          };
        }"""

    if old_restore_code in new_content:
        new_content = new_content.replace(old_restore_code, new_restore_code, 1)
        print(f"6-second auto-restore timer added to {filepath}")
    else:
        print(f"Could not find restore code block in {filepath}")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

fix_file(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\netlify_deploy\index.html")
fix_file(r"c:\Users\ogah great\Documents\backup\PROJECTS1\AutoTriage\index.html")

print("Done fixing files!")
