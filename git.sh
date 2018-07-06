rsunc -r src/ docs/
rsunc -r build/contracts/* /docs
git add .
git commit -m "Version 1.0"
git push -u origin master