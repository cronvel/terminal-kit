


# User rules

# The first rule is the default rule, when invoking "make" without argument...
# Build every buildable things
all: install doc

# Just install things so it works, basicaly: it just performs a "npm install --production" ATM
install: log/npm-install.log

# Just install things so it works, basicaly: it just performs a "npm install" ATM
dev-install: log/npm-dev-install.log

# This run the JsHint & Mocha BDD test, display it to STDOUT & save it to log/mocha.log and log/jshint.log
test: log/jshint.log log/mocha.log

# This run the JsHint, display it to STDOUT & save it to log/jshint.log
lint: log/jshint.log

# This run the Mocha BDD test, display it to STDOUT & save it to log/mocha.log
unit: log/mocha.log

# This build the doc and README.md
doc: README.md

# This publish to NPM and push to Github, if we are on master branch only
publish: log/npm-publish.log log/github-push.log

# Clean temporary things, or things that can be automatically regenerated
clean: clean-all



# Variables

MOCHA=./node_modules/mocha/bin/mocha
JSHINT=./node_modules/jshint/bin/jshint --verbose



# Files rules

# JsHint STDOUT test
log/jshint.log: log/npm-dev-install.log lib/*.js lib/colorScheme/*.json lib/termconfig/*.js
	${JSHINT} lib/*.js lib/colorScheme/*.json lib/termconfig/*.js | tee log/jshint.log ; exit $${PIPESTATUS[0]}

# Mocha BDD STDOUT test
log/mocha.log: log/npm-dev-install.log lib/*.js lib/colorScheme/*.json lib/termconfig/*.js test/terminal-test.js
	${MOCHA} test/terminal-test.js -R spec | tee log/mocha.log ; exit $${PIPESTATUS[0]}

# README
README.md: documentation.md
	cat documentation.md > README.md

# Mocha Markdown BDD spec
bdd-spec.md: log/npm-dev-install.log lib/*.js lib/colorScheme/*.json lib/termconfig/*.js test/terminal-test.js
	${MOCHA} test/terminal-test.js -R markdown > bdd-spec.md

# Upgrade version in package.json
log/upgrade-package.log: lib/*.js lib/colorScheme/*.json lib/termconfig/*.js test/terminal-test.js demo/*.js documentation.md
	npm version patch -m "Upgrade package.json version to %s" | tee log/upgrade-package.log ; exit $${PIPESTATUS[0]}

# Publish to NPM
log/npm-publish.log: check-if-master-branch log/upgrade-package.log
	npm publish | tee log/npm-publish.log ; exit $${PIPESTATUS[0]}

# Push to Github/master
log/github-push.log: lib/*.js lib/colorScheme/*.json lib/termconfig/*.js test/terminal-test.js demo/*.js package.json
	#'npm version patch' create the git tag by itself... 
	#git tag v`cat package.json | grep version | sed -r 's/.*"([0-9.]*)".*/\1/'`
	git push origin master --tags | tee log/github-push.log ; exit $${PIPESTATUS[0]}

# NPM install
log/npm-install.log: package.json
	npm install --production | tee log/npm-install.log ; exit $${PIPESTATUS[0]}

# NPM install for developpement usage
log/npm-dev-install.log: package.json
	npm install | tee log/npm-dev-install.log ; exit $${PIPESTATUS[0]}



# PHONY rules

.PHONY: clean-all check-if-master-branch

# Delete files, mostly log and non-versioned files
clean-all:
	rm -rf log/*.log README.md bdd-spec.md node_modules

# This will fail if we are not on master branch (grep exit 1 if nothing found)
check-if-master-branch:
	git branch | grep  "^* master$$"


