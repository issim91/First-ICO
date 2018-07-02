rsync -r src/ docs/
rsync build/contracts/* docs/
git add .
git commit -m "Commit v 0.3"
git push -u origin master