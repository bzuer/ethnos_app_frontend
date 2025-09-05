#!/usr/bin/env python3

import os
import re
import sys

def minify_css(content):
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    lines = [line.strip() for line in content.split('\n') if line.strip()]
    content = '\n'.join(lines)
    content = re.sub(r'\s*{\s*', '{', content)
    content = re.sub(r'\s*}\s*', '}', content)
    content = re.sub(r'\s*;\s*', ';', content)
    content = re.sub(r'\s*:\s*', ':', content)
    return content

def minify_js(content):
    content = re.sub(r'^\s*//.*$', '', content, flags=re.MULTILINE)
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    lines = [line.strip() for line in content.split('\n') if line.strip()]
    content = '\n'.join(lines)
    content = re.sub(r'\s+', ' ', content)
    return content.strip()

def process_files():
    """Process all .dev files and create/update .min files"""
    static_dir = '/home/server/site_v2/static'
    
    css_dir = os.path.join(static_dir, 'css')
    for filename in os.listdir(css_dir):
        if filename.endswith('.dev.css'):
            dev_path = os.path.join(css_dir, filename)
            min_filename = filename.replace('.dev.css', '.min.css')
            min_path = os.path.join(css_dir, min_filename)
            
            with open(dev_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            minified = minify_css(content)
            
            with open(min_path, 'w', encoding='utf-8') as f:
                f.write(minified)
            
            print(f"Minified: {filename} -> {min_filename}")
    
    js_dir = os.path.join(static_dir, 'js')
    for filename in os.listdir(js_dir):
        if filename.endswith('.dev.js'):
            dev_path = os.path.join(js_dir, filename)
            min_filename = filename.replace('.dev.js', '.min.js')
            min_path = os.path.join(js_dir, min_filename)
            
            with open(dev_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            minified = minify_js(content)
            
            with open(min_path, 'w', encoding='utf-8') as f:
                f.write(minified)
            
            print(f"Minified: {filename} -> {min_filename}")

if __name__ == '__main__':
    print("Starting minification process...")
    process_files()
    print("Minification completed!")