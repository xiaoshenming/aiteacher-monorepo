const { encode } = require('gpt-tokenizer');

function countTokens(text) {
  return encode(text).length;
}

function estimateTokens(prompt, response) {
  return countTokens(prompt) + countTokens(response);
}

module.exports = { countTokens, estimateTokens };
