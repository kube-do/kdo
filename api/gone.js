module.exports = function handler(_request, response) {
  response.statusCode = 410;
  response.setHeader("Content-Type", "text/plain; charset=utf-8");
  response.setHeader("Cache-Control", "public, max-age=86400");
  response.end("410 Gone\n");
};
