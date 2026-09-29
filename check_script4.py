import re

with open('netlify_deploy/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

scripts = re.findall(r'<script>(.*?)</script>', html, re.DOTALL)
s4 = scripts[4]

lines = s4.split('\n')
print(f"Total lines in Script 4: {len(lines)}")

stack = []
for i, line in enumerate(lines):
    # simple scanner
    in_str = None
    for col, char in enumerate(line):
        if in_str:
            if char == in_str and (col == 0 or line[col-1] != '\\'):
                in_str = None
        else:
            if char in "'\"`":
                in_str = char
            elif char in '{(':
                stack.append((char, i+1, line.strip()))
            elif char == '}':
                if stack and stack[-1][0] == '{':
                    stack.pop()
                else:
                    print(f"Unmatched }} at line {i+1}: {line.strip()}")
            elif char == ')':
                if stack and stack[-1][0] == '(':
                    stack.pop()
                else:
                    print(f"Unmatched ) at line {i+1}: {line.strip()}")

print(f"\nRemaining unclosed symbols ({len(stack)}):")
for item in stack:
    print(f"  Line {item[1]}: {item[0]} -> {item[2][:80]}")
