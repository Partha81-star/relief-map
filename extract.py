import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Match <script type="module"> ... </script>
script_match = re.search(r'<script type="module">(.*?)</script>', content, flags=re.DOTALL)
if script_match:
    with open('app.js', 'w', encoding='utf-8') as sf:
        sf.write(script_match.group(1).strip())
    content = content.replace(script_match.group(0), '<script type="module" src="app.js"></script>')

# Match <style> ... </style>
style_match = re.search(r'<style>(.*?)</style>', content, flags=re.DOTALL)
if style_match:
    style_content = style_match.group(1)
    style_content = style_content.replace('html, body { height: 100%; overflow: hidden; }', 'html, body { height: auto; min-height: 100vh; overflow-y: auto; overflow-x: hidden; }')
    style_content = style_content.replace('height:100vh;', 'min-height:100vh;')
    with open('style.css', 'w', encoding='utf-8') as sf:
        sf.write(style_content.strip())
    content = content.replace(style_match.group(0), '<link rel="stylesheet" href="style.css">')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
