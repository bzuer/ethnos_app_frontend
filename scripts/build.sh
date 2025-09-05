#!/bin/bash

echo "Starting professional build process..."

if [ ! -d "node_modules" ]; then
    echo "Node modules not found. Installing dependencies..."
    npm install
fi

echo "Creating backup of existing minified files..."
if [ -d "static/css" ]; then
    find static/css -name "*.min.css" -exec cp {} {}.backup \;
fi
if [ -d "static/js" ]; then
    find static/js -name "*.min.js" -exec cp {} {}.backup \;
fi

echo "Building CSS with PostCSS, Autoprefixer, and cssnano..."
npm run build-css

echo "Building JavaScript with Terser optimization..."
npm run build-js

echo "Build completed! File size comparison:"
echo ""
echo "CSS Files:"
if [ -f "static/css/styles.dev.css" ] && [ -f "static/css/styles.min.css" ]; then
    dev_size=$(du -h static/css/styles.dev.css | cut -f1)
    min_size=$(du -h static/css/styles.min.css | cut -f1)
    echo "  styles.dev.css:  $dev_size"
    echo "  styles.min.css:  $min_size"
fi

echo ""
echo "JavaScript Files:"
for file in static/js/*.dev.js; do
    if [ -f "$file" ]; then
        basename=$(basename "$file" .dev.js)
        minfile="static/js/${basename}.min.js"
        if [ -f "$minfile" ]; then
            dev_size=$(du -h "$file" | cut -f1)
            min_size=$(du -h "$minfile" | cut -f1)
            echo "  ${basename}.dev.js:  $dev_size -> ${basename}.min.js: $min_size"
        fi
    fi
done

echo ""
echo "✅ Professional build process completed successfully!"
echo "📁 Minified files are ready for production use."