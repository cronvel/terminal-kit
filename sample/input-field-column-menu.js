var term = require( 'terminal-kit' ).terminal;

var OPTIONS = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  'Lorem iaculis risus non libero efficitur lobortis.',
  'Lorem sem sem, mollis vitae mi eget, lacinia semper felis.',
  'Lorem finibus felis vitae ante volutpat tristique. In hac habitasse platea dictumst.'
];

term.bold.green('Test: ');
term.inputField({
    // autoComplete: commands,
    autoComplete: function (text) {
      var optionsStartingWith = getOptionsStartingWith(text)
      if (optionsStartingWith.length > 1) {
        var commonInitialSubstring =  getCommonInitialSubstring(optionsStartingWith)
        if (commonInitialSubstring !== text) {
          return commonInitialSubstring;
        }
      }
      var optionsContaining = getOptionsContaining(text)
      if (optionsContaining.length === 0) {
        return text
      }
      return optionsContaining.length === 1 ? optionsContaining[0] : optionsContaining;
    },
    autoCompleteMenu: true,
    autoCompleteHint: true,
  },
  function(error, input) {
    term.green("\nSelected: '%s'\n" , input);
    process.exit() ;
  }
);

function getOptionsStartingWith(text) {
  return OPTIONS.filter(function(cmd) { 
    return cmd.startsWith(text);
  })
}

function getOptionsContaining(text) {
  return OPTIONS.filter(function(cmd) {
    return cmd.toLowerCase().includes(text.toLowerCase());
  })
}

function getCommonInitialSubstring(commands) {
  if (commands.length === 0) return '';
  if (commands.length === 1) return commands[0];

  var commonInitialSubstring = []
  var index = 0
  for (var index = 0; index < commands[0].length ; index++) {
    var char = commands[0].charAt(index)
    if (commands.some(hasDifferentCharAtIndex(char, index))) {
      break;
    }
    commonInitialSubstring.push(char);
  }
  return commonInitialSubstring.join('');
}

function hasDifferentCharAtIndex(char, index) {
  return function(text) {
    return index >= text.length || text.charAt(index) !== char;
  }
}
