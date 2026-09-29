import re

with open('simple.html', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Extract the inner content of diag-result (specifically resultLoading and resultArea)
# We know the loader starts with <div id="resultLoading"
loader_start = text.find('<div id="resultLoading"')
area_end = text.find('</div>\n</div>', loader_start) # find end of screen-body
if loader_start != -1 and area_end != -1:
    extracted_content = text[loader_start:area_end]
    
    # Redesign the loader to match AutoTriage Red aesthetic
    extracted_content = extracted_content.replace('rgba(77,166,255,0.3)', 'rgba(230,57,70,0.3)')
    extracted_content = extracted_content.replace('border-top-color: #4da6ff', 'border-top-color: #e63946')
    extracted_content = extracted_content.replace('Bebas Neue', 'Inter, system-ui')
    extracted_content = extracted_content.replace('ANALYZING', 'ANALYZING...')
    extracted_content = extracted_content.replace('Space Mono\', monospace', 'Inter, system-ui')
    
    # Redesign the action buttons in the result area
    extracted_content = extracted_content.replace('background: white; color: #020202;', 'background: var(--fg); color: var(--bg);')
    extracted_content = extracted_content.replace('Bebas Neue\', sans-serif', 'Inter, system-ui')
    extracted_content = extracted_content.replace('font-size: 24px;', 'font-size: 16px; font-weight: 700;')
    extracted_content = extracted_content.replace('padding: 20px;', 'padding: 16px;')
    
    # 2. Insert extracted content into the end of #diagnose
    diagnose_end = text.find('<!-- Primary Action -->')
    if diagnose_end != -1:
        # Find the end of the diagnose screen body
        diagnose_body_end = text.find('</div>\n</div>', diagnose_end)
        
        # Insert extracted_content right before </div>\n</div> of diagnose
        text = text[:diagnose_body_end] + '\n\n    <!-- INJECTED RESULT AREA -->\n    ' + extracted_content + '\n  ' + text[diagnose_body_end:]
        
        # 3. Delete the entire diag-result screen
        diag_result_start = text.find('<div id="diag-result"')
        diag_result_end = text.find('</div>\n</div>', diag_result_start) + 13
        if diag_result_start != -1:
            text = text[:diag_result_start] + text[diag_result_end:]

# 4. Modify runDiagnosis() to not switch screens
js_switch1 = "document.getElementById('diagnose').classList.remove('active');"
js_switch2 = "document.getElementById('diag-result').classList.add('active');"

text = text.replace(js_switch1, "// Removed screen switch")
text = text.replace(js_switch2, "// Removed screen switch")

with open('simple.html', 'w', encoding='utf-8') as f:
    f.write(text)
print("Successfully moved results into the Diagnose screen and removed the separate Report screen.")
