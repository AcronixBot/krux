import * as glob from 'glob';
import * as fs from 'fs';
(() => {
  const now = Date.now();

  const shortQuery = "test0408";

  const wildcardPattern = `${shortQuery}_cache_*`;

  // Find files matching the wildcard pattern
  const matchingFiles = glob.sync(wildcardPattern);

  if (matchingFiles.length === 0) {
    return console.log(null);
  }

  // Check if the time difference between the first matching file's date in the name and now is greater than one hour (3600000 milliseconds)
  const firstMatchingFile = matchingFiles[0];
  const fileName = firstMatchingFile;
  const datePart = fileName.match(/\d{13}/);

  if (datePart) {
    const fileTimestamp = parseInt(datePart[0], 10);
    if (now - fileTimestamp > 3600000) {
      return console.log(null);
    }
  }

  // Read and return the content of the first matching file
  const fileContent = fs.readFileSync(fileName, "utf-8");
  return console.log(fileContent);
})();
