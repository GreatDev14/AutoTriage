import re

def bump_cache_and_fix_padding(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Failed to read {filepath}: {e}")
        return

    # Bump cache buster for JS
    content = re.sub(r'js/features-simple\.js\?v=13\.0', r'js/features-simple.js?v=14.0', content)
    content = re.sub(r'js/features-simple\.js\?v=13\.1', r'js/features-simple.js?v=14.0', content)
    # Just in case, replace any version:
    content = re.sub(r'js/features-simple\.js\?v=\d+\.\d+', r'js/features-simple.js?v=14.0', content)

    # Fix main-btn padding to be compact so they all fit on screen
    content = content.replace('padding:16px 20px; border:1px solid var(--border); border-radius: 20px;', 'padding:12px 16px; border:1px solid var(--border); border-radius: 20px;')
    content = content.replace('gap:16px;', 'gap:12px;')

    # Fix home-top padding so it takes less vertical space
    content = content.replace('padding:40px 24px 24px; text-align:left;', 'padding:24px 24px 16px; text-align:left;')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {filepath}")

bump_cache_and_fix_padding('simple.html')
bump_cache_and_fix_padding('netlify_deploy/simple.html')
