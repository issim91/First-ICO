rsync -r src/ docs/
rsync build/contracts/* docs/
git add .
git commit -m "Commit"
git push -u origin master