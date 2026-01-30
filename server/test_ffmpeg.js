const ffmpeg = require('fluent-ffmpeg');

try {
    const command = ffmpeg();
    console.log('ffmpeg is accessible.');
} catch (error) {
    console.error('Error accessing ffmpeg:', error.message);
}