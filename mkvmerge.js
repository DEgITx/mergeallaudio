const os = require('os');
const fs = require('fs');
const glob = require("glob")
const path = require('path')
const util = require('util')
const execFile = util.promisify(require('child_process').execFile);
const { execSync } = require('child_process');

let mkvmerge = path.join(__dirname, 'tools/mkvmerge.exe');

// Function to find mkvmerge in system PATH
const findMkvmergeInPath = () => {
    const pathDirs = process.env.PATH.split(path.delimiter);
    for (const dir of pathDirs) {
        const mkvmergePath = path.join(dir, 'mkvmerge');
        const mkvmergeExePath = path.join(dir, 'mkvmerge.exe');
        if (fs.existsSync(mkvmergePath)) {
            return mkvmergePath;
        }
        if (fs.existsSync(mkvmergeExePath)) {
            return mkvmergeExePath;
        }
    }
    return null;
};

// Check if mkvmerge is available in the system PATH
const mkvmergePath = findMkvmergeInPath();
if (mkvmergePath) {
    mkvmerge = mkvmergePath;
} else {
    console.log('mkvmerge not found in PATH, using local version if available.');
}

if (!fs.existsSync(mkvmerge)) {
    throw new Error('Cannot find mkvmerge');
}

const randomName = () => Math.random().toString(36).slice(2);

const merge = async (video, audios) => {
	if (audios.length == 0) {
		return;
	}
	console.log('merge', video, audios.length === 1 ? audios[0] : audios)

	const newFile = `${randomName()}.mkv`;
	await execFile(path.resolve(mkvmerge), [
		'--default-track', '0:yes',
		...audios,
		'--default-track', '1:no',
		video,
		'-o', newFile
	])
	fs.unlinkSync(video);
	fs.renameSync(newFile, video);
}

let videoNow = 0
const mergeAudios = (videos) => {
	const video = videos[videoNow++];

	if((typeof existCalled === 'undefined' || !existCalled) && videoNow === videos.length + 2)
	{
		existCalled = true;
		onExit()
	}

	if(!video)
		return

	const videoFileName = path.parse(video).name
  	glob(`**/${videoFileName}.+(aac|mka|mp3|opus|flac|ogg)`, async (er, audios) => {
  		if(!audios)
  			return;

  		await merge(video, audios)
  		mergeAudios(videos)
  	})
}

if(mkvmerge.includes('snapshot'))
{
	console.log('unpack temorary files')
	const buffer = fs.readFileSync(mkvmerge)
	mkvmerge = os.tmpdir() + '/' + path.basename(mkvmerge);
	fs.writeFileSync(mkvmerge, buffer)
}

onExit = () => {
	if (mkvmerge === path.join(__dirname, 'tools/mkvmerge.exe')) {
		console.log('cleanup temporary files');
		fs.unlinkSync(mkvmerge);
	}
}

glob("**/*.+(mp4|mkv)", (er, videos) => {
  // multiprocess
  mergeAudios(videos)
  mergeAudios(videos)
})

