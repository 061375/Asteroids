const fs = require('fs');
const terser = require('terser');
const path = require('path');

const sourceDirectory = './_'; // Modify this to specify your source directory
const outputDirectory = './'; // Modify this to specify your output directory
const addMinExt = false

// List of filenames and directory names to skip
const filesAndDirectoriesToSkip = ['minify.js', '.git', 'node_modules'];

function shouldSkip(directoryPath) {
  return filesAndDirectoriesToSkip.some((item) => {
    return directoryPath.includes(`/${item}`);
  });
}

function minifyFile(filePath, relativePath) {
  const code = fs.readFileSync(filePath, 'utf-8');

  terser.minify(code).then((minified) => {
    if (minified.error) {
      console.error(`Error minifying ${filePath}: ${minified.error}`);
    } else if (minified.code === undefined) {
      console.error(`Error minifying ${filePath}: Minified code is undefined`);
    } else {
      // Calculate the output path
      //const outputPath = path.join(outputDirectory, relativePath);
      const outputPath = path.join(
        outputDirectory,
        path.dirname(relativePath),
        path.basename(relativePath, '.js') + '.min.js'
      );

      // Ensure the destination directory exists before writing the minified file
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fs.writeFileSync(outputPath, minified.code);
      console.log(`Minified ${filePath} to ${outputPath}`);
    }
  });
}

function processDirectory(directoryPath, currentRelativePath) {
  if (shouldSkip(directoryPath)) {
    console.log(`Skipping directory ${directoryPath}`);
    return;
  }

  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error(err);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(directoryPath, file);
      const relativePath = path.join(currentRelativePath, file);

      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error(err);
          return;
        }

        if (stats.isDirectory()) {
          // Recursively process subdirectories
          processDirectory(filePath, relativePath);
        } else if (stats.isFile() && file.endsWith('.js') && file.indexOf(".min.") == -1) {
          console.log(`Attempting to minify ${filePath}`)
          // Minify JavaScript files and save to ./dist
          minifyFile(filePath, relativePath);
        }
      });
    });
  });
}

// Start processing the source directory
processDirectory(sourceDirectory, '');
